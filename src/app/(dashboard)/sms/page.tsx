"use client";

import { useEffect, useState } from "react";

interface SmsMessage {
  id: string;
  direction: string;
  phoneNumber: string;
  message: string;
  status: string;
  sentAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  device: {
    name: string;
    phoneNumber: string | null;
  };
}

export default function SmsPage() {
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "outgoing" | "incoming">("all");

  const fetchMessages = async () => {
    try {
      const direction = filter === "all" ? "" : filter;
      const res = await fetch(`/api/sms/history?direction=${direction}`);
      const json = await res.json();
      setMessages(json.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const sendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !message) return;

    setSending(true);
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message }),
      });
      const json = await res.json();
      if (json.success) {
        setPhone("");
        setMessage("");
        fetchMessages();
      } else {
        alert(json.error || "Erreur lors de l'envoi");
      }
    } catch (error) {
      alert("Erreur de connexion");
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      sent: "bg-green-100 text-green-800",
      delivered: "bg-blue-100 text-blue-800",
      failed: "bg-red-100 text-red-800",
      received: "bg-purple-100 text-purple-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">SMS</h1>

      {/* Send SMS Form */}
      <div className="bg-white rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Envoyer un SMS</h2>
        <form onSubmit={sendSms} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+225XXXXXXXXXX"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Votre message..."
              rows={3}
              maxLength={160}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-sm text-gray-500 mt-1">{message.length}/160 caractères</p>
          </div>
          <button
            type="submit"
            disabled={sending}
            className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Envoi..." : "Envoyer SMS"}
          </button>
        </form>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(["all", "outgoing", "incoming"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {f === "all" ? "Tous" : f === "outgoing" ? "Envoyés" : "Reçus"}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-lg">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Aucun message
          </div>
        ) : (
          <div className="divide-y">
            {messages.map((msg) => (
              <div key={msg.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="mr-2">
                      {msg.direction === "outgoing" ? "📤" : "📥"}
                    </span>
                    <span className="font-medium">{msg.phoneNumber}</span>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(msg.status)}`}
                  >
                    {msg.status}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{msg.message}</p>
                <p className="text-xs text-gray-400">
                  {new Date(msg.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
