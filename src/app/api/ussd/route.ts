import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "USSD code is required" },
        { status: 400 }
      );
    }

    // Find online device
    const device = await prisma.device.findFirst({
      where: { isOnline: true },
    });

    if (!device) {
      return NextResponse.json(
        { error: "No device online" },
        { status: 503 }
      );
    }

    // Create USSD record
    const ussd = await prisma.ussdLog.create({
      data: {
        deviceId: device.id,
        code: code,
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      id: ussd.id,
      message: "USSD code sent",
    });
  } catch (error) {
    console.error("Error executing USSD:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const logs = await prisma.ussdLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        device: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error fetching USSD logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
