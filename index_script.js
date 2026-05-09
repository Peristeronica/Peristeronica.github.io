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
