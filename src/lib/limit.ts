import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
  redis: new Redis({
    url: "https://full-kid-25699.upstash.io", // Replace with your Redis URL
    token: "AWRjAAIjcDEyOGI4YmVjNTIyZWE0YmE5OGNjOTRlZGI4MzViNDI3YXAxMA", // Replace with your Redis token
  }),
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute per IP
});
