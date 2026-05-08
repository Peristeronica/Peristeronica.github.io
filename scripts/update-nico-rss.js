const fs = require("fs");
const path = require("path");

const RSS_URL = "https://www.nicovideo.jp/user/61445526/mylist/78998106?rss=2.0";

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

async function main() {
  const response = await fetch(RSS_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 GitHub Actions RSS Fetcher",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS: ${response.status}`);
  }

  const xml = await response.text();
  const videos = parseRss(xml);

  if (videos.length === 0) {
    throw new Error("No videos found in RSS.");
  }

  writeDataFiles({
    updatedAt: new Date().toISOString(),
    source: RSS_URL,
    totalCount: videos.length,
    videos,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
