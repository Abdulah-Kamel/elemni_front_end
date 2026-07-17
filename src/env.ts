import { z } from "zod";

const envSchema = z.object({
  API_URL: z.string().url().optional().default("http://localhost:9999"),
  CONTACT_EMAIL: z.string().email().optional().default("mero@elemni.com"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
