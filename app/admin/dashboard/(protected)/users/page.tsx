"use client";

import { Ban, CheckCircle2, KeyRound, Loader2, Search, ShieldCheck, Trash2, User } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  disabled: boolean;
  createdAt: string;
  image: string | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<{ userId: string; url: string; emailed: boolean } | null>(
    null
  );

  async function loadUsers(query: string) {
    try {
      const res = await fetch(`/api/admin-dashboard/users?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers("");
  }, []);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    loadUsers(search);
  }

  async function toggleDisabled(user: AdminUser) {
    setBusyId(user.id);
    try {
      await fetch(`/api/admin-dashboard/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: !user.disabled }),
      });
      await loadUsers(search);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleRole(user: AdminUser) {
    setBusyId(user.id);
    try {
      await fetch(`/api/admin-dashboard/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: user.role === "ADMIN" ? "USER" : "ADMIN" }),
      });
      await loadUsers(search);
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(user: AdminUser) {
    if (!confirm(`Delete ${user.email}? This can't be undone.`)) return;
    setBusyId(user.id);
    try {
      await fetch(`/api/admin-dashboard/users/${user.id}`, { method: "DELETE" });
      await loadUsers(search);
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(user: AdminUser) {
    setBusyId(user.id);
    setResetLink(null);
    try {
      const res = await fetch(`/api/admin-dashboard/users/${user.id}/reset-password`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setResetLink({ userId: user.id, url: data.resetUrl, emailed: data.emailed });
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-brand-brown-dark">Users</h1>
      <p className="mt-2 text-brand-brown-dark/70">{users.length} shown</p>

      <form onSubmit={handleSearchSubmit} className="mt-6 flex max-w-md items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-brown-dark/70" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="w-full rounded-full border border-brand-brown-dark/15 py-2.5 pl-11 pr-4 text-sm text-brand-brown-dark outline-none focus:border-brand-blue"
          />
        </div>
        <button
          type="submit"
          data-hover="true"
          className="rounded-full bg-brand-blue-deep px-5 py-2.5 text-sm font-semibold text-white"
        >
          Search
        </button>
      </form>

      <div className="surface-card mt-6 overflow-x-auto rounded-2xl border border-brand-brown-dark/10 bg-white">
        {loading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-brand-brown-dark/70">
            <Loader2 size={16} className="animate-spin" />
            Loading…
          </div>
        ) : users.length === 0 ? (
          <p className="p-6 text-sm text-brand-brown-dark/70">No users found.</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-brand-brown-dark/10 text-xs uppercase tracking-wide text-brand-brown-dark/70">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-brand-brown-dark/5 last:border-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue-deep">
                          <User size={14} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-brand-brown-dark">{user.name}</p>
                        <p className="truncate text-xs text-brand-brown-dark/70">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      data-hover="true"
                      disabled={busyId === user.id}
                      onClick={() => toggleRole(user)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                        user.role === "ADMIN"
                          ? "bg-brand-blue-deep text-white"
                          : "bg-brand-brown-dark/5 text-brand-brown-dark/70"
                      }`}
                    >
                      <ShieldCheck size={12} />
                      {user.role}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                        user.disabled ? "bg-status-danger/10 text-status-danger" : "bg-status-success/10 text-status-success"
                      }`}
                    >
                      {user.disabled ? "Disabled" : "Active"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-brand-brown-dark/70">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        data-hover="true"
                        title="Reset password"
                        disabled={busyId === user.id}
                        onClick={() => resetPassword(user)}
                        className="rounded-full p-2 text-brand-brown-dark/70 hover:bg-brand-cream hover:text-brand-blue-deep"
                      >
                        <KeyRound size={15} />
                      </button>
                      <button
                        type="button"
                        data-hover="true"
                        title={user.disabled ? "Enable" : "Disable"}
                        disabled={busyId === user.id}
                        onClick={() => toggleDisabled(user)}
                        className="rounded-full p-2 text-brand-brown-dark/70 hover:bg-brand-cream hover:text-brand-blue-deep"
                      >
                        {user.disabled ? <CheckCircle2 size={15} /> : <Ban size={15} />}
                      </button>
                      <button
                        type="button"
                        data-hover="true"
                        title="Delete"
                        disabled={busyId === user.id}
                        onClick={() => deleteUser(user)}
                        className="rounded-full p-2 text-brand-brown-dark/70 hover:bg-status-danger/5 hover:text-status-danger"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    {resetLink?.userId === user.id && (
                      <p className="mt-2 max-w-xs text-right text-xs text-brand-brown-dark/70">
                        {resetLink.emailed ? "Emailed. " : "Email not sent (SMTP not configured) — share this link: "}
                        <a href={resetLink.url} className="break-all text-brand-blue-deep underline">
                          {resetLink.url}
                        </a>
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
