"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "LOGIN_FAILED");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field
        label="HANDLE"
        type="text"
        autoComplete="username"
        value={username}
        onChange={setUsername}
        required
      />
      <Field
        label="PASSPHRASE"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        required
      />

      {error && (
        <p className="text-xs tracking-widest text-rose-400">[ERR] {error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-sm border border-cyan-400/50 bg-cyan-500/10 py-2 text-xs font-bold tracking-[0.3em] text-cyan-300 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "CONNECTING..." : "> JACK IN"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "className"
>) {
  return (
    <label className="block">
      <span className="block text-[10px] tracking-widest text-zinc-500">
        {label}
      </span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="mt-1 w-full rounded-sm border border-cyan-500/30 bg-black/40 px-3 py-2 text-sm text-cyan-100 placeholder-zinc-600 outline-hidden transition focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(34,211,238,0.4)]"
      />
    </label>
  );
}
