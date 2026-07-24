import { ToolCard, type Tool } from "@/components/tools/ToolCard";
import { Reveal } from "@/components/ui/Reveal";

export function ToolSection({
  eyebrow,
  title,
  tools,
  accent = "from-brand-blue to-brand-blue-deep",
  className = "mt-12 first:mt-0",
}: {
  eyebrow: string;
  title: string;
  tools: Tool[];
  accent?: string;
  className?: string;
}) {
  return (
    <Reveal className={className}>
      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-blue-deep">
        {eyebrow}
      </span>
      <h2 className="mt-2 text-xl font-bold tracking-tight text-brand-brown-dark sm:text-2xl">
        {title}
      </h2>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {tools.map((tool) => (
          <ToolCard key={tool.href} {...tool} accent={accent} />
        ))}
      </div>
    </Reveal>
  );
}
