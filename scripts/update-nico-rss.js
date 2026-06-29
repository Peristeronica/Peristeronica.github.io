const fs = require("fs");
const path = require("path");

const RSS_URL = "https://www.nicovideo.jp/user/61445526/mylist/78998106?rss=2.0";
const MYLIST_ID = "78998106";
const MYLIST_API_URL = `https://nvapi.nicovideo.jp/v2/mylists/${MYLIST_ID}`;
const MYLIST_API_PAGE_SIZE = 100;
const REQUEST_HEADERS = {
  "User-Agent": "Mozilla/5.0 GitHub Actions RSS Fetcher",
  "X-Frontend-Id": "6",
  "X-Frontend-Version": "0",
  Referer: `https://www.nicovideo.jp/user/61445526/mylist/${MYLIST_ID}`,
};

function getTagValue(xml, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = xml.match(regex);
  return match ? decodeHtml(match[1].trim()) : "";
}

function decodeHtml(text) {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function extractVideoId(link) {
  const match = link.match(/watch\/((?:sm|so|nm)\d+)/);
  return match ? match[1] : null;
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDuration(seconds) {
  const value = Number(seconds) || 0;
  const minutes = Math.floor(value / 60);
  const rest = value % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function formatNicoDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || "";

  return `${get("year")}年${get("month")}月${get("day")}日 ${get("hour")}：${get("minute")}：${get("second")}`;
}

function buildDescription(video) {
  const title = escapeHtml(video.title);
  const thumbnail = video.thumbnail?.url || video.thumbnail?.middleUrl || video.thumbnail?.largeUrl || "";
  const shortDescription = escapeHtml(video.shortDescription || "");
  const duration = formatDuration(video.duration);
  const registeredAt = formatNicoDate(video.registeredAt);
  const thumbnailHtml = thumbnail
    ? `<p class="nico-thumbnail"><img alt="${title}" src="${escapeHtml(thumbnail)}" width="94" height="70" border="0"/></p>`
    : "";

  return `\n${thumbnailHtml}\n<p class="nico-description">${shortDescription}</p>\n<p class="nico-info"><small><strong class="nico-info-length">${duration}</strong>｜<strong class="nico-info-date">${registeredAt}</strong> 投稿</small></p>\n`;
}

function parseRss(xml) {
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

  const videos = itemMatches
    .map((itemXml) => {
      const title = getTagValue(itemXml, "title");
      const link = getTagValue(itemXml, "link");
      const pubDate = getTagValue(itemXml, "pubDate");
      const description = getTagValue(itemXml, "description");
      const id = extractVideoId(link);

      if (!id) {
        return null;
      }

      return {
        id,
        title,
        url: link,
        pubDate,
        description,
      };
    })
    .filter((video) => video !== null);

  return Array.from(new Map(videos.map((video) => [video.id, video])).values());
}

function parseMylistApiData(data) {
  const items = data?.data?.mylist?.items;

  if (!Array.isArray(items)) {
    return [];
  }

  const videos = items
    .map((item) => {
      const video = item.video || {};
      const id = item.watchId || video.id;

      if (!id || !video.title) {
        return null;
      }

      return {
        id,
        title: video.title,
        url: `https://www.nicovideo.jp/watch/${id}`,
        pubDate: item.addedAt ? new Date(item.addedAt).toUTCString() : "",
        description: buildDescription(video),
      };
    })
    .filter((video) => video !== null);

  return Array.from(new Map(videos.map((video) => [video.id, video])).values());
}

function parseMylistApi(json) {
  const data = JSON.parse(json);

  return parseMylistApiData(data);
}

function buildMylistApiUrl(page) {
  const url = new URL(MYLIST_API_URL);

  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(MYLIST_API_PAGE_SIZE));
  return url.toString();
}

async function fetchMylistApiVideos() {
  const videos = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const text = await fetchText(buildMylistApiUrl(page));
    const data = JSON.parse(text);
    const pageVideos = parseMylistApiData(data);

    videos.push(...pageVideos);
    hasNext = Boolean(data?.data?.mylist?.hasNext);

    if (pageVideos.length === 0 || page >= 20) {
      break;
    }

    page += 1;
  }

  if (videos.length === 0) {
    return [];
  }

  return Array.from(new Map(videos.map((video) => [video.id, video])).values());
}

function writeDataFiles(output) {
  const outputDir = path.join(__dirname, "..", "data");
  const jsonPath = path.join(outputDir, "nico-mylist.json");
  const jsPath = path.join(outputDir, "nico-mylist.js");
  const json = JSON.stringify(output, null, 2);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(jsonPath, `${json}\n`, "utf8");
  fs.writeFileSync(jsPath, `window.NICO_MYLIST_DATA = ${json};\n`, "utf8");

  console.log(`Saved ${output.videos.length} videos to ${jsonPath}`);
  console.log(`Saved browser data to ${jsPath}`);
}

function readExistingData() {
  const jsonPath = path.join(__dirname, "..", "data", "nico-mylist.json");

  try {
    return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  } catch {
    return null;
  }
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: REQUEST_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function fetchVideos() {
  try {
    const text = await fetchText(RSS_URL);
    const videos = parseRss(text);

    if (videos.length > 0) {
      return {
        source: RSS_URL,
        videos,
      };
    }

    console.warn("Nico RSS returned no videos.");
  } catch (error) {
    console.warn(`Nico RSS failed: ${error.message}`);
  }

  try {
    const videos = await fetchMylistApiVideos();

    if (videos.length > 0) {
      return {
        source: MYLIST_API_URL,
        videos,
      };
    }

    console.warn("Nico mylist API returned no videos.");
  } catch (error) {
    console.warn(`Nico mylist API failed: ${error.message}`);
  }

  return null;
}

async function main() {
  const result = await fetchVideos();

  if (!result) {
    const existingData = readExistingData();

    if (Array.isArray(existingData?.videos) && existingData.videos.length > 0) {
      console.warn("No fresh Nico data could be fetched. Keeping existing Nico data.");
      return;
    }

    throw new Error("No videos found in Nico RSS, API, or existing data.");
  }

  writeDataFiles({
    updatedAt: new Date().toISOString(),
    source: result.source,
    totalCount: result.videos.length,
    videos: result.videos,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
