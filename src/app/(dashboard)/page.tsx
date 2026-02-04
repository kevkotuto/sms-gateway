"use client";

import { useEffect, useState } from "react";

interface DeviceStatus {
  devices: Array<{
    id: string;
    name: string;
    isOnline: boolean;
    phoneNumber: string | null;
    signalStrength: number | null;
    lastSeen: string | null;
    _count: {
      smsMessages: number;
      callLogs: number;
    };
  }>;
  stats: {
    totalDevices: number;
    onlineDevices: number;
    totalSms: number;
    totalCalls: number;
    pendingSms: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DeviceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/device/status");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Error fetching status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Appareils en ligne"
          value={data?.stats.onlineDevices || 0}
          total={data?.stats.totalDevices || 0}
          icon="📱"
          color="green"
        />
        <StatCard
          title="SMS envoyés"
          value={data?.stats.totalSms || 0}
          icon="💬"
          color="blue"
        />
        <StatCard
          title="Appels"
          value={data?.stats.totalCalls || 0}
          icon="📞"
          color="purple"
        />
        <StatCard
          title="SMS en attente"
          value={data?.stats.pendingSms || 0}
          icon="⏳"
          color="orange"
        />
      </div>

      {/* Devices List */}
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Appareils connectés</h2>
        {data?.devices.length === 0 ? (
          <p className="text-gray-500">
            Aucun appareil enregistré. Connectez votre ESP32 pour commencer.
          </p>
        ) : (
          <div className="space-y-4">
            {data?.devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-3 ${
                      device.isOnline ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  <div>
                    <h3 className="font-medium">{device.name}</h3>
                    <p className="text-sm text-gray-500">
                      {device.phoneNumber || "Numéro inconnu"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    Signal: {device.signalStrength !== null ? `${device.signalStrength}/31` : "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {device.lastSeen
                      ? `Vu: ${new Date(device.lastSeen).toLocaleString()}`
                      : "Jamais connecté"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  total,
  icon,
  color,
}: {
  title: string;
  value: number;
  total?: number;
  icon: string;
  color: "green" | "blue" | "purple" | "orange";
}) {
  const colorClasses = {
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    purple: "bg-purple-100 text-purple-800",
    orange: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold">
            {value}
            {total !== undefined && (
              <span className="text-sm font-normal text-gray-400">/{total}</span>
            )}
          </p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}
