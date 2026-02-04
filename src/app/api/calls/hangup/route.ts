import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Call ID is required" },
        { status: 400 }
      );
    }

    // Update call status
    const call = await prisma.callLog.update({
      where: { id },
      data: {
        status: "ended",
        endedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      id: call.id,
      message: "Call hangup requested",
    });
  } catch (error) {
    console.error("Error hanging up call:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
