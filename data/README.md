# Data

Structured site data loaded by browser scripts and automation.

- `site-works.js`: manually maintained work metadata
- Music share pages under each `*_works/<work-id>/` are generated from `site-works.js` with `node scripts/generate-music-pages.mjs`. Run it after editing Music metadata or the WORKS page HTML; `--check` verifies they are current.
- `pixiv-illust.js`: generated Pixiv illustration metadata
- `nico-mylist.*`: generated NicoNico RSS data
