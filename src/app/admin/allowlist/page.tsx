"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface AllowlistEntry {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
}

export default function AllowlistAdminPage() {
  const [entries, setEntries] = useState<AllowlistEntry[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      const { data, error } = await supabase
        .from("auth_allowlist")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      setMessage("Fehler beim Laden: " + (error as any)?.message);
    } finally {
      setLoading(false);
    }
  }

  async function addEntry() {
    if (!newEmail.trim()) return;
    
    try {
      const { error } = await supabase
        .from("auth_allowlist")
        .insert({ email: newEmail.trim().toLowerCase(), is_active: true });
      
      if (error) throw error;
      
      setNewEmail("");
      setMessage("E-Mail hinzugefügt!");
      loadEntries();
    } catch (error) {
      setMessage("Fehler beim Hinzufügen: " + (error as any)?.message);
    }
  }

  async function toggleEntry(id: number, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("auth_allowlist")
        .update({ is_active: !currentStatus })
        .eq("id", id);
      
      if (error) throw error;
      
      setMessage(`Status geändert!`);
      loadEntries();
    } catch (error) {
      setMessage("Fehler beim Ändern: " + (error as any)?.message);
    }
  }

  async function deleteEntry(id: number) {
    if (!confirm("Wirklich löschen?")) return;
    
    try {
      const { error } = await supabase
        .from("auth_allowlist")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      setMessage("Eintrag gelöscht!");
      loadEntries();
    } catch (error) {
      setMessage("Fehler beim Löschen: " + (error as any)?.message);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Allowlist Verwaltung</h1>
      
      {message && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          {message}
        </div>
      )}

      {/* Neue E-Mail hinzufügen */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-3">Neue E-Mail hinzufügen</h2>
        <div className="flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@domain.com"
            className="flex-1 px-3 py-2 border rounded"
            onKeyPress={(e) => e.key === "Enter" && addEntry()}
          />
          <button
            onClick={addEntry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Hinzufügen
          </button>
        </div>
      </div>

      {/* Liste der Einträge */}
      <div className="border rounded">
        <h2 className="text-lg font-semibold p-4 border-b">Erlaubte E-Mails</h2>
        
        {loading ? (
          <div className="p-4">Lade...</div>
        ) : entries.length === 0 ? (
          <div className="p-4 text-gray-500">Keine Einträge vorhanden.</div>
        ) : (
          <div className="divide-y">
            {entries.map((entry) => (
              <div key={entry.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{entry.email}</div>
                  <div className="text-sm text-gray-500">
                    Erstellt: {new Date(entry.created_at).toLocaleDateString("de-DE")}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleEntry(entry.id, entry.is_active)}
                    className={`px-3 py-1 rounded text-sm ${
                      entry.is_active 
                        ? "bg-green-100 text-green-700 hover:bg-green-200" 
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    {entry.is_active ? "Aktiv" : "Inaktiv"}
                  </button>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
