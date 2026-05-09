const worksData = window.siteWorks;
const typeLabels = {
  Music: "Music",
  Album: "Album",
  Game: "Game",
  Goods: "Goods",
  "1day_DTM": "1day_DTM",
  Illust: "Illust",
  "1day_Movie": "1day_Movie",
};

function sortByNewest(works) {
  return [...works].sort((a, b) => {
    const aTime = Date.parse(a.date || "") || 0;
    const bTime = Date.parse(b.date || "") || 0;
    return bTime - aTime;
  });
}

function typeClass(type) {
  return `type-${String(type).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function createWorkCard(work) {
  const wrapper = document.createElement(work.collection ? "button" : work.url ? "a" : "article");
  wrapper.className = `work-card ${typeClass(work.type)}`;

  if (work.collection) {
    wrapper.type = "button";
    wrapper.addEventListener("click", () => openCollection(work));
  } else if (work.url) {
    wrapper.href = work.url;
    wrapper.target = "_blank";
    wrapper.rel = "noreferrer";
  }

  const cover = document.createElement("figure");
  cover.className = "work-cover";

  const image = document.createElement("img");
  image.src = work.cover;
  image.alt = "";
  cover.append(image);

  const tag = document.createElement("span");
  tag.className = "work-tag";
  tag.textContent = typeLabels[work.type] || work.type;
  cover.append(tag);

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

  const date = document.createElement("time");
  date.dateTime = work.date;
  date.textContent = work.date;
  body.append(date);

  wrapper.append(cover, body);
  return wrapper;
}

function renderWorks(selector, works) {
  const container = document.querySelector(selector);

  if (!container) {
    return;
  }

  container.replaceChildren(...sortByNewest(works).map(createWorkCard));
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
  }
});

renderWorks('[data-works-list="caffeina"]', worksData.caffeina);
renderWorks('[data-works-list="peristeronica-music"]', worksData.peristeronica.music);
renderWorks('[data-works-list="peristeronica-other"]', worksData.peristeronica.other);
