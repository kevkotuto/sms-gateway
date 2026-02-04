"use client";

import { useEffect, useState } from "react";

interface CallLog {
  id: string;
  direction: string;
  phoneNumber: string;
  duration: number | null;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

export default function CallsPage() {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [calling, setCalling] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);

  const fetchCalls = async () => {
    try {
      const res = await fetch("/api/device/status");
      const json = await res.json();
      // For now, we'll need to add a calls history endpoint
      // This is a placeholder
    } catch (error) {
      console.error("Error fetching calls:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
    const interval = setInterval(fetchCalls, 5000);
    return () => clearInterval(interval);
  }, []);

  const initiateCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setCalling(true);
    try {
      const res = await fetch("/api/calls/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (json.success) {
        setCurrentCallId(json.id);
      } else {
        alert(json.error || "Erreur lors de l'appel");
        setCalling(false);
      }
    } catch (error) {
      alert("Erreur de connexion");
      setCalling(false);
    }
  };

  const hangUp = async () => {
    if (!currentCallId) return;

    try {
      await fetch("/api/calls/hangup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentCallId }),
      });
      setCurrentCallId(null);
      setCalling(false);
      setPhone("");
    } catch (error) {
      console.error("Error hanging up:", error);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Appels</h1>

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800">
          <strong>Note:</strong> L'audio des appels passe directement par le module GSM (SIM900).
          Depuis cette interface, vous pouvez uniquement initier/terminer les appels, pas parler.
        </p>
      </div>

      {/* Call Control */}
      <div className="bg-white rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {calling ? "Appel en cours" : "Passer un appel"}
        </h2>

        {!calling ? (
          <form onSubmit={initiateCall} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+225XXXXXXXXXX"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <span>📞</span>
              Appeler
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className="mb-4">
              <p className="text-lg font-medium">{phone}</p>
              <p className="text-gray-500">Appel en cours...</p>
            </div>
            <button
              onClick={hangUp}
              className="px-8 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 flex items-center justify-center gap-2 mx-auto"
            >
              <span>📵</span>
              Raccrocher
            </button>
          </div>
        )}
      </div>

      {/* Call History */}
      <div className="bg-white rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Historique des appels</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : calls.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Aucun appel enregistré
          </div>
        ) : (
          <div className="divide-y">
            {calls.map((call) => (
              <div key={call.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-3 text-xl">
                    {call.direction === "outgoing" ? "📤" : "📥"}
                  </span>
                  <div>
                    <p className="font-medium">{call.phoneNumber}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(call.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatDuration(call.duration)}</p>
                  <p className={`text-sm ${
                    call.status === "answered" ? "text-green-600" :
                    call.status === "missed" ? "text-red-600" :
                    "text-gray-500"
                  }`}>
                    {call.status}
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
