document.addEventListener('DOMContentLoaded', () => {
    // 埋め込みコードの配列を定義します
    const embedCodes = [
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm42573094/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm42573094">夏風邪 ft.初音ミク / Caffeina</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44356086/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44356086">バルーンリリース / feat. 初音ミク</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44599348/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44599348">シズイノラメント(feat.初音ミク)</a></noscript>'
    ];

    const videoContainer = document.getElementById('video-container');

    /**
     * ランダムな埋め込みコードを`video-container`に挿入する関数
     */
    function displayRandomEmbedCode() {
        // 現在表示されているコンテンツをクリアします
        videoContainer.innerHTML = '';

        // ランダムなインデックスを生成します
        const randomIndex = Math.floor(Math.random() * embedCodes.length);
        const selectedEmbedCode = embedCodes[randomIndex];

        // 選択された埋め込みコードをHTMLとして挿入します
        // text/htmlタイプでDOMParserを使用してスクリプトを安全に解析します
        const parser = new DOMParser();
        const doc = parser.parseFromString(selectedEmbedCode, 'text/html');
        const scriptElements = doc.querySelectorAll('script');
        const noscriptElements = doc.querySelectorAll('noscript');

        // <noscript>タグがあれば追加します
        noscriptElements.forEach(element => {
            videoContainer.appendChild(element.cloneNode(true));
        });

        // <script>タグをDOMに追加して実行します
        scriptElements.forEach(script => {
            const newScript = document.createElement('script');
            // type属性をコピー
            if (script.type) {
                newScript.type = script.type;
            }
            // src属性があればコピー
            if (script.src) {
                newScript.src = script.src;
            } else {
                // srcがない場合はインラインスクリプトの内容をコピー
                newScript.textContent = script.textContent;
            }
            videoContainer.appendChild(newScript);
        });
    }

    // ページ読み込み時に動画を表示します
    displayRandomEmbedCode();
});