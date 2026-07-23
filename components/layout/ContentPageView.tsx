export function ContentPageView({ title, body }: { title: string; body: string }) {
  const paragraphs = body.split(/\n\s*\n/).filter(Boolean);

  return (
    <div className="min-h-[100svh] px-6 pb-28 pt-32 lg:px-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-brand-brown-dark sm:text-5xl">
          {title}
        </h1>
        <div className="mt-8 space-y-4">
          {paragraphs.map((paragraph, i) => (
            <p key={i} className="whitespace-pre-line text-brand-brown-dark/75">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
