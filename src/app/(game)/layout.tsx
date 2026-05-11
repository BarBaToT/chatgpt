import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { getCurrentUser } from "@/lib/auth";

export default async function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="flex">
        <Sidebar user={{ username: user.username, streetRep: user.streetRep }} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Topbar
            user={{
              username: user.username,
              creds: user.creds,
              streetRep: user.streetRep,
              bandwidth: user.bandwidth,
              bandwidthMax: user.bandwidthMax,
              lockedUntil: user.lockedUntil
                ? user.lockedUntil.toISOString()
                : null,
            }}
          />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
