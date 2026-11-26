import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { prisma, isDatabaseConfigured } from "./prisma";

export function hashApiKey(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function generateRawApiKey(): {
  rawToken: string;
  keyHash: string;
  prefix: string;
} {
  const random = crypto.randomBytes(20).toString("hex");
  const rawToken = `sl_live_${random}`;
  return {
    rawToken,
    keyHash: hashApiKey(rawToken),
    prefix: `${rawToken.slice(0, 12)}...${rawToken.slice(-4)}`,
  };
}

export interface AuthenticatedTokenResult {
  valid: boolean;
  userId?: string;
  isDemo?: boolean;
}

export async function authenticateBearerToken(
  req: NextRequest
): Promise<AuthenticatedTokenResult> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false };
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return { valid: false };
  }

  if (!isDatabaseConfigured()) {
    return { valid: true, isDemo: true };
  }

  try {
    const keyHash = hashApiKey(token);
    const record = await prisma.apiKey.findUnique({
      where: { keyHash },
      select: { id: true, userId: true },
    });

    if (!record) {
      return { valid: false };
    }

    await prisma.apiKey.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    });

    return { valid: true, userId: record.userId };
  } catch {
    return { valid: false };
  }
}

