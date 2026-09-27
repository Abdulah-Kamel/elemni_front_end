import { z } from "zod";
import { env } from "@/src/env";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.union([z.string().trim().email().max(254), z.literal("")]).optional(),
  phone: z.string().trim().max(40).optional().default(""),
  message: z.string().trim().min(10).max(2000),
  website: z.string().max(0).optional().default(""),
  page_url: z.string().trim().max(2048).optional().default(""),
}).refine((value) => Boolean(value.email || value.phone), {
  path: ["email"],
  message: "email_or_phone_required",
});

const WINDOW_MS = 10 * 60 * 1000;
const REQUEST_LIMIT = 5;
// This in-memory limit is per server instance and resets when the instance restarts.
const requestsByIp = new Map<string, number[]>();

function json(body: { code: string }, status: number) {
  return Response.json(body, { status });
}

export async function POST(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const recent = (requestsByIp.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= REQUEST_LIMIT) {
    requestsByIp.set(ip, recent);
    return json({ code: "rate_limited" }, 429);
  }
  recent.push(now);
  requestsByIp.set(ip, recent);

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return json({ code: "invalid_input" }, 400);
  }

  const parsed = contactSchema.safeParse(rawBody);
  if (!parsed.success) return json({ code: "invalid_input" }, 400);
  if (parsed.data.website) return json({ code: "invalid_input" }, 400);

  const { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY } = env;
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY || !EMAILJS_PRIVATE_KEY) {
    console.warn("Contact form delivery is unavailable: EmailJS environment is not configured.");
    return json({ code: "not_configured" }, 503);
  }

  const { name, email, phone, message, page_url } = parsed.data;
  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        accessToken: EMAILJS_PRIVATE_KEY,
        template_params: {
          to_email: env.CONTACT_FORM_TO,
          from_name: name,
          reply_to: email ?? "",
          phone,
          message,
          page_url,
          sent_at: new Date().toISOString(),
        },
      }),
    });
    if (!response.ok) {
      console.error("EmailJS rejected the contact form request", response.status);
      return json({ code: "delivery_failed" }, 502);
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("EmailJS contact form request failed", error);
    return json({ code: "delivery_failed" }, 502);
  }
}
