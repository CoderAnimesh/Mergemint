import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { GRACE_PERIOD_DAYS, PLAN_CONFIG, type PlanCode } from "@/lib/billing";

function verifyRazorpayWebhook(payload: string, sig: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!sig) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifyRazorpayWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid Razorpay signature" }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody) as {
      event: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            method?: string;
            notes?: { plan?: PlanCode; workspaceId?: string };
          };
        };
      };
    };

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ ok: true, event: body.event });
    }

    const payment = body.payload?.payment?.entity;
    const orderId = payment?.order_id;
    if (!orderId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const existingTxn = await prisma.paymentTransaction.findUnique({
      where: { orderId },
    });
    const workspaceId = payment?.notes?.workspaceId || existingTxn?.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    if (body.event === "payment.captured" || body.event === "subscription.charged") {
      const targetPlan: PlanCode =
        payment?.notes?.plan || (existingTxn?.plan as PlanCode) || "PRO";
      const nextPeriod = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          plan: targetPlan,
          billingStatus: "ACTIVE",
          autoPayEnabled: true,
          currentPeriodEnd: nextPeriod,
          gracePeriodEndsAt: null,
        },
      });

      await prisma.paymentTransaction.upsert({
        where: { orderId },
        update: {
          status: "SUCCESS",
          razorpayPaymentId: payment?.id,
          paymentMethod: payment?.method || "upi",
        },
        create: {
          orderId,
          razorpayPaymentId: payment?.id,
          plan: targetPlan,
          amountInr: PLAN_CONFIG[targetPlan].amountInr,
          amountUsd: PLAN_CONFIG[targetPlan].amountUsd,
          paymentMethod: payment?.method || "upi",
          autoPay: true,
          status: "SUCCESS",
          workspaceId,
        },
      });
    } else if (body.event === "payment.failed" || body.event === "subscription.halted") {
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
      { error: error instanceof Error ? error.message : "Razorpay webhook error" },
      { status: 400 }
    );
  }
}

