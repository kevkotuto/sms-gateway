import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, deviceId } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'USSD code is required' },
        { status: 400 }
      );
    }

    // Get online device
    const device = await prisma.device.findFirst({
      where: deviceId ? { id: deviceId } : { isOnline: true },
    });

    if (!device) {
      return NextResponse.json(
        { error: 'No device online' },
        { status: 400 }
      );
    }

    // Create USSD log entry
    const ussdLog = await prisma.ussdLog.create({
      data: {
        deviceId: device.id,
        code,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      id: ussdLog.id,
      message: 'USSD command queued',
    });
  } catch (error) {
    console.error('Error executing USSD:', error);
    return NextResponse.json(
      { error: 'Failed to execute USSD' },
      { status: 500 }
    );
  }
}
