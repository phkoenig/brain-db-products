"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/ui/components/Button";
import { TextField } from "@/ui/components/TextField";
import { supabase } from "@/lib/supabase";

interface AllowlistUser {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AllowlistUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("user");

  // Check if user is admin
  if ((user as any)?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <p className="text-gray-600">Sie benötigen Admin-Rechte für diese Seite.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("auth_allowlist")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async () => {
    if (!newEmail || !newName) {
      alert("Bitte füllen Sie alle Felder aus.");
      return;
    }

    try {
      const { error } = await supabase
        .from("auth_allowlist")
        .insert({
          email: newEmail,
          name: newName,
          role: newRole,
          is_active: true,
        });

      if (error) throw error;

      setNewEmail("");
      setNewName("");
      setNewRole("user");
      loadUsers();
      alert("Benutzer erfolgreich hinzugefügt!");
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Fehler beim Hinzufügen des Benutzers.");
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("auth_allowlist")
        .update({ is_active: !currentStatus })
        .eq("id", userId);

      if (error) throw error;
      loadUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Fehler beim Aktualisieren des Benutzers.");
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("auth_allowlist")
        .delete()
        .eq("id", userId);

      if (error) throw error;
      loadUsers();
      alert("Benutzer erfolgreich gelöscht!");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Fehler beim Löschen des Benutzers.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
          {/* Add User Form */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Neuen Benutzer hinzufügen</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <TextField
                label="E-Mail"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              >
                <TextField.Input
                  type="email"
                  placeholder="user@example.com"
                />
              </TextField>
              <TextField
                label="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              >
                <TextField.Input placeholder="Vollständiger Name" />
              </TextField>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <Button onClick={addUser} className="h-10">
                Hinzufügen
              </Button>
            </div>
          </div>
          {/* Users List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Allowlist Benutzer</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      E-Mail
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rolle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Erstellt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === "admin"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.is_active ? "Aktiv" : "Inaktiv"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString("de-DE")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            size="small"
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                            className="text-xs"
                          >
                            {user.is_active ? "Deaktivieren" : "Aktivieren"}
                          </Button>
                          <Button
                            size="small"
                            onClick={() => deleteUser(user.id)}
                            className="text-xs bg-red-600 hover:bg-red-700"
                          >
                            Löschen
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPageWrapper() {
  return (
    <ProtectedRoute>
      <AdminPage />
    </ProtectedRoute>
  );
}
