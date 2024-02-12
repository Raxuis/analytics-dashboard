import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: "https://eu2-handy-ghoul-31376.upstash.io",
  token: process.env.REDIS_KEY!,
});