import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await getCurrentUserId()) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 rounded-sm border border-cyan-500/20 bg-black/60 p-6 shadow-[0_0_40px_rgba(34,211,238,0.1)] backdrop-blur">
        <header className="space-y-1 text-center">
          <h1 className="neon-text text-2xl font-bold tracking-[0.3em] text-cyan-300">
            NEON_SYNDICATE
          </h1>
          <p className="text-xs tracking-widest text-zinc-500">
            {"// JACK_IN //"}
          </p>
        </header>

        <LoginForm />

        <p className="text-center text-xs text-zinc-500">
          No handle yet?{" "}
          <Link
            href="/register"
            className="text-fuchsia-300 underline-offset-4 hover:underline"
          >
            REGISTER
          </Link>
        </p>
      </div>
    </main>
  );
}
