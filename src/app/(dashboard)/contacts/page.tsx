"use client";

import { useEffect, useState } from "react";

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  notes: string | null;
  createdAt: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState({ name: "", phoneNumber: "", notes: "" });

  const fetchContacts = async () => {
    try {
      const res = await fetch(`/api/contacts?search=${encodeURIComponent(search)}`);
      const json = await res.json();
      setContacts(json.contacts || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(fetchContacts, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const openModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setForm({
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        notes: contact.notes || "",
      });
    } else {
      setEditingContact(null);
      setForm({ name: "", phoneNumber: "", notes: "" });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingContact(null);
    setForm({ name: "", phoneNumber: "", notes: "" });
  };

  const saveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await fetch("/api/contacts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingContact.id, ...form }),
        });
      } else {
        await fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      closeModal();
      fetchContacts();
    } catch (error) {
      alert("Erreur lors de la sauvegarde");
    }
  };

  const deleteContact = async (id: string) => {
    if (!confirm("Supprimer ce contact ?")) return;
    try {
      await fetch(`/api/contacts?id=${id}`, { method: "DELETE" });
      fetchContacts();
    } catch (error) {
      alert("Erreur lors de la suppression");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Nouveau contact
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un contact..."
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-lg">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {search ? "Aucun résultat" : "Aucun contact"}
          </div>
        ) : (
          <div className="divide-y">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-gray-500">{contact.phoneNumber}</p>
                  {contact.notes && (
                    <p className="text-xs text-gray-400 mt-1">{contact.notes}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/sms?phone=${encodeURIComponent(contact.phoneNumber)}`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Envoyer SMS"
                  >
                    💬
                  </a>
                  <button
                    onClick={() => openModal(contact)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteContact(contact.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingContact ? "Modifier le contact" : "Nouveau contact"}
            </h2>
            <form onSubmit={saveContact} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingContact ? "Modifier" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
