type Recipient = { email: string; fields: Record<string, string> };

export function RecipientPreviewTable({ recipients }: { recipients: Recipient[] }) {
  return (
    <div className="max-h-64 overflow-auto rounded-2xl border border-brand-brown-dark/10 bg-white">
      <table className="w-full min-w-[280px] text-left text-sm">
        <thead className="sticky top-0 bg-brand-cream">
          <tr className="text-xs uppercase tracking-wide text-brand-brown-dark/70">
            <th className="px-4 py-2">#</th>
            <th className="px-4 py-2">Email</th>
          </tr>
        </thead>
        <tbody>
          {recipients.map((r, i) => (
            <tr key={r.email + i} className="border-t border-brand-brown-dark/5">
              <td className="px-4 py-2 text-brand-brown-dark/70">{i + 1}</td>
              <td className="px-4 py-2 text-brand-brown-dark">{r.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
