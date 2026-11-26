import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { GRACE_PERIOD_DAYS, PLAN_CONFIG, type PlanCode } from "@/lib/billing";

export async function GET(req: NextRequest) {
  return handleAutoPaySweep(req);
}

export async function POST(req: NextRequest) {
  return handleAutoPaySweep(req);
}

async function handleAutoPaySweep(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, cancelledCount: 0, renewedCount: 0 });
  }

  const now = new Date();

  // 1. Cancel plans where AutoPay failed and 3-day grace period has expired
  const expiredGrace = await prisma.workspace.findMany({
    where: {
      billingStatus: "PAST_DUE",
      gracePeriodEndsAt: { lte: now },
    },
  });

  for (const ws of expiredGrace) {
    await prisma.workspace.update({
      where: { id: ws.id },
      data: {
        plan: "HOBBY",
        billingStatus: "CANCELLED",
        autoPayEnabled: false,
        gracePeriodEndsAt: null,
      },
    });
  }

  // 2. Attempt AutoPay renewal for due active subscriptions
  const dueWorkspaces = await prisma.workspace.findMany({
    where: {
      plan: { in: ["PRO", "TEAM"] },
      billingStatus: "ACTIVE",
      autoPayEnabled: true,
      currentPeriodEnd: { lte: now },
    },
  });

  let renewedCount = 0;
  for (const ws of dueWorkspaces) {
    const hasMandate = Boolean(ws.gokwikMandateId);
    const planInfo = PLAN_CONFIG[ws.plan as PlanCode];

    if (hasMandate) {
      const nextPeriod = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await prisma.workspace.update({
        where: { id: ws.id },
        data: { currentPeriodEnd: nextPeriod },
      });
      await prisma.paymentTransaction.create({
        data: {
          orderId: `gk_auto_${Date.now()}_${ws.id.slice(0, 6)}`,
          gokwikTxnId: `gktxn_auto_${Date.now()}`,
          plan: ws.plan,
          amountInr: planInfo.amountInr,
          amountUsd: planInfo.amountUsd,
          paymentMethod: ws.paymentMethodBrand || "upi",
          autoPay: true,
          status: "SUCCESS",
          workspaceId: ws.id,
        },
      });
      renewedCount += 1;
    } else {
      // No valid mandate -> start 3-day grace period before auto-cancelling
      const graceEnds = new Date(
        Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
      );
      await prisma.workspace.update({
        where: { id: ws.id },
        data: {
          billingStatus: "PAST_DUE",
          gracePeriodEndsAt: graceEnds,
        },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    cancelledCount: expiredGrace.length,
    renewedCount,
    checkedAt: now.toISOString(),
  });
}

