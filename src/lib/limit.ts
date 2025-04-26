import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
  redis: new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  }),
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute per IP
});

export async function secureRatelimit(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  const stripeSignature = request.headers.get("stripe-signature");

  if (request.url.includes("/api/webhooks/stripe") && stripeSignature) {
    // Looks like a real Stripe webhook, SKIP rate limit
    return { success: true };
  }

  // Otherwise, ratelimit the IP like a prison warden
  return await ratelimit.limit(ip.toString());
}
