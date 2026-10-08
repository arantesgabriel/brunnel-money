import { expect, test } from "@playwright/test";

test("dashboard answers how much is safe to spend", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Disponível este mês")).toBeVisible();
  await expect(page.getByText(/R\$\s?2\.845,00/).first()).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "28% da renda está disponível neste mês",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /Distribuição de R\$ 4\.450,00/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: /principal/ }).first(),
  ).toBeVisible();
});

test("dashboard progressively adapts from 320px to desktop", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Viewport matrix runs once in Chromium",
  );

  for (const width of [320, 375, 390, 430]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");

    await expect(page.locator(".mobile-header")).toBeVisible();
    await expect(page.locator(".available-card")).toBeVisible();
    await expect(page.locator(".bottom-nav")).toBeVisible();
    await expect(page.locator(".quick-add-nav")).toBeVisible();

    const mobileState = await page.evaluate(() => {
      const visibleCount = (selector: string) =>
        [...document.querySelectorAll<HTMLElement>(selector)].filter(
          (element) => getComputedStyle(element).display !== "none",
        ).length;
      return {
        transactionRows: visibleCount(".home-movement"),
        hasHorizontalOverflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
        dashboardCards: document.querySelectorAll(".dashboard-card").length,
      };
    });

    expect(mobileState).toEqual({
      transactionRows: 3,
      hasHorizontalOverflow: false,
      dashboardCards: 5,
    });
  }

  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/");
  await expect(page.locator(".sidebar")).toBeHidden();
  await expect(page.locator(".bottom-nav")).toBeVisible();
  await expect(page.locator(".home-movement")).toHaveCount(4);
  expect(
    await page
      .locator(".home-movement")
      .evaluateAll(
        (elements) =>
          elements.filter(
            (element) => getComputedStyle(element).display !== "none",
          ).length,
      ),
  ).toBe(4);

  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/");
  await expect(page.locator(".sidebar")).toBeVisible();
  await expect(page.locator(".bottom-nav")).toBeHidden();
});

test("critical finance navigation works", async ({ page }) => {
  await page.goto("/lancamentos");
  await expect(
    page.getByRole("heading", { name: "Lançamentos" }),
  ).toBeVisible();
  await page.goto("/orcamento");
  await expect(page.getByText("Total alocado")).toBeVisible();
  await expect(page.getByText(/R\$\s?5\.550,00/).first()).toBeVisible();
  await expect(
    page.getByRole("img", { name: "80% do orçamento comprometido" }),
  ).toBeVisible();
  await expect(page.locator(".budget-row")).toHaveCount(6);
  await page.goto("/mercado");
  await expect(page.getByText("Semana 1")).toBeVisible();
  await expect(page.locator(".market-week-row")).toHaveCount(6);
  await expect(
    page.getByRole("img", {
      name: "39% do orçamento de mercado utilizado",
    }),
  ).toBeVisible();
});

test("creates categories and opens category editing from the budget", async ({
  page,
}) => {
  await page.goto("/orcamento");
  await page
    .getByRole("link", { name: "Editar categoria Alimentação" })
    .click();
  await expect(page).toHaveURL(/configuracoes\/categorias\?editar=Alimenta/);
  const editDialog = page
    .getByRole("dialog")
    .filter({ hasText: "Editar categoria" });
  await expect(editDialog.getByLabel("Nome")).toHaveValue("Alimentação");
  await editDialog.getByRole("button", { name: "Fechar" }).click();

  await page.getByRole("button", { name: "Nova categoria" }).click();
  const createDialog = page
    .getByRole("dialog")
    .filter({ hasText: "Nova categoria" });
  await createDialog.getByLabel("Nome").fill("Pets");
  await createDialog.getByLabel("Verde").check();
  await createDialog.getByRole("button", { name: "Salvar categoria" }).click();
  await expect(
    page.locator(".category-manager-row").filter({ hasText: "Pets" }),
  ).toBeVisible();
});

test("searches and filters transactions", async ({ page }) => {
  await page.goto("/lancamentos");
  const search = page.getByPlaceholder("Buscar lançamento");

  await search.fill("Internet");
  await expect(page.locator(".transaction-row")).toHaveCount(1);
  await expect(page.getByText("1 movimento")).toBeVisible();

  await search.fill(" ");
  await page.getByRole("button", { name: "Pagos", exact: true }).click();
  await expect(page.locator(".transaction-row")).toHaveCount(2);
  await expect(page.getByText("2 movimentos")).toBeVisible();
});

test("PWA manifest and offline policy are safe", async ({ page, request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  expect((await manifest.json()).display).toBe("standalone");
  const worker = await request.get("/sw.js");
  const source = await worker.text();
  expect(source).toContain("/api/");
  expect(source).toContain('cache: "no-store"');
  await page.goto("/offline");
  await expect(
    page.getByRole("heading", { name: "Sem conexão por enquanto" }),
  ).toBeVisible();
});

test("edits and deletes an existing transaction", async ({ page }) => {
  await page.goto("/lancamentos");
  await page.getByRole("button", { name: "Editar Internet" }).click();
  const editDialog = page
    .getByRole("dialog")
    .filter({ hasText: "Editar lançamento" });
  await editDialog.getByLabel("Descrição").fill("Internet residencial");
  await editDialog.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Internet residencial")).toBeVisible();

  await page.getByRole("button", { name: "Excluir Combustível" }).click();
  const deleteDialog = page
    .getByRole("dialog")
    .filter({ hasText: "Excluir lançamento?" });
  await deleteDialog
    .getByRole("button", { name: "Mover para lixeira" })
    .click();
  await expect(
    page.locator(".transaction-row").filter({ hasText: "Combustível" }),
  ).toHaveCount(0);
});

test("creates an account and a Mastercard identified by last four digits", async ({
  page,
}) => {
  await page.goto("/contas");
  await page.getByRole("button", { name: "Nova conta" }).click();
  const accountDialog = page
    .getByRole("dialog")
    .filter({ hasText: "Nova conta" });
  await accountDialog.getByLabel("Nome").fill("Nubank");
  await accountDialog.getByLabel("Tipo").selectOption("checking");
  await accountDialog.getByLabel("Instituição").fill("Nubank");
  await accountDialog.getByRole("button", { name: "Salvar conta" }).click();
  await expect(page.getByText("Nubank").first()).toBeVisible();

  await page.goto("/cartoes");
  await page.getByRole("button", { name: "Novo cartão" }).click();
  const cardDialog = page
    .getByRole("dialog")
    .filter({ hasText: "Novo cartão" });
  await cardDialog.getByLabel("Apelido").fill("Nubank Roxinho");
  await cardDialog.getByLabel("Bandeira").selectOption("mastercard");
  await cardDialog.getByLabel("4 últimos dígitos").fill("4242");
  await cardDialog.getByRole("button", { name: "Salvar cartão" }).click();
  await expect(
    page.getByRole("tab", { name: /Nubank Roxinho.*4242/ }),
  ).toBeVisible();
  await expect(
    page.locator(".credit-card-visual").getByLabel("Mastercard"),
  ).toBeVisible();
});
