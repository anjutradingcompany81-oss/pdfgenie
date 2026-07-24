import { FileText, X } from "lucide-react";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileChip({
  name,
  size,
  onRemove,
}: {
  name: string;
  size: number;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-brand-brown-dark/10 bg-white px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue-deep">
        <FileText size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-brand-brown-dark">{name}</p>
        <p className="text-xs text-brand-brown-dark/70">{formatSize(size)}</p>
      </div>
      {onRemove && (
        <button
          type="button"
          data-hover="true"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand-brown-dark/70 transition-colors hover:bg-brand-brown-dark/5 hover:text-brand-brown-dark"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
