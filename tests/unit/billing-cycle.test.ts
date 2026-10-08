import { describe, expect, it } from "vitest";
import { invoiceDates, invoiceForPurchase } from "@/lib/domain/billing-cycle";
import { competenceFor } from "@/lib/domain/dates";

describe("billing cycle", () => {
  it("places purchases before and on closing in the same invoice", () => {
    expect(invoiceForPurchase("2026-08-06", 7, 12).referenceMonth).toBe(
      "2026-08-01",
    );
    expect(invoiceForPurchase("2026-08-07", 7, 12).referenceMonth).toBe(
      "2026-08-01",
    );
    expect(invoiceForPurchase("2026-08-08", 7, 12).referenceMonth).toBe(
      "2026-09-01",
    );
  });

  it("handles closing in the previous month, year boundaries and leap day", () => {
    expect(invoiceDates("2027-01-01", 25, 5).closingDate).toBe("2026-12-25");
    expect(invoiceDates("2028-02-01", 31, 5).closingDate).toBe("2028-01-31");
    expect(invoiceForPurchase("2028-02-29", 31, 5).referenceMonth).toBe(
      "2028-03-01",
    );
  });

  it("uses direct occurrence, card invoice and explicit override for competence", () => {
    expect(competenceFor("direct", "2026-08-12")).toBe("2026-08-01");
    expect(competenceFor("credit_card", "2026-08-12", "2026-09-01")).toBe(
      "2026-09-01",
    );
    expect(
      competenceFor("credit_card", "2026-08-12", "2026-09-01", "2026-10-15"),
    ).toBe("2026-10-01");
  });
});
