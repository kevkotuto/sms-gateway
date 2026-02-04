import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const devices = await prisma.device.findMany({
      orderBy: { lastSeen: "desc" },
      select: {
        id: true,
        name: true,
        isOnline: true,
        phoneNumber: true,
        signalStrength: true,
        lastSeen: true,
        createdAt: true,
        _count: {
          select: {
            smsMessages: true,
            callLogs: true,
          },
        },
      },
    });

    // Get stats
    const [totalSms, totalCalls, pendingSms] = await Promise.all([
      prisma.smsMessage.count(),
      prisma.callLog.count(),
      prisma.smsMessage.count({ where: { status: "pending" } }),
    ]);

    return NextResponse.json({
      devices,
      stats: {
        totalDevices: devices.length,
        onlineDevices: devices.filter((d) => d.isOnline).length,
        totalSms,
        totalCalls,
        pendingSms,
      },
    });
  } catch (error) {
    console.error("Error fetching device status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
