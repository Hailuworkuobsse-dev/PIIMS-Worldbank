export function formatMoney(
  amount: string | number,
  currency: "ETB" | "USD" | "EUR" = "ETB",
  locale: "en" | "am" = "en",
): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  const formatted = new Intl.NumberFormat(locale === "am" ? "am-ET" : "en-ET", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `${currency === "ETB" && locale === "am" ? "ብር" : currency} ${formatted}`;
}