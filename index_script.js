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
