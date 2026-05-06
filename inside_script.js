document.addEventListener('DOMContentLoaded', async () => {
  const videoContainer = document.getElementById('video-container');

  const MYLIST_ID = '78998106';

  // 直接 nicovideo.jp を fetch すると CORS で失敗する可能性が高いので、
  // ここでは RSS を JSON 化するプロキシを挟む例にしています。
  const RSS_URL = `https://www.nicovideo.jp/mylist/${MYLIST_ID}?rss=2.0`;
  const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`;

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error('マイリストの取得に失敗しました');
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new Error('マイリスト内に動画が見つかりませんでした');
    }

    // RSSの各itemから動画IDを取り出す
    const videoIds = data.items
      .map(item => {
        const match = item.link.match(/watch\/(sm\d+)/);
        return match ? match[1] : null;
      })
      .filter(id => id !== null);

    if (videoIds.length === 0) {
      throw new Error('動画IDを取得できませんでした');
    }

    // ランダムに1つ選ぶ
    const randomIndex = Math.floor(Math.random() * videoIds.length);
    const selectedVideoId = videoIds[randomIndex];

    // ニコニコ埋め込みscriptを作成
    const script = document.createElement('script');
    script.type = 'application/javascript';
    script.src = `https://embed.nicovideo.jp/watch/${selectedVideoId}/script?w=720&h=480`;

    // 表示エリアを空にしてから追加
    videoContainer.innerHTML = '';
    videoContainer.appendChild(script);

    // noscript相当のリンクも一応追加
    const link = document.createElement('a');
    link.href = `https://www.nicovideo.jp/watch/${selectedVideoId}`;
    link.textContent = '動画ページを開く';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    const fallback = document.createElement('noscript');
    fallback.appendChild(link);

    videoContainer.appendChild(fallback);

  } catch (error) {
    console.error(error);

    videoContainer.textContent = '動画の読み込みに失敗しました。';
  }
});