document.addEventListener('DOMContentLoaded', async () => {
  const videoContainer = document.getElementById('video-container');

  const MYLIST_ID = '78998106';
  const PAGE_SIZE = 100;

  async function fetchMylistPage(page) {
    const url =
      `https://nvapi.nicovideo.jp/v2/mylists/${MYLIST_ID}` +
      `?page=${page}` +
      `&pageSize=${PAGE_SIZE}` +
      `&sortKey=addedAt` +
      `&sortOrder=desc`;

    const response = await fetch(url, {
      headers: {
        'X-Frontend-ID': '6',
        'X-Frontend-Version': '0'
      }
    });

    if (!response.ok) {
      throw new Error(`マイリスト取得失敗: ${response.status}`);
    }

    return await response.json();
  }

  async function fetchAllVideoIdsFromMylist() {
    const firstData = await fetchMylistPage(1);

    const mylist = firstData.data?.mylist;
    if (!mylist) {
      throw new Error('マイリスト情報を取得できませんでした');
    }

    const totalCount = mylist.totalItemCount ?? 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    let items = mylist.items ?? [];

    for (let page = 2; page <= totalPages; page++) {
      const data = await fetchMylistPage(page);
      const pageItems = data.data?.mylist?.items ?? [];
      items = items.concat(pageItems);
    }

    const videoIds = items
      .map(item => {
        return (
          item.video?.id ||
          item.watchId ||
          item.id ||
          item.videoId ||
          null
        );
      })
      .filter(id => typeof id === 'string' && id.match(/^sm\d+$/));

    return [...new Set(videoIds)];
  }

  function displayNicovideoEmbed(videoId) {
    videoContainer.innerHTML = '';

    const script = document.createElement('script');
    script.type = 'application/javascript';
    script.src = `https://embed.nicovideo.jp/watch/${videoId}/script?w=720&h=480`;

    videoContainer.appendChild(script);
  }

  try {
    const videoIds = await fetchAllVideoIdsFromMylist();

    if (videoIds.length === 0) {
      throw new Error('マイリスト内の動画IDを取得できませんでした');
    }

    const randomIndex = Math.floor(Math.random() * videoIds.length);
    const selectedVideoId = videoIds[randomIndex];

    displayNicovideoEmbed(selectedVideoId);

  } catch (error) {
    console.error(error);
    videoContainer.textContent = '動画の読み込みに失敗しました。';
  }
});