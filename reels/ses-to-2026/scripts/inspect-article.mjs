import { chromium } from "playwright-core";

const chromePath =
  "C:\\Users\\cleber.jose\\.cache\\hyperframes\\chrome\\chrome-headless-shell\\win64-152.0.7977.30\\chrome-headless-shell-win64\\chrome-headless-shell.exe";

const url =
  "https://www.concursosagora.com.br/post/saude-do-tocantins-tem-5-124-vagas-em-concurso-com-salarios-de-ate-r-17-727-63";

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--disable-gpu", "--hide-scrollbars"],
});
const context = await browser.newContext({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: "pt-BR",
});
const page = await context.newPage();
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(2000);
for (const label of ["Aceitar todos", "Apenas essenciais", "Fechar"]) {
  const button = page.getByRole("button", { name: new RegExp(label, "i") });
  if (await button.count()) {
    try {
      await button.first().click({ timeout: 2000 });
      await page.waitForTimeout(400);
      break;
    } catch {}
  }
}
const info = await page.evaluate(() => {
  const pick = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName,
      cls: el.className?.toString().slice(0, 180),
      id: el.id,
      x: Math.round(r.x),
      y: Math.round(r.y + window.scrollY),
      w: Math.round(r.width),
      h: Math.round(r.height),
      text: (el.innerText || "").replace(/\s+/g, " ").slice(0, 160),
    };
  };
  return {
    title: document.title,
    bodyH: document.body.scrollHeight,
    article: pick(document.querySelector("article")),
    main: pick(document.querySelector("main")),
    h1: pick(document.querySelector("h1")),
    candidates: [...document.querySelectorAll("[class*='article'], [class*='post'], [class*='prose'], main, article")]
      .slice(0, 20)
      .map(pick),
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
