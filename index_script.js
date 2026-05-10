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

function profileTypeClass(type) {
  return `type-${String(type).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function getCaffeinaFeaturedWorks() {
  const works = window.siteWorks?.caffeina || [];

  return caffeinaFeaturedCovers
    .map((cover) => works.find((work) => work.cover === cover))
    .filter(Boolean);
}

function createProfileWorkCard(work) {
  const card = document.createElement("a");
  card.className = `profile-work-card ${profileTypeClass(work.type)}`;
  card.href = `./caffeina_works.html?viewer=${encodeURIComponent(work.title)}`;

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
  const container = document.querySelector('[data-featured-works="caffeina"]');

  if (!container) {
    return;
  }

  const works = getCaffeinaFeaturedWorks();
  container.replaceChildren(...works.map((work) => createProfileWorkCard(work)));
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
