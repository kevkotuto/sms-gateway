import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Phone and message are required" },
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

    // Create SMS record
    const sms = await prisma.smsMessage.create({
      data: {
        deviceId: device.id,
        direction: "outgoing",
        phoneNumber: phone,
        message: message,
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      id: sms.id,
      message: "SMS queued for sending",
    });
  } catch (error) {
    console.error("Error sending SMS:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
