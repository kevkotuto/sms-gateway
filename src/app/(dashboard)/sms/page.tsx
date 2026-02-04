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
      pending: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
      sent: "bg-green-500/20 text-green-400 border border-green-500/30",
      delivered: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      failed: "bg-red-500/20 text-red-400 border border-red-500/30",
      received: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
    };
    return colors[status] || "bg-slate-500/20 text-slate-400 border border-slate-500/30";
  };

  return (
    <div className="pb-20 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
          SMS
        </h1>
        <p className="text-slate-400 text-sm">Envoyez et consultez vos messages</p>
      </div>

      {/* Send SMS Form */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-4 lg:p-6 mb-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <span className="mr-2">✉️</span>
          Envoyer un SMS
        </h2>
        <form onSubmit={sendSms} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+225XXXXXXXXXX"
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Votre message..."
              rows={4}
              maxLength={160}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all resize-none"
              required
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-slate-500">{message.length}/160 caractères</p>
              <div className="flex items-center text-xs text-slate-500">
                <span className={`w-2 h-2 rounded-full mr-2 ${message.length > 140 ? 'bg-orange-500' : message.length > 0 ? 'bg-green-500' : 'bg-slate-600'}`}></span>
                {message.length > 140 ? 'Presque plein' : message.length > 0 ? 'OK' : 'Vide'}
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={sending}
            className="w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
          >
            {sending ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Envoi en cours...
              </span>
            ) : (
              "📤 Envoyer SMS"
            )}
          </button>
        </form>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {(["all", "outgoing", "incoming"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              filter === f
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-blue-500/30"
                : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50"
            }`}
          >
            {f === "all" ? "📋 Tous" : f === "outgoing" ? "📤 Envoyés" : "📥 Reçus"}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-slate-400 text-sm">Aucun message</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {messages.map((msg) => (
              <div key={msg.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center">
                    <span className="mr-2 text-xl">
                      {msg.direction === "outgoing" ? "📤" : "📥"}
                    </span>
                    <span className="font-medium text-white">{msg.phoneNumber}</span>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusBadge(msg.status)}`}
                  >
                    {msg.status}
                  </span>
                </div>
                <p className="text-slate-300 mb-2 pl-8">{msg.message}</p>
                <p className="text-xs text-slate-500 pl-8">
                  {new Date(msg.createdAt).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
