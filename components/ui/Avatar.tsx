import { User as UserIcon } from "lucide-react";

export function Avatar({
  image,
  size = 28,
  iconSize = 14,
  className = "",
}: {
  image?: string | null;
  size?: number;
  iconSize?: number;
  className?: string;
}) {
  const dimension = `${size}px`;
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatars are user-supplied external URLs; next/image would need a remotePatterns allowlist for every possible provider
      <img
        src={image}
        alt=""
        style={{ width: dimension, height: dimension }}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <span
      style={{ width: dimension, height: dimension }}
      className={`flex items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue-deep ${className}`}
    >
      <UserIcon size={iconSize} />
    </span>
  );
}
