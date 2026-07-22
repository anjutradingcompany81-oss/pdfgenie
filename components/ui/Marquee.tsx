type MarqueeProps = {
  items: string[];
  speed?: "normal" | "fast";
  className?: string;
};

export function Marquee({ items, speed = "normal", className = "" }: MarqueeProps) {
  const doubled = [...items, ...items];

  return (
    <div
      className={`group relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] ${className}`}
    >
      <div
        className={`flex shrink-0 items-center gap-12 pr-12 group-hover:[animation-play-state:paused] ${
          speed === "fast" ? "motion-safe:animate-marquee-fast" : "motion-safe:animate-marquee"
        }`}
        aria-hidden={false}
      >
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="shrink-0 text-lg font-semibold tracking-wide text-brand-brown-dark/70 sm:text-2xl"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
