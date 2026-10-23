import { chromium } from "playwright-core";
import path from "node:path";

const chromePath =
  "C:\\Users\\cleber.jose\\.cache\\hyperframes\\chrome\\chrome-headless-shell\\win64-152.0.7977.30\\chrome-headless-shell-win64\\chrome-headless-shell.exe";

const url =
  "https://www.concursosagora.com.br/post/saude-do-tocantins-tem-5-124-vagas-em-concurso-com-salarios-de-ate-r-17-727-63";

const outDir = path.resolve("assets/raw");

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--disable-gpu", "--hide-scrollbars"],
});

const context = await browser.newContext({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  locale: "pt-BR",
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});

const page = await context.newPage();
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(2500);

for (const label of ["Aceitar todos", "Apenas essenciais", "Fechar"]) {
  const button = page.getByRole("button", { name: new RegExp(label, "i") });
  if (await button.count()) {
    try {
      await button.first().click({ timeout: 2500 });
      await page.waitForTimeout(600);
      break;
    } catch {}
  }
}

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);
await page.screenshot({
  path: path.join(outDir, "article-hero.png"),
  clip: { x: 0, y: 0, width: 430, height: 932 },
});

const ficha = page.getByText("Ficha Técnica do Concurso", { exact: false }).first();
if (await ficha.count()) {
  await ficha.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(outDir, "article-ficha.png"),
    clip: { x: 0, y: 0, width: 430, height: 932 },
  });
}

const body = page.getByText("O concurso da Secretaria de Estado da Saúde", { exact: false }).first();
if (await body.count()) {
  await body.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(outDir, "article-body.png"),
    clip: { x: 0, y: 0, width: 430, height: 932 },
  });
}

await browser.close();
console.log("captured");
