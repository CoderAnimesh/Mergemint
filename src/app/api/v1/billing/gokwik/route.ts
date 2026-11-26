import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import {
  PLAN_CONFIG,
  GRACE_PERIOD_DAYS,
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
      paymentMethodBrand: null,
      paymentMethodLast4: null,
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
      gokwikMandateId: workspace.gokwikMandateId,
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
      action:
        | "create_order"
        | "confirm_payment"
        | "toggle_autopay"
        | "simulate_autopay_failure";
      plan?: PlanCode;
      paymentMethod?: "upi" | "card" | "netbanking";
      paymentLast4?: string;
      orderId?: string;
      gokwikTxnId?: string;
      gokwikSignature?: string;
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

    if (body.action === "simulate_autopay_failure") {
      const graceEnds = new Date(
        Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
      );
      if (isDatabaseConfigured()) {
        const ws = await getOrCreateUserWorkspace();
        if (ws) {
          await prisma.workspace.update({
            where: { id: ws.id },
            data: {
              billingStatus: "PAST_DUE",
              gracePeriodEndsAt: graceEnds,
            },
          });
          await prisma.paymentTransaction.create({
            data: {
              orderId: `gk_auto_fail_${Date.now()}`,
              plan: ws.plan,
              amountInr: PLAN_CONFIG[ws.plan as PlanCode].amountInr,
              amountUsd: PLAN_CONFIG[ws.plan as PlanCode].amountUsd,
              paymentMethod: ws.paymentMethodBrand || "upi",
              autoPay: true,
              status: "FAILED",
              workspaceId: ws.id,
            },
          });
        }
      }
      return NextResponse.json({
        ok: true,
        billingStatus: "PAST_DUE",
        gracePeriodEndsAt: graceEnds.toISOString(),
      });
    }

    if (body.action === "create_order") {
      const orderId = `gk_ord_${Date.now()}`;
      const appId = process.env.GOKWIK_APP_ID;
      const appSecret = process.env.GOKWIK_APP_SECRET;
      const merchantId = process.env.GOKWIK_MERCHANT_ID;

      let checkoutUrl: string | null = null;
      let mode: "gokwik_live" | "gokwik_checkout" = "gokwik_checkout";

      if (appId && appSecret && merchantId) {
        try {
          const orderRes = await fetch(
            process.env.GOKWIK_API_URL || "https://api.gokwik.co/v1/order/create",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                appid: appId,
                appsecret: appSecret,
              },
              body: JSON.stringify({
                merchant_id: merchantId,
                order_id: orderId,
                amount: planInfo.amountInr,
                currency: "INR",
                auto_pay: true,
                subscription_interval: "monthly",
                redirect_url: `${
                  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
                }/dashboard`,
                notes: { plan: targetPlan },
              }),
            }
          );

          if (orderRes.ok) {
            const gkData = (await orderRes.json()) as {
              data?: { checkout_url?: string; order_id?: string };
            };
            checkoutUrl = gkData.data?.checkout_url || null;
            mode = "gokwik_live";
          }
        } catch {
          // Fall back to embedded checkout modal if live endpoint is unreachable
        }
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
        appId: appId || null,
        merchantId: merchantId || null,
        checkoutUrl,
        amountInr: planInfo.amountInr,
        amountUsd: planInfo.amountUsd,
        plan: targetPlan,
      });
    }

    // Confirm / Verify GoKwik payment and save payment + AutoPay mandate details
    const orderId = body.orderId || `gk_ord_${Date.now()}`;
    const appSecret = process.env.GOKWIK_APP_SECRET;
    if (appSecret && body.gokwikSignature) {
      const expected = crypto
        .createHmac("sha256", appSecret)
        .update(`${orderId}|${body.gokwikTxnId || ""}`)
        .digest("hex");
      if (expected !== body.gokwikSignature) {
        return NextResponse.json(
          { error: "Invalid GoKwik payment signature" },
          { status: 401 }
        );
      }
    }

    const txnId = body.gokwikTxnId || `gktxn_${Date.now()}`;
    const mandateId = `gk_mnd_${Date.now()}`;
    const methodBrand =
      body.paymentMethod === "card"
        ? "VISA / Mastercard"
        : body.paymentMethod === "netbanking"
          ? "NetBanking AutoPay"
          : "UPI AutoPay";
    const last4 = body.paymentLast4 || (body.paymentMethod === "card" ? "4242" : "okicici");
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
            gokwikMandateId: mandateId,
            paymentMethodBrand: methodBrand,
            paymentMethodLast4: last4,
            currentPeriodEnd: periodEnd,
            gracePeriodEndsAt: null,
          },
        });

        await prisma.paymentTransaction.upsert({
          where: { orderId },
          update: {
            gokwikTxnId: txnId,
            status: "SUCCESS",
            paymentMethod: body.paymentMethod || "upi",
            autoPay: true,
          },
          create: {
            orderId,
            gokwikTxnId: txnId,
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
      gokwikMandateId: mandateId,
      paymentMethodBrand: methodBrand,
      paymentMethodLast4: last4,
      currentPeriodEnd: periodEnd.toISOString(),
      orderId,
      gokwikTxnId: txnId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "GoKwik billing error" },
      { status: 400 }
    );
  }
}
