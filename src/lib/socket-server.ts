import { Server } from "socket.io";
import { createServer } from "http";
import { prisma } from "./db";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  DeviceToServerMessage,
} from "@/types/socket";

const SOCKET_PORT = parseInt(process.env.SOCKET_PORT || "3001");
const ESP32_API_KEY = process.env.ESP32_API_KEY || "esp32-sms-gateway-api-key-2024";

// Store connected devices
const connectedDevices = new Map<string, string>(); // deviceId -> socketId

export function createSocketServer() {
  const httpServer = createServer();

  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Device namespace for ESP32
  const deviceNamespace = io.of("/device");

  deviceNamespace.on("connection", async (socket) => {
    console.log(`[Socket] New device connection: ${socket.id}`);
    socket.data.isDevice = true;

    socket.on("disconnect", async () => {
      if (socket.data.deviceId) {
        connectedDevices.delete(socket.data.deviceId);
        await prisma.device.update({
          where: { id: socket.data.deviceId },
          data: { isOnline: false },
        });
        // Notify all clients
        io.emit("deviceStatus", { deviceId: socket.data.deviceId, isOnline: false });
        console.log(`[Socket] Device disconnected: ${socket.data.deviceId}`);
      }
    });

    // Handle device messages
    socket.onAny(async (event: string, data: DeviceToServerMessage) => {
      console.log(`[Socket] Device message: ${event}`, data);

      switch (data.type) {
        case "device:connect": {
          if (data.apiKey !== ESP32_API_KEY) {
            console.log(`[Socket] Invalid API key from device`);
            socket.disconnect();
            return;
          }

          // Find or create device
          let device = await prisma.device.findFirst({
            where: { apiKey: data.apiKey },
          });

          if (!device) {
            device = await prisma.device.create({
              data: {
                name: "ESP32 SMS Gateway",
                apiKey: data.apiKey,
                phoneNumber: data.phoneNumber,
                isOnline: true,
                lastSeen: new Date(),
              },
            });
          } else {
            device = await prisma.device.update({
              where: { id: device.id },
              data: {
                isOnline: true,
                lastSeen: new Date(),
                phoneNumber: data.phoneNumber || device.phoneNumber,
              },
            });
          }

          socket.data.deviceId = device.id;
          connectedDevices.set(device.id, socket.id);

          // Notify all clients
          io.emit("deviceStatus", { deviceId: device.id, isOnline: true });
          console.log(`[Socket] Device authenticated: ${device.id}`);
          break;
        }

        case "device:heartbeat": {
          if (socket.data.deviceId) {
            await prisma.device.update({
              where: { id: socket.data.deviceId },
              data: {
                lastSeen: new Date(),
                signalStrength: data.signal,
              },
            });
            io.emit("deviceStatus", {
              deviceId: socket.data.deviceId,
              isOnline: true,
              signal: data.signal,
            });
          }
          break;
        }

        case "sms:result": {
          // Update SMS status in database
          await prisma.smsMessage.update({
            where: { id: data.id },
            data: {
              status: data.success ? "sent" : "failed",
              errorMessage: data.error,
              sentAt: data.success ? new Date() : undefined,
            },
          });
          // Notify all clients
          io.emit("smsResult", { id: data.id, success: data.success, error: data.error });
          break;
        }

        case "sms:received": {
          if (socket.data.deviceId) {
            // Save incoming SMS
            const sms = await prisma.smsMessage.create({
              data: {
                deviceId: socket.data.deviceId,
                direction: "incoming",
                phoneNumber: data.from,
                message: data.message,
                status: "received",
                receivedAt: new Date(data.timestamp),
              },
            });
            // Notify all clients
            io.emit("smsReceived", { from: data.from, message: data.message, timestamp: data.timestamp });
          }
          break;
        }

        case "call:status": {
          // Update call status in database
          const callUpdate: Record<string, unknown> = { status: data.status };
          if (data.status === "ended" && data.duration) {
            callUpdate.duration = data.duration;
            callUpdate.endedAt = new Date();
          }
          if (data.status === "answered") {
            callUpdate.startedAt = new Date();
          }

          await prisma.callLog.update({
            where: { id: data.id },
            data: callUpdate,
          });
          // Notify all clients
          io.emit("callStatus", { id: data.id, status: data.status, duration: data.duration });
          break;
        }

        case "ussd:result": {
          // Update USSD log
          await prisma.ussdLog.update({
            where: { id: data.id },
            data: {
              response: data.response,
              status: data.success ? "success" : "failed",
              executedAt: new Date(),
            },
          });
          // Notify all clients
          io.emit("ussdResult", { id: data.id, response: data.response, success: data.success });
          break;
        }
      }
    });
  });

  // Client namespace for web dashboard
  io.on("connection", (socket) => {
    console.log(`[Socket] New client connection: ${socket.id}`);

    socket.on("sendSms", async (data, callback) => {
      const device = await prisma.device.findFirst({ where: { isOnline: true } });
      if (!device) {
        callback({ id: "" });
        return;
      }

      // Create SMS record
      const sms = await prisma.smsMessage.create({
        data: {
          deviceId: device.id,
          direction: "outgoing",
          phoneNumber: data.phone,
          message: data.message,
          status: "pending",
        },
      });

      // Send to device
      const deviceSocketId = connectedDevices.get(device.id);
      if (deviceSocketId) {
        deviceNamespace.to(deviceSocketId).emit("command" as keyof ServerToClientEvents, {
          type: "sms:send",
          id: sms.id,
          phone: data.phone,
          message: data.message,
        } as never);
      }

      callback({ id: sms.id });
    });

    socket.on("initiateCall", async (data, callback) => {
      const device = await prisma.device.findFirst({ where: { isOnline: true } });
      if (!device) {
        callback({ id: "" });
        return;
      }

      // Create call record
      const call = await prisma.callLog.create({
        data: {
          deviceId: device.id,
          direction: "outgoing",
          phoneNumber: data.phone,
          status: "initiated",
        },
      });

      // Send to device
      const deviceSocketId = connectedDevices.get(device.id);
      if (deviceSocketId) {
        deviceNamespace.to(deviceSocketId).emit("command" as keyof ServerToClientEvents, {
          type: "call:initiate",
          id: call.id,
          phone: data.phone,
        } as never);
      }

      callback({ id: call.id });
    });

    socket.on("hangupCall", async (data) => {
      const device = await prisma.device.findFirst({ where: { isOnline: true } });
      if (!device) return;

      const deviceSocketId = connectedDevices.get(device.id);
      if (deviceSocketId) {
        deviceNamespace.to(deviceSocketId).emit("command" as keyof ServerToClientEvents, {
          type: "call:hangup",
          id: data.id,
        } as never);
      }
    });

    socket.on("executeUssd", async (data, callback) => {
      const device = await prisma.device.findFirst({ where: { isOnline: true } });
      if (!device) {
        callback({ id: "" });
        return;
      }

      // Create USSD record
      const ussd = await prisma.ussdLog.create({
        data: {
          deviceId: device.id,
          code: data.code,
          status: "pending",
        },
      });

      // Send to device
      const deviceSocketId = connectedDevices.get(device.id);
      if (deviceSocketId) {
        deviceNamespace.to(deviceSocketId).emit("command" as keyof ServerToClientEvents, {
          type: "ussd:execute",
          id: ussd.id,
          code: data.code,
        } as never);
      }

      callback({ id: ussd.id });
    });
  });

  httpServer.listen(SOCKET_PORT, () => {
    console.log(`[Socket] Server listening on port ${SOCKET_PORT}`);
  });

  return io;
}

// Run if executed directly
if (require.main === module) {
  createSocketServer();
}
