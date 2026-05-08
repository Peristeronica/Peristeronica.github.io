document.addEventListener("DOMContentLoaded", () => {
  const videoContainer = document.getElementById("video-container");
  const data = window.NICO_MYLIST_DATA;

  function getVideoList() {
    if (!data || !Array.isArray(data.videos) || data.videos.length === 0) {
      throw new Error("Video list is empty.");
    }

    return data.videos;
  }

  function displayNicovideoEmbed(video) {
    videoContainer.innerHTML = "";

    const script = document.createElement("script");
    script.type = "application/javascript";
    script.src = `https://embed.nicovideo.jp/watch/${video.id}/script?w=720&h=480`;

    videoContainer.appendChild(script);

    const link = document.createElement("a");
    link.href = video.url;
    link.textContent = video.title || "Open video page";
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const fallback = document.createElement("noscript");
    fallback.appendChild(link);

    videoContainer.appendChild(fallback);
  }

  try {
    const videos = getVideoList();
    const randomIndex = Math.floor(Math.random() * videos.length);

    displayNicovideoEmbed(videos[randomIndex]);
  } catch (error) {
    console.error(error);
    videoContainer.textContent = "Failed to load video.";
  }
});
