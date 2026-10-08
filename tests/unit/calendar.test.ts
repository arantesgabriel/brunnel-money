import { describe, expect, it } from "vitest";
import { recurrenceDates } from "@/lib/domain/recurrence";
import { createMonthWeeks } from "@/lib/domain/weekly-market";

describe("calendar rules", () => {
  it("clamps monthly recurrence to month end and remains deterministic", () => {
    expect(recurrenceDates("2028-01-31", 31, 3)).toEqual([
      "2028-01-31",
      "2028-02-29",
      "2028-03-31",
    ]);
    expect(recurrenceDates("2028-01-31", 31, 3)).toEqual(
      recurrenceDates("2028-01-31", 31, 3),
    );
  });

  it("creates clipped Monday-Sunday periods that cover the month", () => {
    const weeks = createMonthWeeks("2026-08-01", 100000, {
      "2026-08-03": 15000,
      "2026-08-04": 10000,
    });
    expect(weeks[0].startDate).toBe("2026-08-01");
    expect(weeks.at(-1)?.endDate).toBe("2026-08-31");
    expect(weeks.reduce((sum, week) => sum + week.allocatedCents, 0)).toBe(
      100000,
    );
    expect(weeks[1].state).toBe("over");
  });
});
