const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrNumberFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function formatINR(amount: number): string {
  return inrFormatter.format(Math.round(amount));
}

export function formatIndianNumber(amount: number): string {
  return inrNumberFormatter.format(Math.round(amount));
}

export function formatPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(1).replace(/\.0$/, "")}%`;
}
