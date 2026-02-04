"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_ESP32_API_KEY || "");
  const [copied, setCopied] = useState(false);

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Paramètres</h1>

      {/* API Configuration */}
      <div className="bg-white rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Configuration API</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clé API ESP32
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value="esp32-sms-gateway-api-key-2024"
                readOnly
                className="flex-1 px-4 py-2 border rounded-lg bg-gray-50"
              />
              <button
                onClick={copyApiKey}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                {copied ? "Copié!" : "Copier"}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Utilisez cette clé dans le firmware ESP32 pour l'authentification
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL WebSocket
            </label>
            <input
              type="text"
              value="wss://votre-domaine.com/device"
              readOnly
              className="w-full px-4 py-2 border rounded-lg bg-gray-50"
            />
            <p className="text-sm text-gray-500 mt-1">
              Configurez cette URL dans le firmware ESP32
            </p>
          </div>
        </div>
      </div>

      {/* API Documentation */}
      <div className="bg-white rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Documentation API</h2>

        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Envoyer un SMS</h3>
            <code className="block bg-gray-100 p-3 rounded text-sm">
              POST /api/sms/send
              <br />
              {`{"phone": "+225XXXXXXXX", "message": "Hello"}`}
            </code>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Historique SMS</h3>
            <code className="block bg-gray-100 p-3 rounded text-sm">
              GET /api/sms/history?direction=outgoing&page=1&limit=50
            </code>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Initier un appel</h3>
            <code className="block bg-gray-100 p-3 rounded text-sm">
              POST /api/calls/initiate
              <br />
              {`{"phone": "+225XXXXXXXX"}`}
            </code>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Exécuter USSD</h3>
            <code className="block bg-gray-100 p-3 rounded text-sm">
              POST /api/ussd
              <br />
              {`{"code": "#100#"}`}
            </code>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Statut des appareils</h3>
            <code className="block bg-gray-100 p-3 rounded text-sm">
              GET /api/device/status
            </code>
          </div>
        </div>
      </div>

      {/* ESP32 Configuration */}
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Configuration ESP32</h2>
        <p className="text-gray-600 mb-4">
          Copiez cette configuration dans votre fichier <code>main.cpp</code>:
        </p>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`// Configuration WebSocket
const char* WS_HOST = "votre-domaine.com";
const int WS_PORT = 443;
const char* WS_PATH = "/device";
const char* API_KEY = "esp32-sms-gateway-api-key-2024";
const bool WS_SSL = true;`}
        </pre>
      </div>
    </div>
  );
}
