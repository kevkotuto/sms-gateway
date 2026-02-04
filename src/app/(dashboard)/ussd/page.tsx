"use client";

import { useEffect, useState } from "react";

interface UssdLog {
  id: string;
  code: string;
  response: string | null;
  status: string;
  executedAt: string | null;
  createdAt: string;
  device: {
    name: string;
  };
}

const commonCodes = [
  { code: "#100#", label: "Solde MTN" },
  { code: "#99#", label: "Mon numéro" },
  { code: "*123#", label: "Menu principal" },
  { code: "*144#", label: "Services" },
];

export default function UssdPage() {
  const [logs, setLogs] = useState<UssdLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [executing, setExecuting] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/ussd");
      const json = await res.json();
      setLogs(json.logs || []);
    } catch (error) {
      console.error("Error fetching USSD logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const executeUssd = async (ussdCode: string) => {
    setExecuting(true);
    setLastResponse(null);
    setCode(ussdCode);

    try {
      const res = await fetch("/api/ussd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: ussdCode }),
      });
      const json = await res.json();
      if (json.success) {
        // Poll for response
        const pollResponse = async () => {
          const logsRes = await fetch("/api/ussd");
          const logsJson = await logsRes.json();
          const latestLog = logsJson.logs?.find((l: UssdLog) => l.id === json.id);
          if (latestLog?.response) {
            setLastResponse(latestLog.response);
            setExecuting(false);
            fetchLogs();
          } else if (latestLog?.status === "failed") {
            setLastResponse("Erreur: Pas de réponse");
            setExecuting(false);
            fetchLogs();
          } else {
            setTimeout(pollResponse, 1000);
          }
        };
        setTimeout(pollResponse, 2000);
      } else {
        alert(json.error || "Erreur lors de l'exécution");
        setExecuting(false);
      }
    } catch (error) {
      alert("Erreur de connexion");
      setExecuting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    executeUssd(code);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">USSD</h1>

      {/* USSD Input */}
      <div className="bg-white rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Exécuter un code USSD</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code USSD
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="#100#"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            disabled={executing}
            className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {executing ? "Exécution..." : "Exécuter"}
          </button>
        </form>

        {/* Quick codes */}
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-2">Codes rapides:</p>
          <div className="flex flex-wrap gap-2">
            {commonCodes.map((c) => (
              <button
                key={c.code}
                onClick={() => executeUssd(c.code)}
                disabled={executing}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 text-sm"
              >
                {c.code} ({c.label})
              </button>
            ))}
          </div>
        </div>

        {/* Response */}
        {lastResponse && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <p className="text-sm text-gray-500 mb-1">Réponse:</p>
            <pre className="whitespace-pre-wrap text-gray-900 font-mono text-sm">
              {lastResponse}
            </pre>
          </div>
        )}
      </div>

      {/* USSD History */}
      <div className="bg-white rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Historique</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Aucune requête USSD
          </div>
        ) : (
          <div className="divide-y">
            {logs.map((log) => (
              <div key={log.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-medium">{log.code}</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      log.status === "success"
                        ? "bg-green-100 text-green-800"
                        : log.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
                {log.response && (
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                    {log.response}
                  </pre>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
