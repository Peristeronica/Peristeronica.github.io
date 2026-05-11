const worksData = window.siteWorks;
const videoLists = [];
let activeVideoContext = null;
let activeVideoStopTimer = 0;
let activeYouTubePlayer = null;
let videoViewerElements = null;
let youtubeApiPromise = null;

const typeLabels = {
  Music: "Music",
  Album: "Album",
  Game: "Game",
  Goods: "Goods",
  "1day_DTM": "1dayDTM",
  Illust: "Illust",
  "1day_Movie": "1day_Movie",
};

function sortByNewest(works) {
  return [...works].sort((a, b) => {
    const aTime = Date.parse(getWorkDate(a)) || 0;
    const bTime = Date.parse(getWorkDate(b)) || 0;
    return bTime - aTime;
  });
}

function getWorkDate(work) {
  if (Array.isArray(work.collection) && work.collection.length) {
    const newestItem = sortByNewest(work.collection)[0];
    return newestItem?.date || work.date || "";
  }

  return work.date || "";
}

function typeClass(type) {
  return `type-${String(type).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function isVideoWork(work) {
  return work.type === "Music" && Boolean(work.url);
}

function isOneDayDtmCollection(work) {
  return work.type === "1day_DTM" && Array.isArray(work.collection);
}

function getYouTubeThumbnail(url) {
  const video = parseVideoUrl(url);

  if (video?.provider !== "youtube") {
    return "";
  }

  return `https://i.ytimg.com/vi/${encodeURIComponent(video.id)}/hqdefault.jpg`;
}

function createCoverImage(src) {
  const image = document.createElement("img");
  image.src = src;
  image.alt = "";
  return image;
}

function createWorkCover(work) {
  const cover = document.createElement("figure");
  cover.className = "work-cover";

  if (isOneDayDtmCollection(work)) {
    const burstItems = sortByNewest(work.collection)
      .map((item) => item.cover || getYouTubeThumbnail(item.url))
      .filter(Boolean)
      .slice(0, 3);

    cover.classList.add("work-cover-burst");

    if (burstItems.length) {
      burstItems.forEach((src, index) => {
        const frame = document.createElement("span");
        frame.className = `burst-frame burst-frame-${index + 1}`;
        frame.append(createCoverImage(src));
        cover.append(frame);
      });
    } else {
      cover.append(createCoverImage(work.cover));
    }
  } else {
    cover.append(createCoverImage(work.cover));
  }

  const tag = document.createElement("span");
  tag.className = "work-tag";
  tag.textContent = typeLabels[work.type] || work.type;
  cover.append(tag);

  return cover;
}

function createWorkCard(work, list, index) {
  const shouldOpenVideo = isVideoWork(work);
  const wrapper = document.createElement(work.collection || shouldOpenVideo ? "button" : work.url ? "a" : "article");
  wrapper.className = `work-card ${typeClass(work.type)}`;
  if (work.aspect) {
    wrapper.classList.add(`aspect-${work.aspect}`);
  }

  if (work.collection) {
    wrapper.type = "button";
    wrapper.addEventListener("click", () => {
      if (isOneDayDtmCollection(work)) {
        const collectionVideos = sortByNewest(work.collection).filter((item) => item.url);
        openVideoViewer(collectionVideos, 0);
        return;
      }

      openCollection(work);
    });
  } else if (shouldOpenVideo) {
    wrapper.type = "button";
    wrapper.addEventListener("click", () => openVideoViewer(list, index));
  } else if (work.url) {
    wrapper.href = work.url;
    wrapper.target = "_blank";
    wrapper.rel = "noreferrer";
  }

  const cover = createWorkCover(work);

  const body = document.createElement("div");
  body.className = "work-body";

  const title = document.createElement("h3");
  title.textContent = work.title;
  body.append(title);

  const description = document.createElement("p");
  description.className = "work-description";
  description.textContent = work.description;
  body.append(description);

  const role = document.createElement("p");
  role.className = "work-role";
  role.textContent = work.role || "";
  body.append(role);

  const workDate = getWorkDate(work);
  const date = document.createElement("time");
  date.dateTime = workDate;
  date.textContent = workDate;
  body.append(date);

  wrapper.append(cover, body);
  return wrapper;
}

function renderWorks(selector, works) {
  const container = document.querySelector(selector);

  if (!container) {
    return;
  }

  const sortedWorks = sortByNewest(works);
  const videoList = sortedWorks.filter(isVideoWork);

  if (videoList.length) {
    videoLists.push(videoList);
  }

  container.replaceChildren(...sortedWorks.map((work) => createWorkCard(work, videoList, videoList.indexOf(work))));
}

function ensureVideoViewer() {
  if (videoViewerElements) {
    return videoViewerElements;
  }

  const viewer = document.createElement("div");
  viewer.className = "video-viewer";
  viewer.setAttribute("aria-hidden", "true");
  viewer.setAttribute("role", "dialog");
  viewer.setAttribute("aria-modal", "true");

  const leftButton = document.createElement("button");
  leftButton.className = "video-viewer-arrow video-viewer-arrow-left";
  leftButton.type = "button";
  leftButton.setAttribute("aria-label", "新しい作品へ");
  leftButton.textContent = "<";

  const panel = document.createElement("div");
  panel.className = "video-viewer-panel";

  const closeButton = document.createElement("button");
  closeButton.className = "video-viewer-close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close");
  closeButton.textContent = "×";

  const frameSlot = document.createElement("div");
  frameSlot.className = "video-viewer-frame";

  panel.append(closeButton, frameSlot);

  const rightButton = document.createElement("button");
  rightButton.className = "video-viewer-arrow video-viewer-arrow-right";
  rightButton.type = "button";
  rightButton.setAttribute("aria-label", "古い作品へ");
  rightButton.textContent = ">";

  viewer.append(leftButton, panel, rightButton);
  document.body.append(viewer);

  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) {
      closeVideoViewer();
    }
  });
  closeButton.addEventListener("click", closeVideoViewer);
  leftButton.addEventListener("click", () => moveVideoViewer(-1));
  rightButton.addEventListener("click", () => moveVideoViewer(1));

  videoViewerElements = {
    viewer,
    leftButton,
    rightButton,
    frameSlot,
  };

  return videoViewerElements;
}

function parseTimeToken(value) {
  if (!value) {
    return null;
  }

  const match = String(value).match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?/);

  if (!match || !match[0]) {
    return null;
  }

  return (Number(match[1]) || 0) * 3600 + (Number(match[2]) || 0) * 60 + (Number(match[3]) || 0);
}

function parseVideoUrl(url) {
  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }

  const host = parsedUrl.hostname.replace(/^www\./, "");

  if (host === "youtu.be" || host === "youtube.com" || host === "m.youtube.com") {
    const videoId = host === "youtu.be" ? parsedUrl.pathname.slice(1).split("/")[0] : parsedUrl.searchParams.get("v");

    if (!videoId) {
      return null;
    }

    return {
      provider: "youtube",
      id: videoId,
      start: parseTimeToken(parsedUrl.searchParams.get("t")),
    };
  }

  if (host === "nicovideo.jp" || host === "sp.nicovideo.jp") {
    const match = parsedUrl.pathname.match(/\/watch\/([^/?#]+)/);

    if (match) {
      return {
        provider: "niconico",
        id: match[1],
        start: null,
      };
    }
  }

  return null;
}

function buildVideoEmbed(work) {
  const video = parseVideoUrl(work.url);

  if (!video) {
    return null;
  }

  const playback = work.playback || {};
  const start = Number.isFinite(playback.start) ? playback.start : video.start;
  const end = Number.isFinite(playback.end) ? playback.end : null;

  if (video.provider === "youtube") {
    const params = new URLSearchParams({
      autoplay: "1",
      playsinline: "1",
      rel: "0",
      enablejsapi: "1",
    });

    if (location.origin && location.origin !== "null") {
      params.set("origin", location.origin);
    }

    if (Number.isFinite(start)) {
      params.set("start", String(start));
    }

    if (Number.isFinite(end)) {
      params.set("end", String(end));
    }

    return {
      provider: "youtube",
      src: `https://www.youtube.com/embed/${encodeURIComponent(video.id)}?${params.toString()}`,
      start,
      end,
      volume: Number.isFinite(work.volume) ? work.volume : 40,
    };
  }

  const playerId = `works-niconico-${Date.now()}`;
  const params = new URLSearchParams({
    jsapi: "1",
    playerId,
  });

  return {
    provider: "niconico",
    playerId,
    src: `https://embed.nicovideo.jp/watch/${encodeURIComponent(video.id)}?${params.toString()}`,
    start,
    end,
    volume: Number.isFinite(work.volume) ? work.volume : 65,
  };
}

function loadYouTubeApi() {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve(window.YT);
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.append(script);
  });

  return youtubeApiPromise;
}

function postNiconicoCommand(iframe, playerId, eventName, data = {}) {
  iframe.contentWindow?.postMessage(
    {
      eventName,
      playerId,
      sourceConnectorType: 1,
      data,
    },
    "https://embed.nicovideo.jp",
  );
}

function primeVideoPlayer(iframe, embed) {
  if (embed.provider === "youtube") {
    setupYouTubePlayer(iframe, embed);
    return;
  }

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;

    if (embed.provider === "niconico") {
      postNiconicoCommand(iframe, embed.playerId, "volumeChange", { volume: embed.volume / 100 });
      postNiconicoCommand(iframe, embed.playerId, "play");
    }

    if (attempts >= 8) {
      window.clearInterval(timer);
    }
  }, 500);
}

function setupYouTubePlayer(iframe, embed) {
  loadYouTubeApi().then((YT) => {
    if (!document.body.contains(iframe)) {
      return;
    }

    const shouldLoopRange = Number.isFinite(embed.start) && Number.isFinite(embed.end);

    activeYouTubePlayer = new YT.Player(iframe, {
      events: {
        onReady: (event) => {
          event.target.setVolume(embed.volume);

          if (Number.isFinite(embed.start)) {
            event.target.seekTo(embed.start, true);
          }

          event.target.playVideo();
        },
        onStateChange: (event) => {
          if (!shouldLoopRange) {
            return;
          }

          if (event.data === YT.PlayerState.PLAYING) {
            scheduleYouTubeRangeStop(event.target, embed);
          }

          if (event.data === YT.PlayerState.ENDED) {
            resetYouTubeRange(event.target, embed);
          }
        },
      },
    });
  });
}

function scheduleYouTubeRangeStop(player, embed) {
  clearVideoStopTimer();

  let currentTime = embed.start;

  try {
    currentTime = player.getCurrentTime();
  } catch {
    currentTime = embed.start;
  }

  if (!Number.isFinite(currentTime) || currentTime < embed.start - 1 || currentTime >= embed.end - 0.25) {
    player.seekTo(embed.start, true);
    currentTime = embed.start;
  }

  activeVideoStopTimer = window.setTimeout(() => {
    resetYouTubeRange(player, embed);
  }, Math.max(0, embed.end - currentTime) * 1000);
}

function resetYouTubeRange(player, embed) {
  clearVideoStopTimer();
  player.pauseVideo();
  player.seekTo(embed.start, true);

  window.setTimeout(() => {
    player.pauseVideo();
  }, 80);
}

function clearVideoStopTimer() {
  if (activeVideoStopTimer) {
    window.clearTimeout(activeVideoStopTimer);
    activeVideoStopTimer = 0;
  }
}

function renderVideoViewer() {
  const elements = ensureVideoViewer();
  const { list, index } = activeVideoContext;
  const work = list[index];
  const embed = buildVideoEmbed(work);

  clearVideoStopTimer();
  activeYouTubePlayer?.destroy?.();
  activeYouTubePlayer = null;
  elements.frameSlot.replaceChildren();

  elements.leftButton.hidden = index <= 0;
  elements.rightButton.hidden = index >= list.length - 1;

  if (!embed) {
    const fallback = document.createElement("a");
    fallback.href = work.url;
    fallback.target = "_blank";
    fallback.rel = "noreferrer";
    fallback.textContent = "Open video";
    elements.frameSlot.append(fallback);
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.src = embed.src;
  iframe.title = work.title;
  iframe.allow = "autoplay; fullscreen; picture-in-picture";
  iframe.allowFullscreen = true;
  iframe.id = `works-video-${Date.now()}`;
  iframe.addEventListener("load", () => primeVideoPlayer(iframe, embed), { once: true });
  elements.frameSlot.append(iframe);
}

function openVideoViewer(list, index) {
  if (!list.length || index < 0) {
    return;
  }

  activeVideoContext = { list, index };
  const elements = ensureVideoViewer();
  renderVideoViewer();
  elements.viewer.classList.add("is-open");
  elements.viewer.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-modal-open");
}

function moveVideoViewer(direction) {
  if (!activeVideoContext) {
    return;
  }

  const nextIndex = activeVideoContext.index + direction;

  if (nextIndex < 0 || nextIndex >= activeVideoContext.list.length) {
    return;
  }

  activeVideoContext = { ...activeVideoContext, index: nextIndex };
  renderVideoViewer();
}

function closeVideoViewer() {
  const elements = ensureVideoViewer();

  clearVideoStopTimer();
  activeYouTubePlayer?.destroy?.();
  activeYouTubePlayer = null;
  activeVideoContext = null;
  elements.frameSlot.replaceChildren();
  elements.viewer.classList.remove("is-open");
  elements.viewer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-modal-open");
}

function openInitialViewerFromQuery() {
  const viewerTitle = new URLSearchParams(location.search).get("viewer");

  if (!viewerTitle) {
    return;
  }

  for (const list of videoLists) {
    const index = list.findIndex((work) => work.title === viewerTitle);

    if (index >= 0) {
      openVideoViewer(list, index);
      return;
    }
  }
}

function openCollection(work) {
  const modal = document.querySelector(".works-modal");
  const title = modal?.querySelector(".works-modal-title");
  const strip = modal?.querySelector(".works-modal-strip");

  if (!modal || !title || !strip) {
    return;
  }

  title.textContent = work.title;
  strip.replaceChildren(...sortByNewest(work.collection).map(createCollectionSlide));
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-modal-open");
}

function createCollectionSlide(item) {
  const slide = document.createElement(item.url ? "a" : "article");
  slide.className = "collection-slide";

  if (item.url) {
    slide.href = item.url;
    slide.target = "_blank";
    slide.rel = "noreferrer";
  }

  const image = document.createElement("img");
  image.src = item.cover;
  image.alt = "";

  const body = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = item.title;

  const description = document.createElement("p");
  description.className = "collection-description";
  description.textContent = item.description;

  const role = document.createElement("p");
  role.className = "collection-role";
  role.textContent = item.role || "";

  const date = document.createElement("time");
  date.dateTime = item.date;
  date.textContent = item.date;

  body.append(title, description, role, date);
  slide.append(image, body);
  return slide;
}

function closeCollection() {
  const modal = document.querySelector(".works-modal");

  if (!modal) {
    return;
  }

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-modal-open");
}

document.querySelector(".works-modal-close")?.addEventListener("click", closeCollection);
document.querySelector(".works-modal")?.addEventListener("click", (event) => {
  if (event.target.classList.contains("works-modal")) {
    closeCollection();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCollection();
    if (activeVideoContext) {
      closeVideoViewer();
    }
  }
});

renderWorks('[data-works-list="caffeina"]', worksData.caffeina);
renderWorks('[data-works-list="peristeronica-music"]', worksData.peristeronica.music);
renderWorks('[data-works-list="peristeronica-other"]', worksData.peristeronica.other);
openInitialViewerFromQuery();
