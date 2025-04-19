import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createClient } from "@supabase/supabase-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// utils/format.ts (shared safe zone)
export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getEmbedUrl(source: string, videoIdOrUrl: string) {
  switch (source) {
    case "youtube":
      return `https://www.youtube.com/embed/${videoIdOrUrl}`;
    case "vimeo":
      return `https://player.vimeo.com/video/${videoIdOrUrl}`;
    case "twitch":
      return `https://player.twitch.tv/?video=${videoIdOrUrl}&parent=yourdomain.com`;
    case "facebook":
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoIdOrUrl)}`;
    case "custom":
      return videoIdOrUrl; // fallback for fully custom embeds
    default:
      return "";
  }
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

export const cleanObject = (obj: any) =>
  JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (
        value === undefined ||
        value === null ||
        (typeof File !== "undefined" && value instanceof File)
      ) {
        return undefined;
      }
      return value;
    })
  );

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Only for backend use!
);
