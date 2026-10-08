import { describe, expect, it } from "vitest";
import { formatBrl, parseBrlToCents, splitCents } from "@/lib/domain/money";

describe("money", () => {
  it("parses and formats BRL without binary floating point in domain operations", () => {
    expect(parseBrlToCents("R$ 1.234,56")).toBe(123456);
    expect(parseBrlToCents("-12,30")).toBe(-1230);
    expect(formatBrl(123456)).toMatch(/R\$\s?1\.234,56/);
  });

  it("splits cents exactly and gives remainders to the first installments", () => {
    expect(splitCents(1000, 3)).toEqual([334, 333, 333]);
    expect(splitCents(80103, 8).reduce((sum, item) => sum + item, 0)).toBe(
      80103,
    );
  });
});
