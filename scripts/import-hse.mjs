// Импорт изображений проектов из портфолио ВШЭ (api.mediiia.ru) в сайт.
// Запуск: node scripts/import-hse.mjs  (нужен ffmpeg/ffprobe в PATH)
// Для каждого проекта из scripts/hse-import.json:
//   update — оставляет обложку (images[0]) и заново собирает галерею из лонгрида ВШЭ в исходном порядке;
//   add    — создаёт новый проект с обложкой из ВШЭ.
// Фото → webp (до 1800 px по ширине), гифки → mp4 (h264), видео Kinescope → embed.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const ROOT = new URL("..", import.meta.url).pathname;
const API = "https://api.mediiia.ru";
const FILES = "https://files.mediiia.ru/";
const config = JSON.parse(readFileSync(join(ROOT, "scripts/hse-import.json"), "utf8"));
const projectsPath = join(ROOT, "app/data/projects.json");
const projects = JSON.parse(readFileSync(projectsPath, "utf8"));
const TMP = join(tmpdir(), "hse-import");
mkdirSync(TMP, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json", "user-agent": "Mozilla/5.0 portfolio-import" } });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return await res.json();
    } catch (error) {
      if (attempt === 4) throw error;
      await sleep(1500 * attempt);
    }
  }
}
async function download(url, path) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 portfolio-import", referer: "https://hsedesign.ru/" } });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      writeFileSync(path, Buffer.from(await res.arrayBuffer()));
      return;
    } catch (error) {
      if (attempt === 4) throw error;
      await sleep(1500 * attempt);
    }
  }
}
const run = (cmd, args) => execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] }).toString();
function probe(path) {
  const out = JSON.parse(run("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=width,height,nb_read_frames", "-of", "json", path]));
  const s = out.streams[0];
  return { width: Number(s.width), height: Number(s.height), frames: Number(s.nb_read_frames || 1) };
}
function toWebp(src, dest, maxWidth) {
  run("ffmpeg", ["-y", "-v", "error", "-i", src, "-frames:v", "1", "-vf", `scale='min(${maxWidth},iw)':-2:flags=lanczos`, "-c:v", "libwebp", "-quality", "82", dest]);
}
function toThumb(src, dest) {
  run("ffmpeg", ["-y", "-v", "error", "-i", src, "-frames:v", "1", "-vf", "scale='min(960,iw)':'min(960,ih)':force_original_aspect_ratio=decrease:flags=lanczos", "-c:v", "libwebp", "-quality", "78", dest]);
}
function toMp4(src, dest) {
  run("ffmpeg", ["-y", "-v", "error", "-i", src, "-movflags", "+faststart", "-pix_fmt", "yuv420p", "-vf", "scale='min(1800,iw)':-2:flags=lanczos,pad=ceil(iw/2)*2:ceil(ih/2)*2", "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-an", dest]);
}

function bestFile(files) {
  const live = (files || []).filter((f) => !f.isDeleted && f.url);
  return live.find((f) => f.size === "original") || live.sort((a, b) => (b.width * b.height) - (a.width * a.height))[0] || null;
}

async function collectMedia(hseId) {
  const project = await getJson(`${API}/geograffee/api/project/Get?idProject=${hseId}`);
  const posts = (await getJson(`${API}/longreads/api/post/GetMany?idLongread=${project.longreadId}`)).sort((a, b) => a.position - b.position);
  const items = [];
  const seenEmbeds = new Set();
  for (const post of posts) {
    const blob = `${post.text || ""} ${post.title || ""} ${JSON.stringify(post.attachments || [])}`;
    for (const attachment of post.attachments || []) {
      if (attachment.isDeleted) continue;
      const file = bestFile(attachment.files);
      if (file) items.push({ kind: "file", url: FILES + file.url.replace(/^\//, "") });
    }
    for (const match of blob.matchAll(/kinescope\.io\/(?:embed\/)?([A-Za-z0-9]{10,})/g)) {
      if (seenEmbeds.has(match[1])) continue;
      seenEmbeds.add(match[1]);
      items.push({ kind: "embed", url: `https://kinescope.io/embed/${match[1]}` });
    }
  }
  const coverFile = bestFile(project.titleImages);
  return { project, items, cover: coverFile ? FILES + coverFile.url.replace(/^\//, "") : null };
}

async function processFile(url, base, outDir, thumbDir, makeThumb) {
  const ext = (url.split("?")[0].match(/\.([a-z0-9]+)$/i)?.[1] || "jpg").toLowerCase();
  const raw = join(TMP, `${base}-raw.${ext}`);
  await download(url, raw);
  const info = probe(raw);
  if (ext === "gif" && info.frames > 1) {
    const dest = join(outDir, `${base}.mp4`);
    toMp4(raw, dest);
    toThumb(raw, join(thumbDir, `${base}.webp`));
    const out = probe(dest);
    return { name: `${base}.mp4`, width: out.width, height: out.height, animated: true };
  }
  const dest = join(outDir, `${base}.webp`);
  toWebp(raw, dest, 1800);
  if (makeThumb) toThumb(raw, join(thumbDir, `${base}.webp`));
  const out = probe(dest);
  return { name: `${base}.webp`, width: out.width, height: out.height, animated: false };
}

async function buildGallery(id, hseId, keepCover) {
  const outDir = join(ROOT, "public/portfolio", id);
  const thumbDir = join(ROOT, "public/portfolio-thumbs", id);
  mkdirSync(outDir, { recursive: true });
  mkdirSync(thumbDir, { recursive: true });
  const { items, cover } = await collectMedia(hseId);
  const images = [];

  if (keepCover) {
    images.push(keepCover);
  } else if (cover) {
    const made = await processFile(cover, "001", outDir, thumbDir, true);
    images.push({ src: `/portfolio/${id}/${made.name}`, width: made.width, height: made.height, animated: made.animated });
  }
  const keepNames = new Set(images.map((image) => image.src.split("/").pop()));
  const keepThumbs = new Set([...keepNames].map((name) => name.replace(/\.[^.]+$/, ".webp")));
  for (const dir of [outDir, thumbDir]) {
    for (const name of readdirSync(dir)) {
      const keep = dir === outDir ? keepNames.has(name) : keepThumbs.has(name);
      if (!keep) rmSync(join(dir, name));
    }
  }

  let index = 2;
  for (const item of items) {
    const base = `h${String(index).padStart(3, "0")}`;
    if (item.kind === "embed") {
      images.push({ src: item.url, width: 1920, height: 1080, animated: false, embed: true });
      index++;
      continue;
    }
    try {
      const made = await processFile(item.url, base, outDir, thumbDir, false);
      images.push({ src: `/portfolio/${id}/${made.name}`, width: made.width, height: made.height, animated: made.animated });
      index++;
      console.log(`  ${id}: ${made.name} ${made.width}x${made.height}`);
    } catch (error) {
      console.warn(`  ${id}: skipped ${item.url}: ${error.message}`);
    }
  }
  return images;
}

function pickSelectedFrames(images) {
  const stills = images.map((image, i) => ({ image, i })).filter(({ image, i }) => i > 0 && !image.animated && !image.embed && image.width / image.height < 1.78);
  if (stills.length < 2) return [0];
  return [0, stills[Math.floor(stills.length * 0.45)].i, stills[Math.floor(stills.length * 0.8)].i];
}

for (const entry of config.update || []) {
  const project = projects.find((p) => p.id === entry.id);
  if (!project) { console.warn(`no project ${entry.id}`); continue; }
  console.log(`update ${entry.id}`);
  const cover = project.images.find((image) => image.src === project.cover) || project.images[0];
  // Thumb for the kept cover must survive cleanup.
  project.images = await buildGallery(entry.id, entry.hse, cover);
  if (project.selectedFrames) project.selectedFrames = pickSelectedFrames(project.images);
}

for (const entry of config.add || []) {
  if (projects.some((p) => p.id === entry.id)) { console.log(`exists ${entry.id}, rebuilding`); }
  console.log(`add ${entry.id}`);
  const images = await buildGallery(entry.id, entry.hse, null);
  const existing = projects.find((p) => p.id === entry.id);
  const record = {
    id: entry.id,
    title: entry.title,
    description: entry.description,
    categories: entry.categories,
    sourceUrl: entry.sourceUrl,
    cover: images[0]?.src ?? "",
    images,
    selected: false,
    number: existing?.number ?? Math.max(...projects.map((p) => p.number)) + 1,
    x: entry.x,
    y: entry.y,
    color: entry.color,
  };
  if (existing) Object.assign(existing, record); else projects.push(record);
}

writeFileSync(projectsPath, JSON.stringify(projects, null, 2) + "\n");
const audit = { totalProjects: projects.length, totalImages: projects.reduce((n, p) => n + p.images.length, 0), projects: projects.map((p) => ({ id: p.id, images: p.images.length })) };
writeFileSync(join(ROOT, "app/data/portfolio-audit.json"), JSON.stringify(audit, null, 2) + "\n");
console.log(`done: ${audit.totalProjects} projects, ${audit.totalImages} media`);
if (!existsSync(projectsPath)) process.exit(1);
