// Типограф: неразрывные пробелы после коротких предлогов/союзов и перед тире.
// Запуск: node scripts/typograf.mjs  — можно повторять после любой правки текстов (повторный запуск ничего не ломает).
// Обрабатывает тексты проектов (app/data/*.json) и строки в коде страниц (только кириллицу и тире).
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const NBSP = " ";

const RU = ["а", "в", "во", "и", "к", "ко", "о", "об", "обо", "с", "со", "у", "я", "но", "да", "до", "за", "из", "изо", "на", "над", "не", "ни", "по", "под", "при", "про", "от", "ото", "для", "без", "или", "мы", "вы", "он", "же"].filter((w) => w !== "же");
const EN = ["a", "an", "the", "I"];

const ru = new RegExp(`(^|[\\s${NBSP}«„“("'\`>])(${RU.join("|")}) (?=[^\\s—–-])`, "giu");
const en = new RegExp(`(^|[\\s${NBSP}“("'])(${EN.map((w) => w.replace("&", "&")).join("|")}) (?=[^\\s—–-])`, "gu");

function fixDash(text) {
  // «слово — слово»: тире не должно начинать строку, кроме прямой речи (тире в начале текста не трогаем).
  return text.replace(/(\S) ([—–])(?=\s)/g, `$1${NBSP}$2`);
}
function loop(text, re) {
  let prev;
  do { prev = text; text = text.replace(re, `$1$2${NBSP}`); } while (text !== prev);
  return text;
}
export function typoRu(text) { return fixDash(loop(text, ru)); }
export function typoEn(text) { return fixDash(loop(text, en)); }

// 1) Данные: тексты проектов и категорий.
for (const file of ["app/data/projects.json", "app/data/categories.json"]) {
  const path = join(ROOT, file);
  const data = JSON.parse(readFileSync(path, "utf8"));
  const walk = (node, lang) => {
    if (Array.isArray(node)) return node.map((item) => walk(item, lang));
    if (node && typeof node === "object") {
      const out = {};
      for (const [key, value] of Object.entries(node)) {
        if (["id", "src", "cover", "sourceUrl", "color", "categories"].includes(key)) { out[key] = value; continue; }
        out[key] = walk(value, key === "ru" ? "ru" : key === "en" ? "en" : lang);
      }
      return out;
    }
    if (typeof node === "string" && lang) return lang === "ru" ? typoRu(node) : typoEn(node);
    return node;
  };
  writeFileSync(path, JSON.stringify(walk(data, null), null, 2) + "\n");
}

// 2) Код страниц: только русские слова (в коде их нет вне строк) и тире между словами.
for (const file of ["app/home-client.tsx", "app/collection-page.tsx", "app/site-meta.ts", "app/project-meta.ts"]) {
  const path = join(ROOT, file);
  const lines = readFileSync(path, "utf8").split("\n");
  const out = lines.map((line) => {
    if (/^\s*(import|\/\/)/.test(line)) return line;
    let next = loop(line, ru);
    // тире: только если рядом есть буквы (строка с текстом), не трогаем код вида a — b нет в TS
    next = next.replace(/([\p{L}\p{N}»”).,!?}]) ([—–]) /gu, `$1${NBSP}$2 `);
    return next;
  });
  writeFileSync(path, out.join("\n"));
}
console.log("typograf: done");
