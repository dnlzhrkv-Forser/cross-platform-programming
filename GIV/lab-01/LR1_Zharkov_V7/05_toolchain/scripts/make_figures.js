const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..'), FIG = path.join(ROOT, '05_toolchain', 'figures');
const TMP = path.join(FIG, '_tmp.html');
const show = async (pg, html) => { fs.writeFileSync(TMP, html); await pg.goto('file://' + TMP); await pg.waitForLoadState('load'); await pg.waitForTimeout(150); };
const F = p => 'file://' + path.join(ROOT, p);
const base = `<meta charset=utf-8><style>*{box-sizing:border-box}body{margin:0;font-family:'DejaVu Sans',sans-serif;background:#faf6f0;color:#1c1233}
.wrap{padding:22px 24px;width:1350px} h4{margin:0 0 14px;font-size:20px}
.chain{display:flex;align-items:center;gap:0}.box{flex:1;background:#1c1233;color:#f3eee6;border-radius:12px;padding:14px 10px;min-height:76px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:14.5px;line-height:1.3}
.arr{width:34px;flex:none;text-align:center;color:#8f86b0;font-size:26px}.box.qa{background:#2b3b52}.box.fin{background:#c77d10;color:#fff}
.cap{margin-top:10px;font-size:13px;color:#6b6482}</style>`;
const chain = (title, steps, cap) => `${base}<div class=wrap id=f><h4>${title}</h4><div class=chain>${steps.map((s, i) => (i ? '<div class=arr>➜</div>' : '') + `<div class="box ${i === steps.length - 1 ? 'fin' : (/QA|Browser|перевірка/i.test(s) ? 'qa' : '')}">${s}</div>`).join('')}</div><div class=cap>${cap}</div></div>`;
const figs = {
 'toolchain-1-poster': chain('Toolchain 1 — Постер (партнерський master → web-derivatives)', ['Master постер<br>(JPEG від партнера)', 'Normalize<br>orientation / EXIF', 'Safe-zone check:<br>crop або pad', 'Card 320×480 +<br>detail 800×1200 + thumb', 'Optimize<br>WebP q82', 'QA: текст<br>не обрізано'], 'Master не перезаписується; рішення crop/pad приймається за метаданими text_bbox (posters-meta.json).'),
 'toolchain-2-hero': chain('Toolchain 2 — Hero / backdrop (desktop + mobile art direction)', ['SVG-майстри<br>desktop / mobile', 'Art direction:<br>2 композиції', 'Rasterize<br>1600×900 · 720×900', 'Encode<br>WebP q85', 'Browser check:<br>&lt;picture&gt; + HTML-текст', 'hero-desktop.webp<br>hero-mobile.webp'], 'Заголовок і кнопка — HTML поверх «екрана»; у зображенні тексту немає (локалізація, доступність, SEO).'),
 'toolchain-3-icons': chain('Toolchain 3 — Жанрові іконки (SVG-система)', ['Ескіз / SVG-майстер<br>viewBox 24×24', 'Cleanup: currentColor,<br>evenodd, без stroke', 'Minify SVG<br>(≈0.2–0.4 КБ)', 'Sprite &lt;symbol&gt;<br>+ окремі файли', 'Перевірка 16/24/32 px,<br>light / dark', 'genre-*.svg<br>genre-sprite.svg'], 'Однакові viewBox і правила заповнення — щоб набір виглядав єдиним у малих розмірах.'),
 'toolchain-4-batch': chain('Toolchain 4 (додатковий) — щотижневе оновлення афіші (автоматизація)', ['Нові постери<br>у /incoming', 'Валідація: ratio,<br>розмір, meta.json', 'build_final.js<br>(sharp / libvips)', '3 derivatives<br>на кожен постер', 'QA-звіт JSON:<br>mode, kb, safe-zone', 'Публікація<br>у CDN / репозиторій'], 'Ручним лишається тільки: заповнення text_bbox для нетипових постерів та вирішення «MANUAL»-випадків.'),
};
(async () => {
  const b = await chromium.launch();
  for (const [n, html] of Object.entries(figs)) { const p = await b.newPage({ viewport: { width: 1400, height: 300 }, deviceScaleFactor: 1.5 }); await show(p, html); await (await p.$('#f')).screenshot({ path: path.join(FIG, n + '.png') }); await p.close(); }

  // Fig: naive vs safe
  let p = await b.newPage({ viewport: { width: 1300, height: 900 }, deviceScaleFactor: 1 });
  const NV = F('02_work/naive-crop-zaliznyi-horyzont.png'), SF = F('02_work/normalized-zaliznyi-horyzont.png');
  await show(p, `${base}<style>.g{display:flex;gap:24px;padding:22px;width:1300px}.c{width:390px;min-width:0}.c img.m{width:100%;display:block;border-radius:6px}.zoom{height:96px;overflow:hidden;border-radius:6px;margin-top:8px;border:3px solid #c0392b}.zoom.ok{border-color:#2e8b57}.zoom img{width:780px;display:block;margin-top:-985px}.t{font-weight:700;margin-bottom:8px;font-size:14px;min-height:36px}.s{font-size:13px;color:#6b6482;margin-top:6px}</style>
   <div class=g id=f><div class=c><div class=t>Джерело партнера 1000×1333 (3:4)</div><img class=m src="${F('01_source/poster-zaliznyi-horyzont-master.jpg')}"><div class=s>Назва займає ≈3%…97% ширини</div></div>
   <div class=c><div class=t>Наївний cover-crop до 2:3 ✗</div><img class=m src="${NV}"><div class="zoom"><img src="${NV}" style="margin-top:-966px"></div><div class=s>Літери на краях зрізано (збільшено ×2)</div></div>
   <div class=c><div class=t>Safe-zone pipeline: pad ✓</div><img class=m src="${SF}"><div class="zoom ok"><img src="${SF}" style="margin-top:-916px"></div><div class=s>Назва повна; додано +167 px тла (copy edge)</div></div></div>`);
  await (await p.$('#f')).screenshot({ path: path.join(FIG, 'poster-naive-vs-safe.png') }); await p.close();

  // Fig: derivatives
  p = await b.newPage({ viewport: { width: 1300, height: 700 }, deviceScaleFactor: 1 });
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, '04_experiment', 'poster_decisions.json'), 'utf8'));
  const id = 'misyachna-havan', o = d[id];
  await show(p, `${base}<style>.g{display:flex;gap:34px;align-items:flex-end;padding:22px;width:1200px}.c{text-align:center;font-size:13px}.c img{display:block;margin:0 auto 8px;border-radius:6px;box-shadow:0 2px 8px #0003}</style>
   <div class=g id=f><div class=c><img src="${F('01_source/poster-' + id + '-master.jpg')}" height=420><b>master.jpg</b><br>1000×1500 · ${d[id].master_kb} KB</div>
   <div class=c><img src="${F(o.out.detail.file)}" height=360><b>detail.webp</b><br>800×1200 · ${o.out.detail.kb} KB</div>
   <div class=c><img src="${F(o.out.card.file)}" width=240><b>card.webp</b><br>320×480 · ${o.out.card.kb} KB</div>
   <div class=c><img src="${F(o.out.thumb.file)}" width=96><b>thumb.webp</b><br>96×144 · ${o.out.thumb.kb} KB</div></div>`);
  await (await p.$('#f')).screenshot({ path: path.join(FIG, 'poster-derivatives.png') }); await p.close();

  // Fig: icons sheet (SVG, currentColor) light/dark and sizes
  const sprite = fs.readFileSync(path.join(ROOT, '03_final_assets/icons/genre-sprite.svg'), 'utf8');
  const names = ['action', 'comedy', 'drama', 'horror', 'thriller', 'crime'];
  const row = (sz, col) => names.map(n => `<svg width=${sz} height=${sz} style="color:${col}"><use href="#genre-${n}"/></svg>`).join('');
  p = await b.newPage({ viewport: { width: 900, height: 400 }, deviceScaleFactor: 2 });
  await show(p, `${base}<style>.pn{padding:20px 24px;display:flex;flex-direction:column;gap:12px}.r{display:flex;gap:18px;align-items:center}.lb{width:56px;font-size:12px}.d{background:#1c1233}.h{display:flex}.h>div{flex:1;padding:16px 20px}</style>${sprite}
   <div class=h id=f><div class=pn><b>Light theme</b>${[16, 24, 32, 48].map(s => `<div class=r><span class=lb>${s} px</span>${row(s, '#1c1233')}</div>`).join('')}<div class=r><span class=lb>accent</span>${row(32, '#c77d10')}</div></div>
   <div class="pn d" style="color:#faf6f0"><b>Dark theme</b>${[16, 24, 32, 48].map(s => `<div class=r><span class=lb>${s} px</span>${row(s, '#faf6f0')}</div>`).join('')}<div class=r><span class=lb>accent</span>${row(32, '#f2a93b')}</div></div></div>`);
  await (await p.$('#f')).screenshot({ path: path.join(FIG, 'icons-sheet.png') }); await p.close();

  // Fig: exp2 — PNG@1x vs SVG at DPR2
  p = await b.newPage({ viewport: { width: 700, height: 400 }, deviceScaleFactor: 2 });
  const png = (n, s) => `<img src="${F('04_experiment/icons_png/genre-' + n + '_light_' + s + '@1x.png')}" width=${s} height=${s}>`;
  await show(p, `${base}<style>.pn{padding:18px 24px}.r{display:flex;gap:16px;align-items:center;margin:8px 0}.lb{width:150px;font-size:12px}</style>${sprite}
   <div class=pn id=f><b>Екран 2× DPR: PNG @1x (розтягує браузер) vs SVG</b>
   ${[16, 24, 32].map(s => `<div class=r><span class=lb>PNG ${s}@1x, ${s} px</span>${names.map(n => png(n, s)).join('')}</div><div class=r><span class=lb>SVG, ${s} px</span>${row(s, '#1c1233')}</div>`).join('')}</div>`);
  await (await p.$('#f')).screenshot({ path: path.join(FIG, 'exp2-png-vs-svg.png') }); await p.close();

  // Fig: logo variants
  p = await b.newPage({ viewport: { width: 900, height: 300 }, deviceScaleFactor: 2 });
  await show(p, `${base}<style>.h{display:flex;width:900px}.h>div{flex:1;padding:22px;display:flex;flex-direction:column;gap:14px;font-size:12px}.l{background:#faf6f0;color:#1c1233}.d{background:#1c1233;color:#faf6f0}.r{display:flex;align-items:center;gap:14px}</style>
   <div class=h id=f><div class=l><b>logo-light.svg (на світлому)</b><div class=r><img src="${F('03_final_assets/logo/logo-light.svg')}" height=80><img src="${F('03_final_assets/logo/logo-light.svg')}" height=40><img src="${F('03_final_assets/logo/logo-light.svg')}" height=24><img src="${F('03_final_assets/logo/logo-light.svg')}" height=16></div><span>80 / 40 / 24 / 16 px</span></div>
   <div class=d><b>logo-dark.svg (на темному)</b><div class=r><img src="${F('03_final_assets/logo/logo-dark.svg')}" height=80><img src="${F('03_final_assets/logo/logo-dark.svg')}" height=40><img src="${F('03_final_assets/logo/logo-dark.svg')}" height=24><img src="${F('03_final_assets/logo/logo-dark.svg')}" height=16></div><span>80 / 40 / 24 / 16 px</span></div></div>`);
  await (await p.$('#f')).screenshot({ path: path.join(FIG, 'logo-variants.png') }); await p.close();

  // Fig: hero pair
  p = await b.newPage({ viewport: { width: 1200, height: 500 }, deviceScaleFactor: 1 });
  await show(p, `${base}<style>.h{display:flex;gap:20px;padding:16px;width:1200px;align-items:flex-end;background:#e9e5ee}.c{font-size:12px}.c img{display:block;margin-bottom:6px}</style>
   <div class=h id=f><div class=c><img src="${F('03_final_assets/hero/hero-desktop.webp')}" width=780><b>hero-desktop.webp</b> 1600×900</div><div class=c><img src="${F('03_final_assets/hero/hero-mobile.webp')}" width=312><b>hero-mobile.webp</b> 720×900</div></div>`);
  await (await p.$('#f')).screenshot({ path: path.join(FIG, 'hero-pair.png') }); await p.close();
  await b.close(); fs.unlinkSync(TMP);
})();
