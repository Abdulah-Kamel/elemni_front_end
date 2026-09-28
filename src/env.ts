import { z } from "zod";

const envSchema = z.object({
  API_URL: z.string().url().optional().default("http://localhost:8001"),
  ASSETS_URL: z.string().url().optional(),
  CONTACT_EMAIL: z.string().email().optional().default("mero@elemni.com"),
  EMAILJS_SERVICE_ID: z.string().optional(),
  EMAILJS_TEMPLATE_ID: z.string().optional(),
  EMAILJS_PUBLIC_KEY: z.string().optional(),
  EMAILJS_PRIVATE_KEY: z.string().optional(),
  CONTACT_FORM_TO: z.string().email().optional().default("mokhtarstory1@gmail.com"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
