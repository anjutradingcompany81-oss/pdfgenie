import { ToolCard, type Tool } from "@/components/tools/ToolCard";
import { Reveal } from "@/components/ui/Reveal";

export function ToolSection({
  eyebrow,
  title,
  tools,
  className = "mt-20 first:mt-0",
}: {
  eyebrow: string;
  title: string;
  tools: Tool[];
  className?: string;
}) {
  return (
    <Reveal className={className}>
      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-blue-deep">
        {eyebrow}
      </span>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-brand-brown-dark sm:text-3xl">
        {title}
      </h2>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.href} {...tool} />
        ))}
      </div>
    </Reveal>
  );
}
