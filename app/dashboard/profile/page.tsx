"use client";

import { Loader2, LogOut, Trash2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Avatar } from "@/components/ui/Avatar";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [name, setName] = useState(session?.user?.name || "");
  const [nameBusy, setNameBusy] = useState(false);
  const [nameMessage, setNameMessage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordDone, setPasswordDone] = useState(false);

  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteBusy, setDeleteBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleNameSubmit(e: FormEvent) {
    e.preventDefault();
    setNameBusy(true);
    setNameMessage(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNameMessage(data.error || "Couldn't update your name.");
        return;
      }
      await update({ name });
      setNameMessage("Saved.");
    } finally {
      setNameBusy(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordDone(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }

    setPasswordBusy(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Couldn't change your password.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordDone(true);
    } finally {
      setPasswordBusy(false);
    }
  }

  async function handleAvatarChange(file: File | undefined) {
    if (!file) return;
    setAvatarBusy(true);
    setAvatarError(null);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/user/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setAvatarError(data.error || "Couldn't upload that image.");
        return;
      }
      await update({ image: data.image });
      router.refresh();
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleDelete() {
    setDeleteBusy(true);
    try {
      await fetch("/api/user/delete", { method: "DELETE" });
      await signOut({ callbackUrl: "/" });
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="min-h-[100svh] px-6 pb-28 pt-32 lg:px-10">
      <div className="mx-auto max-w-2xl">
        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-blue-deep">
          Profile
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-brown-dark sm:text-5xl">
          Account settings
        </h1>

        <div className="mt-10 space-y-6">
          <section className="rounded-3xl border border-brand-brown-dark/10 bg-white p-8">
            <h2 className="text-lg font-bold text-brand-brown-dark">Profile picture</h2>
            <div className="mt-4 flex items-center gap-5">
              <Avatar image={session?.user?.image} size={64} iconSize={28} />
              <div>
                <button
                  type="button"
                  data-hover="true"
                  disabled={avatarBusy}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-semibold text-brand-blue-deep hover:underline disabled:opacity-50"
                >
                  {avatarBusy ? "Uploading…" : "Change photo"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(e) => handleAvatarChange(e.target.files?.[0])}
                />
                <p className="mt-1 text-xs text-brand-brown-dark/70">PNG, JPG, or WebP — up to 2MB.</p>
                {avatarError && <p className="mt-1 text-xs text-status-danger">{avatarError}</p>}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-brand-brown-dark/10 bg-white p-8">
            <h2 className="text-lg font-bold text-brand-brown-dark">Name</h2>
            <form onSubmit={handleNameSubmit} className="mt-4 flex flex-col gap-4 sm:flex-row">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 rounded-full border border-brand-brown-dark/15 px-5 py-3 text-sm text-brand-brown-dark outline-none focus:border-brand-blue"
              />
              <MagneticButton type="submit" disabled={nameBusy} className="shrink-0 px-6 py-3 text-xs">
                {nameBusy ? <Loader2 size={16} className="animate-spin" /> : "Save"}
              </MagneticButton>
            </form>
            {nameMessage && <p className="mt-2 text-sm text-brand-brown-dark/70">{nameMessage}</p>}
          </section>

          <section className="rounded-3xl border border-brand-brown-dark/10 bg-white p-8">
            <h2 className="text-lg font-bold text-brand-brown-dark">Change password</h2>
            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
              <input
                type="password"
                placeholder="Current password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-full border border-brand-brown-dark/15 px-5 py-3 text-sm text-brand-brown-dark outline-none focus:border-brand-blue"
              />
              <input
                type="password"
                placeholder="New password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full rounded-full border border-brand-brown-dark/15 px-5 py-3 text-sm text-brand-brown-dark outline-none focus:border-brand-blue"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-full border border-brand-brown-dark/15 px-5 py-3 text-sm text-brand-brown-dark outline-none focus:border-brand-blue"
              />
              {passwordError && <p className="text-sm font-medium text-status-danger">{passwordError}</p>}
              {passwordDone && (
                <p className="text-sm font-medium text-brand-blue-deep">Password updated.</p>
              )}
              <MagneticButton type="submit" disabled={passwordBusy}>
                {passwordBusy ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Updating…
                  </>
                ) : (
                  "Update password"
                )}
              </MagneticButton>
            </form>
          </section>

          <section className="flex items-center justify-between rounded-3xl border border-brand-brown-dark/10 bg-white p-8">
            <div>
              <h2 className="text-lg font-bold text-brand-brown-dark">Log out</h2>
              <p className="mt-1 text-sm text-brand-brown-dark/70">End your session on this device.</p>
            </div>
            <button
              type="button"
              data-hover="true"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2 rounded-full border border-brand-brown-dark/15 px-5 py-3 text-sm font-semibold text-brand-brown-dark transition-colors hover:border-brand-blue/40"
            >
              <LogOut size={16} />
              Log out
            </button>
          </section>

          <section className="rounded-3xl border border-status-danger/20 bg-status-danger/5 p-8">
            <h2 className="text-lg font-bold text-status-danger">Delete account</h2>
            <p className="mt-1 text-sm text-status-danger/80">
              This permanently deletes your account and everything tied to it. This can&apos;t be undone.
            </p>

            {!confirmingDelete ? (
              <button
                type="button"
                data-hover="true"
                onClick={() => setConfirmingDelete(true)}
                className="mt-4 flex items-center gap-2 rounded-full border border-status-danger/30 px-5 py-3 text-sm font-semibold text-status-danger transition-colors hover:bg-status-danger/10"
              >
                <Trash2 size={16} />
                Delete my account
              </button>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold text-status-danger">Are you sure?</p>
                <button
                  type="button"
                  data-hover="true"
                  disabled={deleteBusy}
                  onClick={handleDelete}
                  className="rounded-full bg-status-danger px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:brightness-90 disabled:opacity-60"
                >
                  {deleteBusy ? "Deleting…" : "Yes, delete everything"}
                </button>
                <button
                  type="button"
                  data-hover="true"
                  onClick={() => setConfirmingDelete(false)}
                  className="text-sm font-semibold text-brand-brown-dark/70 hover:text-brand-brown-dark"
                >
                  Cancel
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
