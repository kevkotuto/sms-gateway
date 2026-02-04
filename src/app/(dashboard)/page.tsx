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
    <div className="pb-20 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
          Dashboard
        </h1>
        <p className="text-slate-400 text-sm">Vue d&apos;ensemble de votre passerelle SMS</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
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
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-4 lg:p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <span className="mr-2">🔌</span>
          Appareils connectés
        </h2>
        {data?.devices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📡</div>
            <p className="text-slate-400 text-sm">
              Aucun appareil enregistré. Connectez votre ESP32 pour commencer.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.devices.map((device) => (
              <div
                key={device.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center mb-3 sm:mb-0">
                  <div
                    className={`w-3 h-3 rounded-full mr-3 ${
                      device.isOnline ? "bg-green-500 shadow-lg shadow-green-500/50 animate-pulse" : "bg-slate-600"
                    }`}
                  />
                  <div>
                    <h3 className="font-medium text-white">{device.name}</h3>
                    <p className="text-sm text-slate-400">
                      {device.phoneNumber || "Numéro inconnu"}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right pl-6 sm:pl-0">
                  <p className="text-sm text-slate-300">
                    Signal: {device.signalStrength !== null ? `${device.signalStrength}/31` : "N/A"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {device.lastSeen
                      ? `Vu: ${new Date(device.lastSeen).toLocaleString('fr-FR', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}`
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
    green: {
      bg: "from-green-500/20 to-emerald-500/20",
      border: "border-green-500/30",
      shadow: "shadow-green-500/20",
      text: "text-green-400",
    },
    blue: {
      bg: "from-blue-500/20 to-cyan-500/20",
      border: "border-blue-500/30",
      shadow: "shadow-blue-500/20",
      text: "text-blue-400",
    },
    purple: {
      bg: "from-purple-500/20 to-pink-500/20",
      border: "border-purple-500/30",
      shadow: "shadow-purple-500/20",
      text: "text-purple-400",
    },
    orange: {
      bg: "from-orange-500/20 to-amber-500/20",
      border: "border-orange-500/30",
      shadow: "shadow-orange-500/20",
      text: "text-orange-400",
    },
  };

  const styles = colorClasses[color];

  return (
    <div className={`bg-gradient-to-br ${styles.bg} backdrop-blur-xl border ${styles.border} rounded-2xl p-4 lg:p-6 shadow-lg ${styles.shadow} hover:shadow-2xl transition-all hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs lg:text-sm text-slate-400 mb-1">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">
            {value}
            {total !== undefined && (
              <span className="text-sm lg:text-base font-normal text-slate-500">/{total}</span>
            )}
          </p>
        </div>
        <div className={`p-3 lg:p-4 rounded-2xl bg-slate-900/50 border border-slate-700/50`}>
          <span className="text-2xl lg:text-3xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}
