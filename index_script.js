const konamiCode = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

let konamiIndex = 0;
const touchMenuQuery = window.matchMedia("(hover: none)");
const artistCards = [...document.querySelectorAll(".artist-card")];
let profileVideoContext = null;
let profileViewerElements = null;
let profileYouTubePlayer = null;
let profileYouTubeApiPromise = null;
let profileVideoStopTimer = 0;

const profileTypeLabels = {
  Music: "Music",
  Album: "Album",
  Game: "Game",
  Goods: "Goods",
  "1day_DTM": "1day_DTM",
  Illust: "Illust",
  "1day_Movie": "1day_Movie",
};

const profileViewerButtonLabels = {
  previous: "新しい作品へ",
  next: "古い作品へ",
};

const caffeinaFeaturedCovers = [
  "./Caffeina_Natsukaze_thumb.jpg",
  "./Caffeina_Uminari_thumb.jpg",
  "./Caffeina_Baien_thumb.jpg",
];

const peristeronicaFeaturedCovers = [
  "./Peristeronica_Rapid_thumb.jpg",
  "./Peristeronica_Choudai_thumb.jpg",
  "./Peristeronica_Tsuyu_thumb.jpg",
];

function profileTypeClass(type) {
  return `type-${String(type).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function flattenWorks(source) {
  if (Array.isArray(source)) {
    return source;
  }

  if (!source || typeof source !== "object") {
    return [];
  }

  return Object.values(source).flatMap((value) => (Array.isArray(value) ? value : []));
}

function getFeaturedWorks(owner) {
  const source = window.siteWorks?.[owner];
  const works = flattenWorks(source);
  const coversByOwner = {
    caffeina: caffeinaFeaturedCovers,
    peristeronica: peristeronicaFeaturedCovers,
  };

  return (coversByOwner[owner] || [])
    .map((cover) => works.find((work) => work.cover === cover))
    .filter(Boolean);
}

function createProfileWorkCard(work, list, index) {
  const card = document.createElement("button");
  card.className = `profile-work-card ${profileTypeClass(work.type)}`;
  if (work.aspect) {
    card.classList.add(`aspect-${work.aspect}`);
  }
  card.type = "button";
  card.addEventListener("click", () => openProfileViewer(list, index));

  const cover = document.createElement("figure");
  cover.className = "profile-work-cover";

  const image = document.createElement("img");
  image.src = work.cover;
  image.alt = "";
  cover.append(image);

  const tag = document.createElement("span");
  tag.className = "profile-work-tag";
  tag.textContent = profileTypeLabels[work.type] || work.type;
  cover.append(tag);

  const body = document.createElement("div");
  body.className = "profile-work-body";

  const title = document.createElement("h4");
  title.textContent = work.title;
  body.append(title);

  const description = document.createElement("p");
  description.textContent = work.description;
  body.append(description);

  card.append(cover, body);
  return card;
}

function renderProfileWorks() {
  const containers = [...document.querySelectorAll("[data-featured-works]")];

  containers.forEach((container) => {
    const owner = container.dataset.featuredWorks;
    const works = getFeaturedWorks(owner);
    container.replaceChildren(...works.map((work, index) => createProfileWorkCard(work, works, index)));
  });
}

function ensureProfileViewer() {
  if (profileViewerElements) {
    return profileViewerElements;
  }

  const viewer = document.createElement("div");
  viewer.className = "profile-viewer";
  viewer.setAttribute("aria-hidden", "true");
  viewer.setAttribute("role", "dialog");
  viewer.setAttribute("aria-modal", "true");

  const leftButton = document.createElement("button");
  leftButton.className = "profile-viewer-arrow profile-viewer-arrow-left";
  leftButton.type = "button";
  leftButton.setAttribute("aria-label", profileViewerButtonLabels.previous);
  leftButton.title = profileViewerButtonLabels.previous;
  leftButton.textContent = "<";

  const panel = document.createElement("div");
  panel.className = "profile-viewer-panel";

  const closeButton = document.createElement("button");
  closeButton.className = "profile-viewer-close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close");
  closeButton.textContent = "×";

  const frameSlot = document.createElement("div");
  frameSlot.className = "profile-viewer-frame";

  panel.append(closeButton, frameSlot);

  const rightButton = document.createElement("button");
  rightButton.className = "profile-viewer-arrow profile-viewer-arrow-right";
  rightButton.type = "button";
  rightButton.setAttribute("aria-label", profileViewerButtonLabels.next);
  rightButton.title = profileViewerButtonLabels.next;
  rightButton.textContent = ">";

  viewer.append(leftButton, panel, rightButton);
  document.body.append(viewer);

  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) {
      closeProfileViewer();
    }
  });
  closeButton.addEventListener("click", closeProfileViewer);
  leftButton.addEventListener("click", () => moveProfileViewer(-1));
  rightButton.addEventListener("click", () => moveProfileViewer(1));

  profileViewerElements = {
    viewer,
    frameSlot,
  };

  return profileViewerElements;
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

function parseProfileVideoUrl(url) {
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

function buildProfileVideoEmbed(work) {
  const video = parseProfileVideoUrl(work.url);

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
      volume: 40,
    };
  }

  const playerId = `profile-niconico-${Date.now()}`;
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
    volume: 65,
  };
}

function loadProfileYouTubeApi() {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (profileYouTubeApiPromise) {
    return profileYouTubeApiPromise;
  }

  profileYouTubeApiPromise = new Promise((resolve) => {
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

  return profileYouTubeApiPromise;
}

function postProfileNiconicoCommand(iframe, playerId, eventName, data = {}) {
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

function primeProfilePlayer(iframe, embed) {
  if (embed.provider === "youtube") {
    setupProfileYouTubePlayer(iframe, embed);
    return;
  }

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    postProfileNiconicoCommand(iframe, embed.playerId, "volumeChange", { volume: embed.volume / 100 });
    postProfileNiconicoCommand(iframe, embed.playerId, "play");

    if (attempts >= 8) {
      window.clearInterval(timer);
    }
  }, 500);
}

function setupProfileYouTubePlayer(iframe, embed) {
  loadProfileYouTubeApi().then((YT) => {
    if (!document.body.contains(iframe)) {
      return;
    }

    const shouldLoopRange = Number.isFinite(embed.start) && Number.isFinite(embed.end);

    profileYouTubePlayer = new YT.Player(iframe, {
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
            scheduleProfileYouTubeRangeStop(event.target, embed);
          }

          if (event.data === YT.PlayerState.ENDED) {
            resetProfileYouTubeRange(event.target, embed);
          }
        },
      },
    });
  });
}

function scheduleProfileYouTubeRangeStop(player, embed) {
  clearProfileVideoStopTimer();

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

  profileVideoStopTimer = window.setTimeout(() => {
    resetProfileYouTubeRange(player, embed);
  }, Math.max(0, embed.end - currentTime) * 1000);
}

function resetProfileYouTubeRange(player, embed) {
  clearProfileVideoStopTimer();
  player.pauseVideo();
  player.seekTo(embed.start, true);

  window.setTimeout(() => {
    player.pauseVideo();
  }, 80);
}

function clearProfileVideoStopTimer() {
  if (profileVideoStopTimer) {
    window.clearTimeout(profileVideoStopTimer);
    profileVideoStopTimer = 0;
  }
}

function renderProfileViewer() {
  const elements = ensureProfileViewer();
  const { list, index } = profileVideoContext;
  const work = list[index];
  const embed = buildProfileVideoEmbed(work);

  clearProfileVideoStopTimer();
  profileYouTubePlayer?.destroy?.();
  profileYouTubePlayer = null;
  elements.frameSlot.replaceChildren();

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
  iframe.id = `profile-video-${Date.now()}`;
  iframe.addEventListener("load", () => primeProfilePlayer(iframe, embed), { once: true });
  elements.frameSlot.append(iframe);
}

function openProfileViewer(list, index) {
  if (!list.length || index < 0) {
    return;
  }

  profileVideoContext = { list, index };
  const elements = ensureProfileViewer();
  renderProfileViewer();
  elements.viewer.classList.add("is-open");
  elements.viewer.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-profile-viewer-open");
}

function moveProfileViewer(direction) {
  if (!profileVideoContext) {
    return;
  }

  const list = profileVideoContext.list;
  const nextIndex = (profileVideoContext.index + direction + list.length) % list.length;
  profileVideoContext = { ...profileVideoContext, index: nextIndex };
  renderProfileViewer();
}

function closeProfileViewer() {
  const elements = ensureProfileViewer();

  clearProfileVideoStopTimer();
  profileYouTubePlayer?.destroy?.();
  profileYouTubePlayer = null;
  profileVideoContext = null;
  elements.frameSlot.replaceChildren();
  elements.viewer.classList.remove("is-open");
  elements.viewer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-profile-viewer-open");
}

function openArtistMenu(card) {
  closeArtistMenus(card);
  card.classList.add("is-open");
}

function closeArtistMenus(exceptCard) {
  artistCards.forEach((card) => {
    if (card !== exceptCard) {
      card.classList.remove("is-open");
    }
  });
}

function usesTouchArtistMenu() {
  return touchMenuQuery.matches;
}

artistCards.forEach((card) => {
  const icon = card.querySelector(".artist-icon");

  icon?.addEventListener("mouseenter", () => {
    if (usesTouchArtistMenu()) {
      return;
    }

    openArtistMenu(card);
  });

  icon?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!usesTouchArtistMenu()) {
      openArtistMenu(card);
      return;
    }

    if (card.classList.contains("is-open")) {
      card.classList.remove("is-open");
    } else {
      openArtistMenu(card);
    }
  });

  card.addEventListener("mouseleave", () => {
    if (usesTouchArtistMenu()) {
      return;
    }

    card.classList.remove("is-open");
  });
});

document.addEventListener("click", (event) => {
  if (!usesTouchArtistMenu() || event.target.closest(".artist-card")) {
    return;
  }

  closeArtistMenus();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && profileVideoContext) {
    closeProfileViewer();
    return;
  }

  const target = event.target;

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target?.isContentEditable
  ) {
    return;
  }

  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (key === konamiCode[konamiIndex]) {
    konamiIndex += 1;
  } else {
    konamiIndex = key === konamiCode[0] ? 1 : 0;
  }

  if (konamiIndex === konamiCode.length) {
    window.location.href = "./inside_index.html";
  }
});

renderProfileWorks();
