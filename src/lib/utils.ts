import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// utils/format.ts (shared safe zone)
export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat(currency, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const getCurrencyOptions = () => {
  const formatter = new Intl.DisplayNames(["en"], { type: "currency" });

  const currencyCodes = Intl.supportedValuesOf
    ? Intl.supportedValuesOf("currency")
    : ["USD", "EUR", "GBP", "KES", "INR", "NGN", "AUD", "CAD", "JPY", "CNY"];

  return currencyCodes.map((code) => ({
    value: code,
    label: `${code} - ${formatter.of(code)}`,
  }));
};
