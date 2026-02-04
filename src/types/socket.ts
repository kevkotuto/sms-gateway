// Messages from Server to ESP32
export type ServerToDeviceMessage =
  | { type: "sms:send"; id: string; phone: string; message: string }
  | { type: "call:initiate"; id: string; phone: string }
  | { type: "call:hangup"; id: string }
  | { type: "call:answer"; id: string }
  | { type: "ussd:execute"; id: string; code: string };

// Messages from ESP32 to Server
export type DeviceToServerMessage =
  | { type: "device:connect"; apiKey: string; phoneNumber?: string }
  | { type: "device:heartbeat"; signal: number }
  | { type: "sms:result"; id: string; success: boolean; error?: string }
  | { type: "sms:received"; from: string; message: string; timestamp: string }
  | { type: "call:status"; id: string; status: "ringing" | "answered" | "ended" | "failed"; duration?: number }
  | { type: "ussd:result"; id: string; response: string; success: boolean };

// Socket.io Events
export interface ServerToClientEvents {
  deviceStatus: (data: { deviceId: string; isOnline: boolean; signal?: number }) => void;
  smsResult: (data: { id: string; success: boolean; error?: string }) => void;
  smsReceived: (data: { from: string; message: string; timestamp: string }) => void;
  callStatus: (data: { id: string; status: string; duration?: number }) => void;
  ussdResult: (data: { id: string; response: string; success: boolean }) => void;
}

export interface ClientToServerEvents {
  sendSms: (data: { phone: string; message: string }, callback: (result: { id: string }) => void) => void;
  initiateCall: (data: { phone: string }, callback: (result: { id: string }) => void) => void;
  hangupCall: (data: { id: string }) => void;
  answerCall: (data: { id: string }) => void;
  executeUssd: (data: { code: string }, callback: (result: { id: string }) => void) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  deviceId?: string;
  isDevice: boolean;
}
