document.addEventListener('DOMContentLoaded', async () => {
  const videoContainer = document.getElementById('video-container');

  async function fetchVideoList() {
    const response = await fetch('./data/nico-mylist.json', {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`JSON取得失敗: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data.videos) || data.videos.length === 0) {
      throw new Error('動画リストが空です');
    }

    return data.videos;
  }

  function displayNicovideoEmbed(video) {
    videoContainer.innerHTML = '';

    const script = document.createElement('script');
    script.type = 'application/javascript';
    script.src = `https://embed.nicovideo.jp/watch/${video.id}/script?w=720&h=480`;

    videoContainer.appendChild(script);

    const link = document.createElement('a');
    link.href = video.url;
    link.textContent = video.title || '動画ページを開く';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    const fallback = document.createElement('noscript');
    fallback.appendChild(link);

    videoContainer.appendChild(fallback);
  }

  try {
    const videos = await fetchVideoList();

    const randomIndex = Math.floor(Math.random() * videos.length);
    const selectedVideo = videos[randomIndex];

    displayNicovideoEmbed(selectedVideo);

  } catch (error) {
    console.error(error);
    videoContainer.textContent = '動画の読み込みに失敗しました。';
  }
});