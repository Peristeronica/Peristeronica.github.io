document.addEventListener('DOMContentLoaded', () => {
    // 埋め込みコードの配列を定義します
    const embedCodes = [
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44478568/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44478568">꒰ა(⸝⸝ↀᯅↀ⸝⸝)໒꒱</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm43481290/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm43481290">ダメの通り道</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44934445/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44934445">あ❗️ヒカリのぶんも❗️</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44393511/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44393511">Y軸</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm42280034/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm42280034">あついほしの</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44173539/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44173539">危険な伝説が……はじまる。</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44939801/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44939801">Usagi Flapが全く気付かないうちにWiiショッピングチャンネルになる</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm43908051/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm43908051">イガクフ</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm41951954/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm41951954">めっちゃデコの長いソラでタイタニックのテーマを演奏する人</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm45013279/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm45013279">くるくるヒカリ</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44502248/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44502248">不知火カヤ合作 ～反省してくだ祭～</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44704889/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44704889">ドーナッツマニア</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm43896893/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm43896893">ムツキマニア</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm43908051/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm43908051">イガクフ</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm43718077/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm43718077">でんせつ</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm43353985/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm43353985">猫ホシノ</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm43671832/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm43671832">スケバン時代</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm43651118/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm43651118">小さな宇沢のうた</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44638372/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44638372">ウザ通信</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm45010022/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm45010022">宇沢よ、来い</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm43446602/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm43446602">宇沢レイサ</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44389790/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44389790">柚鳥ナツ合作 ～伝説が……はじまる。～</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44389790/script?w=720&h=480&from=83"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44389790?from=83">柚鳥ナツ合作 ～伝説が……はじまる。～</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm43154439/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm43154439">かりふぉっふぉ</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm43222240/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm43222240">922歳位にはカリフォると思ってた</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm42729604/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm42729604">ムツキング</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm41820218/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm41820218">ん、私ともあっちむいてHO-oooooooooo AAAAE-A-A-I-A-U- JO-oooooooooooo AAE-O-A-A-U-U-A-</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm43439422/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm43439422">シュン、お前も寝ろ！の消失</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm41988638/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm41988638">シュン、お前も寝ろ！解剖</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm42586328/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm42586328">シュン、お前も風呂！</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm43694132/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm43694132">古関wii</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm40467683/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm40467683">プリンを、二つも食べちゃいます！</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm43317115/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm43317115">オーバーイブキ</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44189380/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44189380">Mutsuki from the far California</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44391661/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44391661">はいおわり / こっちのゆとり</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm42760207/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm42760207">カビゴンである必要性がない</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44916768/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44916768">アオバ時代</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm43697905/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm43697905">ヒナ　セナ　セリナ　ヒナ　セリナ</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm42787013/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm42787013">カビゴンである必要性が無い電車内アナウンス</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm42765240/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm42765240">棗イロハからのお知らせ</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm43272830/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm43272830">寿司屋でガリ食べよう</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm43874984/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm43874984">自警団のスーパースターダストメドレー</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm43417713/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm43417713">ちっちゃなヒナ</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44807329/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44807329">365歩のﾖコーチﾁ</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44814496/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44814496">大きな乳時計</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44779501/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44779501">横乳出し太郎 横乳100％</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44742645/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44742645">糸/天雨アコ</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44820942/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44820942">よこちちっていいな</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44766791/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44766791">よこちち姫</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44958180/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44958180">乳出会／はみ出タル風キ委員ング</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm42496640/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm42496640">あっはは…確かに昨日『暑くて歪みそう』とは言ったけどさ～…</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm45068051/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm45068051">七味唐辛子を販売する宇沢レイサ</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44138206/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44138206">まっカなリフォ</a></noscript>',
        '<script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm44722580/script?w=720&h=480"></script><noscript><a href="https://www.nicovideo.jp/watch/sm44722580">セミナーガーデン</a></noscript>'
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