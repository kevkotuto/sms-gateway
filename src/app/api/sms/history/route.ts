import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const direction = searchParams.get("direction"); // outgoing, incoming
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (direction) where.direction = direction;
    if (status) where.status = status;

    const [messages, total] = await Promise.all([
      prisma.smsMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          device: {
            select: { name: true, phoneNumber: true },
          },
        },
      }),
      prisma.smsMessage.count({ where }),
    ]);

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching SMS history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
