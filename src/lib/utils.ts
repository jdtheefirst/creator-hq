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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getEmbedUrl(source: string, videoIdOrUrl: string) {
  if (!videoIdOrUrl) return "";

  // Extract IDs from URLs if needed
  let id = videoIdOrUrl;

  switch (source) {
    case "youtube":
      // Extract ID from various YouTube URL formats
      const ytRegex =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const ytMatch = videoIdOrUrl.match(ytRegex);
      id = ytMatch && ytMatch[2].length === 11 ? ytMatch[2] : videoIdOrUrl;
      return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;

    case "vimeo":
      // Extract ID from Vimeo URL
      const vimeoRegex = /(?:vimeo\.com\/|video\/)(\d+)/i;
      const vimeoMatch = videoIdOrUrl.match(vimeoRegex);
      id = vimeoMatch ? vimeoMatch[1] : videoIdOrUrl;
      return `https://player.vimeo.com/video/${id}`;

    case "twitch":
      // Twitch video ID (v123456789)
      const twitchRegex = /v\d+/;
      const twitchMatch = videoIdOrUrl.match(twitchRegex);
      id = twitchMatch ? twitchMatch[0] : videoIdOrUrl;
      return `https://player.twitch.tv/?video=${id}&parent=${window.location.hostname}`;

    case "facebook":
      // Facebook URL needs to be encoded
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoIdOrUrl)}&show_text=false`;

    case "custom":
      return videoIdOrUrl;

    default:
      // Try to auto-detect if source wasn't specified
      if (
        videoIdOrUrl.includes("youtube") ||
        videoIdOrUrl.includes("youtu.be")
      ) {
        return getEmbedUrl("youtube", videoIdOrUrl);
      }
      if (videoIdOrUrl.includes("vimeo")) {
        return getEmbedUrl("vimeo", videoIdOrUrl);
      }
      if (videoIdOrUrl.includes("twitch")) {
        return getEmbedUrl("twitch", videoIdOrUrl);
      }
      if (videoIdOrUrl.includes("facebook")) {
        return getEmbedUrl("facebook", videoIdOrUrl);
      }
      return videoIdOrUrl;
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

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export function getSafeUrl(url: string, type: string = ""): string {
  if (!url) return "#";

  // If it's already a valid URL or internal route
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.includes("supabase.co/storage")
  ) {
    return url;
  }

  // Determine the correct bucket based on content type
  const bucket =
    type === "product" || type === "products" ? "products" : "covers";

  // Return the full public URL from storage
  return `${projectUrl}/storage/v1/object/public/${bucket}/${url}`;
}
