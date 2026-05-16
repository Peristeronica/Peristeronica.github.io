const fs = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");

const USER_ID = "31571512";
const PIXIV_PAGE = `https://www.pixiv.net/users/${USER_ID}/illustrations`;
const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const DETAIL_COUNT = 12;
const IMAGE_EXTENSION = "webp";
const WEBP_QUALITY = "82";

const requestHeaders = {
  "User-Agent": "Mozilla/5.0",
  Accept: "application/json,text/plain,*/*",
  Referer: PIXIV_PAGE,
};

async function fetchText(url, headers = {}) {
  const response = await fetch(url, {
    headers: {
      ...requestHeaders,
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function fetchJson(url) {
  const text = await fetchText(url);
  const data = JSON.parse(text);

  if (data.error) {
    throw new Error(`Pixiv API error: ${data.message || "unknown error"}`);
  }

  return data;
}

function formatDate(value) {
  return String(value || "").slice(0, 10);
}

function getCandidateIds(profileAll) {
  return Object.keys(profileAll.body?.illusts || {})
    .sort((a, b) => Number(b) - Number(a))
    .slice(0, DETAIL_COUNT);
}

async function fetchLatestWorks() {
  const profileAll = await fetchJson(`https://www.pixiv.net/ajax/user/${USER_ID}/profile/all?lang=ja`);
  const ids = getCandidateIds(profileAll);

  if (!ids.length) {
    throw new Error("No Pixiv illustration IDs were found.");
  }

  const detailUrl = new URL(`https://www.pixiv.net/ajax/user/${USER_ID}/profile/illusts`);
  ids.forEach((id) => detailUrl.searchParams.append("ids[]", id));
  detailUrl.searchParams.set("work_category", "illustManga");
  detailUrl.searchParams.set("is_first_page", "1");
  detailUrl.searchParams.set("lang", "ja");

  const details = await fetchJson(detailUrl);
  const works = Object.values(details.body?.works || {})
    .filter((work) => work?.url && work?.createDate)
    .sort((a, b) => Date.parse(b.createDate) - Date.parse(a.createDate))
    .slice(0, 3);

  if (works.length < 3) {
    throw new Error(`Expected 3 Pixiv works, found ${works.length}.`);
  }

  return works;
}

async function downloadImage(url, filename) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": requestHeaders["User-Agent"],
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      Referer: PIXIV_PAGE,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const tempPath = path.join(DATA_DIR, `${filename}.source`);
  const outputPath = path.join(DATA_DIR, filename);

  await fs.writeFile(tempPath, buffer);

  try {
    await convertImageToWebp(tempPath, outputPath);
  } finally {
    await fs.unlink(tempPath).catch(() => {});
  }
}

function runImageCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with ${code}: ${stderr.trim()}`));
    });
  });
}

async function convertImageToWebp(sourcePath, outputPath) {
  const commands = process.platform === "win32" ? ["magick"] : ["magick", "convert"];
  let lastError = null;

  for (const command of commands) {
    try {
      await runImageCommand(command, [
        sourcePath,
        "-strip",
        "-define",
        "webp:method=6",
        "-quality",
        WEBP_QUALITY,
        outputPath,
      ]);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`Failed to convert Pixiv image to WebP. Is ImageMagick installed? ${lastError?.message || ""}`);
}

function buildSiteData(works) {
  return {
    title: "小どばとの日記",
    description: "イラストと譫言、鳩、猫。",
    role: "イラスト制作",
    date: formatDate(works[0].createDate),
    type: "Illust",
    cover: `/data/pixiv-illust-1.${IMAGE_EXTENSION}`,
    url: PIXIV_PAGE,
    openExternal: true,
    externalTarget: "pixiv-illust",
    externalIcon: true,
    hoverLabel: "Pixivで開く",
    coverLayout: "burst",
    collection: works.map((work, index) => ({
      title: work.title,
      description: "Pixiv illustration",
      role: "イラスト制作",
      date: formatDate(work.createDate),
      cover: `/data/pixiv-illust-${index + 1}.${IMAGE_EXTENSION}`,
      url: `https://www.pixiv.net/artworks/${work.id}`,
    })),
  };
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const works = await fetchLatestWorks();

  await Promise.all(
    works.map((work, index) => downloadImage(work.url, `pixiv-illust-${index + 1}.${IMAGE_EXTENSION}`))
  );

  const siteData = buildSiteData(works);
  const output = `window.pixivIllustData = ${JSON.stringify(siteData, null, 2)};\n`;
  await fs.writeFile(path.join(DATA_DIR, "pixiv-illust.js"), output, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
