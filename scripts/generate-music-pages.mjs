import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const origin = "https://caffeina-peristeronica.com";
const checkOnly = process.argv.includes("--check");
const sources = [
  { key: "caffeina", directory: "caffeina_works", name: "Caffeina" },
  { key: "peristeronica", directory: "peristeronica_works", name: "Peristeronica" },
];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function pageHead(owner, work, shareImage) {
  const title = `${work.title} | ${owner.name} WORKS`;
  const description = `${work.description}。担当：${work.role}。`;
  const pageUrl = `${origin}/${owner.directory}/${work.id}/`;
  const imageUrl = new URL(shareImage, origin).href;
  const imageType = shareImage.endsWith(".png") ? "image/png" : "image/jpeg";

  return `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:type" content="${imageType}">
  <meta property="og:image:alt" content="${escapeHtml(work.title)}">
  <meta property="og:site_name" content="Caffeina &amp; Peristeronica">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  <link rel="canonical" href="${escapeHtml(pageUrl)}">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/favicon-48x48.png" type="image/png" sizes="48x48">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="stylesheet" href="/assets/css/common.css">
  <link rel="stylesheet" href="/assets/css/works.css">
</head>`;
}

function withWorkHead(template, head) {
  const start = template.indexOf("<head>");
  const end = template.indexOf("</head>", start);

  if (start < 0 || end < 0) {
    throw new Error("WORKS template is missing its head element.");
  }

  return `${template.slice(0, start)}${head}${template.slice(end + "</head>".length)}`;
}

async function findShareImage(work) {
  const name = path.basename(work.cover, ".webp");

  for (const extension of [".png", ".jpg"]) {
    const relative = `/assets/source-images/works/${name}${extension}`;

    if (await fs.access(path.join(root, relative.slice(1))).then(() => true, () => false)) {
      return relative;
    }
  }

  throw new Error(`Missing PNG/JPG source image for Music work: ${work.id}`);
}

const context = { window: {} };
const dataSource = await fs.readFile(path.join(root, "data", "site-works.js"), "utf8");
vm.runInNewContext(dataSource, context, { filename: "site-works.js", timeout: 1000 });

for (const owner of sources) {
  const works = owner.key === "caffeina"
    ? context.window.siteWorks.caffeina
    : context.window.siteWorks.peristeronica.music;
  const template = await fs.readFile(path.join(root, owner.directory, "index.html"), "utf8");
  const seenIds = new Set();

  for (const work of works) {
    if (work.type !== "Music") {
      continue;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(work.id) || seenIds.has(work.id)) {
      throw new Error(`Invalid or duplicate Music ID: ${owner.name} / ${work.id}`);
    }

    if (!work.cover?.startsWith("/assets/") || !work.cover.endsWith(".webp")) {
      throw new Error(`Invalid Music cover: ${owner.name} / ${work.id}`);
    }

    await fs.access(path.join(root, work.cover.slice(1)));
    seenIds.add(work.id);

    const output = path.join(root, owner.directory, work.id, "index.html");
    const shareImage = await findShareImage(work);
    const html = withWorkHead(template, pageHead(owner, work, shareImage));

    if (checkOnly) {
      if (await fs.readFile(output, "utf8").catch(() => "") !== html) {
        throw new Error(`Music page needs regeneration: ${output}`);
      }
    } else {
      await fs.mkdir(path.dirname(output), { recursive: true });
      await fs.writeFile(output, html, "utf8");
    }
  }

  console.log(`${checkOnly ? "Checked" : "Generated"} ${seenIds.size} ${owner.name} Music pages.`);
}
