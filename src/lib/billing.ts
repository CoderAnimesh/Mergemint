import { prisma } from "./prisma";

export type PlanCode = "HOBBY" | "PRO" | "TEAM";

export const PLAN_CONFIG: Record<
  PlanCode,
  { label: string; badge: string; amountUsd: number; amountInr: number; repoLimit: number }
> = {
  HOBBY: { label: "Free", badge: "FREE", amountUsd: 0, amountInr: 0, repoLimit: 1 },
  PRO: { label: "Pro", badge: "PRO", amountUsd: 1, amountInr: 49, repoLimit: 10 },
  TEAM: {
    label: "Ultra",
    badge: "ULTRA",
    amountUsd: 1,
    amountInr: 69,
    repoLimit: Number.POSITIVE_INFINITY,
  },
};

export const GRACE_PERIOD_DAYS = 3;

export async function enforceGracePeriodForWorkspace(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace) return null;

  const now = new Date();
  if (
    workspace.billingStatus === "PAST_DUE" &&
    workspace.gracePeriodEndsAt &&
    now > workspace.gracePeriodEndsAt
  ) {
    return prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        plan: "HOBBY",
        billingStatus: "CANCELLED",
        autoPayEnabled: false,
        gracePeriodEndsAt: null,
      },
    });
  }

  return workspace;
}

