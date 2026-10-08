const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

export function assertCents(value: number): number {
  if (!Number.isSafeInteger(value))
    throw new Error("O valor monetário deve estar em centavos inteiros.");
  return value;
}

export function parseBrlToCents(input: string): number {
  const normalized = input
    .trim()
    .replace(/\s/g, "")
    .replace(/^R\$/i, "")
    .replace(/\./g, "")
    .replace(",", ".");
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized))
    throw new Error("Valor em reais inválido.");
  const cents = Math.round(Number(normalized) * 100);
  return assertCents(cents);
}

export function formatBrl(cents: number): string {
  return BRL_FORMATTER.format(assertCents(cents) / 100);
}

export function splitCents(totalCents: number, count: number): number[] {
  assertCents(totalCents);
  if (totalCents <= 0 || !Number.isInteger(count) || count <= 0) {
    throw new Error("Total e quantidade devem ser positivos.");
  }
  const base = Math.floor(totalCents / count);
  const remainder = totalCents % count;
  return Array.from(
    { length: count },
    (_, index) => base + (index < remainder ? 1 : 0),
  );
}
