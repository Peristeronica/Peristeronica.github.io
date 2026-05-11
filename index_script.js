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
const mobileMenuQuery = window.matchMedia("(max-width: 820px)");
const artistCards = [...document.querySelectorAll(".artist-card")];
let profileVideoContext = null;
let profileViewerElements = null;
let profileYouTubePlayer = null;
let profileYouTubeApiPromise = null;

const profileTypeLabels = {
  Music: "Music",
  Album: "Album",
  Game: "Game",
  Goods: "Goods",
  "1day_DTM": "1day_DTM",
  Illust: "Illust",
  "1day_Movie": "1day_Movie",
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
  leftButton.setAttribute("aria-label", "前の主な作品へ");
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
  rightButton.setAttribute("aria-label", "次の主な作品へ");
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
    };
  }

  if (host === "nicovideo.jp" || host === "sp.nicovideo.jp") {
    const match = parsedUrl.pathname.match(/\/watch\/([^/?#]+)/);

    if (match) {
      return {
        provider: "niconico",
        id: match[1],
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

    return {
      provider: "youtube",
      src: `https://www.youtube.com/embed/${encodeURIComponent(video.id)}?${params.toString()}`,
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
    loadProfileYouTubeApi().then((YT) => {
      if (!document.body.contains(iframe)) {
        return;
      }

      profileYouTubePlayer = new YT.Player(iframe, {
        events: {
          onReady: (event) => {
            event.target.setVolume(embed.volume);
            event.target.playVideo();
          },
        },
      });
    });
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

function renderProfileViewer() {
  const elements = ensureProfileViewer();
  const { list, index } = profileVideoContext;
  const work = list[index];
  const embed = buildProfileVideoEmbed(work);

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

artistCards.forEach((card) => {
  const icon = card.querySelector(".artist-icon");

  icon?.addEventListener("mouseenter", () => {
    if (mobileMenuQuery.matches) {
      return;
    }

    openArtistMenu(card);
  });

  icon?.addEventListener("click", (event) => {
    if (!mobileMenuQuery.matches) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (card.classList.contains("is-open")) {
      card.classList.remove("is-open");
    } else {
      openArtistMenu(card);
    }
  });

  card.addEventListener("mouseleave", () => {
    if (mobileMenuQuery.matches) {
      return;
    }

    card.classList.remove("is-open");
  });
});

document.addEventListener("click", (event) => {
  if (!mobileMenuQuery.matches || event.target.closest(".artist-card")) {
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
