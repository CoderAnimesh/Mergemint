import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { GRACE_PERIOD_DAYS, PLAN_CONFIG, type PlanCode } from "@/lib/billing";

function verifyGoKwikSignature(payload: string, sig: string | null): boolean {
  const secret = process.env.GOKWIK_APP_SECRET;
  if (!secret) return true;
  if (!sig) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-gokwik-signature");

  if (!verifyGoKwikSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid GoKwik signature" }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody) as {
      event:
        | "payment.success"
        | "subscription.autopay.success"
        | "subscription.autopay.failed";
      order_id?: string;
      txn_id?: string;
      mandate_id?: string;
      workspace_id?: string;
      plan?: PlanCode;
      payment_method?: string;
    };

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ ok: true, event: body.event });
    }

    const orderId = body.order_id || `gk_wh_${Date.now()}`;
    const existingTxn = await prisma.paymentTransaction.findUnique({
      where: { orderId },
    });

    const workspaceId = body.workspace_id || existingTxn?.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    if (
      body.event === "payment.success" ||
      body.event === "subscription.autopay.success"
    ) {
      const targetPlan: PlanCode =
        body.plan || (existingTxn?.plan as PlanCode) || "PRO";
      const nextPeriod = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          plan: targetPlan,
          billingStatus: "ACTIVE",
          autoPayEnabled: true,
          gokwikMandateId: body.mandate_id || undefined,
          currentPeriodEnd: nextPeriod,
          gracePeriodEndsAt: null,
        },
      });

      await prisma.paymentTransaction.upsert({
        where: { orderId },
        update: { status: "SUCCESS", gokwikTxnId: body.txn_id },
        create: {
          orderId,
          gokwikTxnId: body.txn_id,
          plan: targetPlan,
          amountInr: PLAN_CONFIG[targetPlan].amountInr,
          amountUsd: PLAN_CONFIG[targetPlan].amountUsd,
          paymentMethod: body.payment_method || "upi",
          autoPay: true,
          status: "SUCCESS",
          workspaceId,
        },
      });
    } else if (body.event === "subscription.autopay.failed") {
      const graceEnds = new Date(
        Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
      );
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          billingStatus: "PAST_DUE",
          gracePeriodEndsAt: graceEnds,
        },
      });
    }

    return NextResponse.json({ ok: true, event: body.event });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook error" },
      { status: 400 }
    );
  }
}

