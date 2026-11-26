import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import {
  PLAN_CONFIG,
  enforceGracePeriodForWorkspace,
  type PlanCode,
} from "@/lib/billing";

async function getOrCreateUserWorkspace() {
  const sessionUser = await getSessionUser();
  const email = sessionUser?.email || "founder@acme.dev";
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: sessionUser?.name || "MergeMint Developer" },
  });

  let workspace = await prisma.workspace.findFirst({
    where: { ownerId: user.id },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: `${user.name || "My"} Workspace`,
        slug: `ws-${user.id.slice(0, 8)}`,
        ownerId: user.id,
        plan: "HOBBY",
        billingStatus: "ACTIVE",
        autoPayEnabled: true,
      },
    });
  }

  return enforceGracePeriodForWorkspace(workspace.id);
}

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      plan: "HOBBY" as PlanCode,
      billingStatus: "ACTIVE",
      autoPayEnabled: true,
      razorpayMandateId: null,
      paymentMethodBrand: null,
      paymentMethodLast4: null,
      purchasedAt: null,
      currentPeriodEnd: null,
      gracePeriodEndsAt: null,
      transactions: [],
    });
  }

  try {
    const workspace = await getOrCreateUserWorkspace();
    if (!workspace) {
      return NextResponse.json({ ok: true, plan: "HOBBY", transactions: [] });
    }

    const transactions = await prisma.paymentTransaction.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const latestSuccess = transactions.find((t) => t.status === "SUCCESS");

    return NextResponse.json({
      ok: true,
      plan: workspace.plan,
      billingStatus: workspace.billingStatus,
      autoPayEnabled: workspace.autoPayEnabled,
      razorpayMandateId: workspace.razorpayMandateId,
      paymentMethodBrand: workspace.paymentMethodBrand,
      paymentMethodLast4: workspace.paymentMethodLast4,
      purchasedAt: latestSuccess?.createdAt || workspace.createdAt,
      currentPeriodEnd: workspace.currentPeriodEnd,
      gracePeriodEndsAt: workspace.gracePeriodEndsAt,
      transactions,
    });
  } catch {
    return NextResponse.json({
      ok: true,
      plan: "HOBBY" as PlanCode,
      billingStatus: "ACTIVE",
      autoPayEnabled: true,
      transactions: [],
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      action: "create_order" | "verify_payment" | "toggle_autopay";
      plan?: PlanCode;
      paymentMethod?: "upi" | "card" | "netbanking";
      paymentLast4?: string;
      orderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
      autoPayEnabled?: boolean;
    };

    const targetPlan: PlanCode =
      body.plan === "PRO" || body.plan === "TEAM" ? body.plan : "PRO";
    const planInfo = PLAN_CONFIG[targetPlan];

    if (body.action === "toggle_autopay") {
      if (isDatabaseConfigured()) {
        const ws = await getOrCreateUserWorkspace();
        if (ws) {
          await prisma.workspace.update({
            where: { id: ws.id },
            data: { autoPayEnabled: Boolean(body.autoPayEnabled) },
          });
        }
      }
      return NextResponse.json({
        ok: true,
        autoPayEnabled: Boolean(body.autoPayEnabled),
      });
    }

    if (body.action === "create_order") {
      const keyId =
        process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      const amountPaise = planInfo.amountInr * 100;
      let orderId = `order_mm_${Date.now()}`;
      let mode: "razorpay_live" | "razorpay_checkout" = "razorpay_checkout";

      if (keyId && keySecret) {
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amountPaise,
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
            notes: {
              plan: targetPlan,
              autoPay: "true",
            },
          }),
        });

        if (!orderRes.ok) {
          const errText = await orderRes.text();
          return NextResponse.json(
            { error: `Razorpay order creation failed: ${errText}` },
            { status: 502 }
          );
        }

        const rzpOrder = (await orderRes.json()) as { id: string };
        orderId = rzpOrder.id;
        mode = "razorpay_live";
      }

      if (isDatabaseConfigured()) {
        const ws = await getOrCreateUserWorkspace();
        if (ws) {
          await prisma.paymentTransaction.create({
            data: {
              orderId,
              plan: targetPlan,
              amountInr: planInfo.amountInr,
              amountUsd: planInfo.amountUsd,
              paymentMethod: "upi",
              autoPay: true,
              status: "PENDING",
              workspaceId: ws.id,
            },
          });
        }
      }

      return NextResponse.json({
        ok: true,
        mode,
        orderId,
        keyId: keyId || null,
        amountInr: planInfo.amountInr,
        amountPaise,
        currency: "INR",
        plan: targetPlan,
      });
    }

    // Verify Razorpay payment signature & save subscription + payment details
    const orderId = body.orderId || `order_mm_${Date.now()}`;
    const paymentId = body.razorpayPaymentId || `pay_mm_${Date.now()}`;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keySecret && body.razorpaySignature) {
      const expected = crypto
        .createHmac("sha256", keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      const a = Buffer.from(expected);
      const b = Buffer.from(body.razorpaySignature);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return NextResponse.json(
          { error: "Invalid Razorpay payment signature" },
          { status: 401 }
        );
      }
    }

    const mandateId = `rzp_mnd_${Date.now()}`;
    const methodBrand =
      body.paymentMethod === "card"
        ? "Razorpay Card AutoPay"
        : body.paymentMethod === "netbanking"
          ? "Razorpay NetBanking"
          : "Razorpay UPI AutoPay";
    const last4 =
      body.paymentLast4 || (body.paymentMethod === "card" ? "4242" : "okicici");
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (isDatabaseConfigured()) {
      const ws = await getOrCreateUserWorkspace();
      if (ws) {
        await prisma.workspace.update({
          where: { id: ws.id },
          data: {
            plan: targetPlan,
            billingStatus: "ACTIVE",
            autoPayEnabled: true,
            razorpayMandateId: mandateId,
            paymentMethodBrand: methodBrand,
            paymentMethodLast4: last4,
            currentPeriodEnd: periodEnd,
            gracePeriodEndsAt: null,
          },
        });

        await prisma.paymentTransaction.upsert({
          where: { orderId },
          update: {
            razorpayPaymentId: paymentId,
            status: "SUCCESS",
            paymentMethod: body.paymentMethod || "upi",
            autoPay: true,
          },
          create: {
            orderId,
            razorpayPaymentId: paymentId,
            plan: targetPlan,
            amountInr: planInfo.amountInr,
            amountUsd: planInfo.amountUsd,
            paymentMethod: body.paymentMethod || "upi",
            autoPay: true,
            status: "SUCCESS",
            workspaceId: ws.id,
          },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      plan: targetPlan,
      billingStatus: "ACTIVE",
      autoPayEnabled: true,
      razorpayMandateId: mandateId,
      paymentMethodBrand: methodBrand,
      paymentMethodLast4: last4,
      currentPeriodEnd: periodEnd.toISOString(),
      orderId,
      razorpayPaymentId: paymentId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Razorpay billing error" },
      { status: 400 }
    );
  }
}

