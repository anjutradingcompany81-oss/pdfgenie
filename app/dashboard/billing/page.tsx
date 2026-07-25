import Link from "next/link";
import { ArrowLeft, Receipt } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Reveal } from "@/components/ui/Reveal";

function formatAmount(amountCents: number, currency: string): string {
  const amount = (amountCents / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const symbol = currency.toLowerCase() === "inr" ? "₹" : currency.toUpperCase() + " ";
  return `${symbol}${amount}`;
}

export default async function BillingHistoryPage() {
  const session = await auth();
  const history = await prisma.billingHistory.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: { subscription: { include: { plan: true } } },
  });

  return (
    <div className="min-h-[100svh] px-6 pb-28 pt-32 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          data-hover="true"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-brown-dark/70 transition-colors hover:text-brand-blue-deep"
        >
          <ArrowLeft size={16} />
          Dashboard
        </Link>

        <Reveal>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-brand-brown-dark sm:text-5xl">
            Billing history
          </h1>
          <p className="mt-2 text-brand-brown-dark/65">Every charge on your account, most recent first.</p>
        </Reveal>

        <div className="surface-card mt-8 overflow-hidden rounded-3xl border border-brand-brown-dark/10 bg-white">
          {history.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <Receipt size={28} className="text-brand-brown-dark/40" />
              <p className="text-sm text-brand-brown-dark/70">No charges yet.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-brown-dark/10 text-xs uppercase tracking-wide text-brand-brown-dark/70">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} className="border-b border-brand-brown-dark/5 last:border-0">
                    <td className="px-6 py-4 text-brand-brown-dark/70">
                      {row.createdAt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-6 py-4 font-semibold text-brand-brown-dark">
                      {row.subscription?.plan.name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-brand-brown-dark">{formatAmount(row.amountCents, row.currency)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          row.status === "captured"
                            ? "bg-status-success/10 text-status-success"
                            : "bg-brand-brown-dark/5 text-brand-brown-dark/70"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
