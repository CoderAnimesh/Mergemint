import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export async function GET() {
  let dbStatus: "connected" | "demo-mode" | "error" = isDatabaseConfigured()
    ? "connected"
    : "demo-mode";

  if (dbStatus === "connected") {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "error";
    }
  }

  const aiMode =
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== "your_google_gemini_api_key"
      ? "gemini"
      : "heuristic";

  return NextResponse.json(
    {
      status: dbStatus === "error" ? "degraded" : "ok",
      service: "mergemint-web",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      ai: aiMode,
    },
    { status: dbStatus === "error" ? 503 : 200 }
  );
}

