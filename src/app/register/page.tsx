import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 rounded-sm border border-fuchsia-500/30 bg-black/60 p-6 shadow-[0_0_40px_rgba(217,70,239,0.12)] backdrop-blur">
        <header className="space-y-1 text-center">
          <h1 className="neon-text-fuchsia text-2xl font-bold tracking-[0.3em] text-fuchsia-300">
            NEON_SYNDICATE
          </h1>
          <p className="text-xs tracking-widest text-zinc-500">
            {"// FORGE_IDENTITY //"}
          </p>
        </header>

        <RegisterForm />

        <p className="text-center text-xs text-zinc-500">
          Already plugged in?{" "}
          <Link
            href="/login"
            className="text-cyan-300 underline-offset-4 hover:underline"
          >
            JACK IN
          </Link>
        </p>
      </div>
    </main>
  );
}
