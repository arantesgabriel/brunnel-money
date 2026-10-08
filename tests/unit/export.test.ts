import { describe, expect, it } from "vitest";
import { safeCsvCell, toCsv } from "@/lib/domain/export";

describe("CSV export", () => {
  it("neutralizes spreadsheet formulas and escapes quotes", () => {
    expect(safeCsvCell("=IMPORTXML('x')")).toBe("\"'=IMPORTXML('x')\"");
    expect(toCsv([{ description: 'Mercado "centro"', amount: 12 }])).toContain(
      '"Mercado ""centro"""',
    );
  });
});
