import Link from "next/link";
import { Combine, Scissors, FileArchive, RefreshCw, User, Clock } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Reveal } from "@/components/ui/Reveal";

const QUICK_LINKS = [
  { href: "/tools/merge", icon: Combine, label: "Merge" },
  { href: "/tools/split", icon: Scissors, label: "Split" },
  { href: "/tools/compress", icon: FileArchive, label: "Compress" },
  { href: "/tools/convert", icon: RefreshCw, label: "Convert" },
];

export default async function DashboardPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { name: true, email: true, image: true, createdAt: true },
  });

  const recentActivity = await prisma.toolUsageEvent.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const memberSince = user?.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-[100svh] px-6 pb-28 pt-32 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-blue-deep">
            Dashboard
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-brown-dark sm:text-5xl">
            Welcome back, {user?.name?.split(" ")[0] || "there"}.
          </h1>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <Reveal className="lg:col-span-1">
            <div className="rounded-3xl border border-brand-brown-dark/10 bg-white p-6">
              <div className="flex items-center gap-4">
                {user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue-deep">
                    <User size={24} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-bold text-brand-brown-dark">{user?.name}</p>
                  <p className="truncate text-sm text-brand-brown-dark/60">{user?.email}</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-brand-brown-dark/45">
                Member since {memberSince}
              </p>
              <Link
                href="/dashboard/profile"
                data-hover="true"
                className="mt-5 inline-block text-sm font-semibold text-brand-blue-deep hover:underline"
              >
                Edit profile
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="lg:col-span-2">
            <div className="rounded-3xl border border-brand-brown-dark/10 bg-white p-6">
              <h2 className="text-lg font-bold text-brand-brown-dark">Recent activity</h2>
              {recentActivity.length === 0 ? (
                <p className="mt-3 text-sm text-brand-brown-dark/55">
                  Nothing yet — the tools you use will show up here.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {recentActivity.map((event) => (
                    <li key={event.id} className="flex items-center gap-3 text-sm">
                      <Clock size={14} className="shrink-0 text-brand-brown-dark/40" />
                      <span className="text-brand-brown-dark">{event.toolSlug}</span>
                      <span className="text-brand-brown-dark/40">
                        {event.createdAt.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.12} className="mt-8">
          <h2 className="text-lg font-bold text-brand-brown-dark">Quick links</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {QUICK_LINKS.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                data-hover="true"
                className="group flex flex-col items-center gap-3 rounded-2xl border border-brand-brown-dark/10 bg-white p-6 text-center transition-colors hover:border-brand-blue/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue-deep transition-transform duration-300 group-hover:scale-110">
                  <Icon size={22} />
                </div>
                <span className="text-sm font-semibold text-brand-brown-dark">{label}</span>
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
