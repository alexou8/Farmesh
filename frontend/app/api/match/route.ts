import { NextRequest, NextResponse } from "next/server";
import { runMatchingPipeline } from "@/lib/matchingPipeline";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      role?: "farmer" | "buyer";
      userId?: string;
    };

    const result = await runMatchingPipeline({
      role: body.role,
      userId: body.userId,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
