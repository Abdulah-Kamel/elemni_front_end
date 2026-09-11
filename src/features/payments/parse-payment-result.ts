export type PaymentResultStatus =
  | "completed"
  | "failed"
  | "pending"
  | "cancelled"
  | "refunded"
  | "unknown";

export interface PaymentResultDetails {
  status: PaymentResultStatus;
  courseId: number | null;
  courseHref: string | null;
  orderId: string | null;
  transactionId: string | null;
  amount: string | null;
  currency: string | null;
  cardBrand: string | null;
  maskedCard: string | null;
  orderReference: string | null;
  mode: string | null;
  isTestMode: boolean;
}

export type PaymentResultQueryInput = Record<
  string,
  string | string[] | undefined
>;

const KNOWN_STATUSES: ReadonlySet<string> = new Set([
  "completed",
  "failed",
  "pending",
  "cancelled",
  "refunded",
]);

const MAX_FIELD_LENGTH = 128;
const MAX_COURSE_ID = 2_147_483_647;

function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    const first = value.find((entry) => typeof entry === "string" && entry.trim() !== "");
    return first ?? null;
  }
  return typeof value === "string" ? value : null;
}

function cleanString(
  value: string | string[] | undefined,
  maxLength = MAX_FIELD_LENGTH,
): string | null {
  const raw = firstValue(value);
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function parseStatus(value: string | string[] | undefined): PaymentResultStatus {
  const cleaned = cleanString(value, 32);
  if (!cleaned) return "unknown";
  const normalized = cleaned.toLowerCase();
  return KNOWN_STATUSES.has(normalized)
    ? (normalized as PaymentResultStatus)
    : "unknown";
}

function parseCourseId(value: string | string[] | undefined): number | null {
  const cleaned = cleanString(value, 16);
  if (!cleaned || !/^\d+$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > MAX_COURSE_ID) {
    return null;
  }
  return parsed;
}

function parseMode(value: string | string[] | undefined): {
  mode: string | null;
  isTestMode: boolean;
} {
  const cleaned = cleanString(value, 16);
  if (!cleaned) return { mode: null, isTestMode: false };
  const normalized = cleaned.toLowerCase();
  if (normalized !== "test" && normalized !== "live") {
    return { mode: null, isTestMode: false };
  }
  return { mode: normalized, isTestMode: normalized === "test" };
}

/**
 * Normalizes the backend-verified Kashier redirect query into display-only data.
 *
 * Only allowlisted keys are read. Signature material, card tokens, and unknown
 * keys are ignored and never included in the returned object.
 */
export function parsePaymentResult(
  searchParams: PaymentResultQueryInput,
): PaymentResultDetails {
  const status = parseStatus(searchParams.status);
  const courseId = parseCourseId(searchParams.course_id);
  const { mode, isTestMode } = parseMode(searchParams.mode);

  return {
    status,
    courseId,
    courseHref: courseId !== null ? `/my-courses/${courseId}` : null,
    orderId: cleanString(searchParams.order_id),
    transactionId: cleanString(searchParams.transaction_id),
    amount: cleanString(searchParams.amount, 32),
    currency: cleanString(searchParams.currency, 16),
    cardBrand: cleanString(searchParams.card_brand, 32),
    maskedCard: cleanString(searchParams.masked_card, 32),
    orderReference: cleanString(searchParams.order_reference),
    mode,
    isTestMode,
  };
}
