import { describe, expect, it } from "vitest";

import { parsePaymentResult } from "./parse-payment-result";

describe("parsePaymentResult", () => {
  it("parses a completed result with allowlisted fields", () => {
    const result = parsePaymentResult({
      status: "completed",
      order_id: "ORD-123",
      course_id: "12",
      transaction_id: "TX-999",
      amount: "250.00",
      currency: "EGP",
      card_brand: "Visa",
      masked_card: "4111 **** 1111",
      order_reference: "REF-1",
      mode: "live",
    });

    expect(result.status).toBe("completed");
    expect(result.courseId).toBe(12);
    expect(result.courseHref).toBe("/my-courses/12");
    expect(result.orderId).toBe("ORD-123");
    expect(result.transactionId).toBe("TX-999");
    expect(result.amount).toBe("250.00");
    expect(result.currency).toBe("EGP");
    expect(result.cardBrand).toBe("Visa");
    expect(result.maskedCard).toBe("4111 **** 1111");
    expect(result.orderReference).toBe("REF-1");
    expect(result.isTestMode).toBe(false);
  });

  it.each(["completed", "failed", "pending", "cancelled", "refunded"] as const)(
    "accepts known status %s",
    (status) => {
      expect(parsePaymentResult({ status }).status).toBe(status);
    },
  );

  it("maps missing or unknown statuses to unknown", () => {
    expect(parsePaymentResult({}).status).toBe("unknown");
    expect(parsePaymentResult({ status: "paid" }).status).toBe("unknown");
    expect(parsePaymentResult({ status: "" }).status).toBe("unknown");
    expect(parsePaymentResult({ status: "COMPLETED " }).status).toBe("completed");
  });

  it("accepts only a positive integer course_id", () => {
    expect(parsePaymentResult({ course_id: "12" }).courseId).toBe(12);
    expect(parsePaymentResult({ course_id: "12" }).courseHref).toBe("/my-courses/12");
    expect(parsePaymentResult({ course_id: "0" }).courseId).toBeNull();
    expect(parsePaymentResult({ course_id: "-3" }).courseId).toBeNull();
    expect(parsePaymentResult({ course_id: "1.5" }).courseId).toBeNull();
    expect(parsePaymentResult({ course_id: "abc" }).courseId).toBeNull();
    expect(parsePaymentResult({ course_id: "" }).courseId).toBeNull();
    expect(parsePaymentResult({}).courseId).toBeNull();
    expect(parsePaymentResult({ course_id: "0" }).courseHref).toBeNull();
    expect(parsePaymentResult({}).courseHref).toBeNull();
  });

  it("ignores unknown keys and never exposes sensitive values", () => {
    const result = parsePaymentResult({
      status: "completed",
      signature: "secret-signature",
      cardDataToken: "secret-token",
      carddatatoken: "secret-token-2",
      foo: "bar",
    });

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("secret-signature");
    expect(serialized).not.toContain("secret-token");
    expect(serialized).not.toContain("bar");
    expect(result).not.toHaveProperty("signature");
    expect(result).not.toHaveProperty("cardDataToken");
  });

  it("constrains string lengths and trims values", () => {
    const long = "x".repeat(500);
    const result = parsePaymentResult({
      status: "completed",
      order_id: `  ${long}  `,
      transaction_id: long,
    });

    expect(result.orderId).not.toBeNull();
    expect((result.orderId as string).length).toBeLessThanOrEqual(128);
    expect((result.transactionId as string).length).toBeLessThanOrEqual(128);
  });

  it("detects test mode without exposing raw mode secrets", () => {
    expect(parsePaymentResult({ mode: "test" }).isTestMode).toBe(true);
    expect(parsePaymentResult({ mode: "Test" }).isTestMode).toBe(true);
    expect(parsePaymentResult({ mode: "live" }).isTestMode).toBe(false);
    expect(parsePaymentResult({}).isTestMode).toBe(false);
  });

  it("omits missing details as null instead of undefined", () => {
    const result = parsePaymentResult({ status: "pending" });
    expect(result.orderId).toBeNull();
    expect(result.transactionId).toBeNull();
    expect(result.amount).toBeNull();
    expect(result.currency).toBeNull();
    expect(result.cardBrand).toBeNull();
    expect(result.maskedCard).toBeNull();
    expect(result.orderReference).toBeNull();
    expect(result.courseId).toBeNull();
    expect(result.courseHref).toBeNull();
  });
});
