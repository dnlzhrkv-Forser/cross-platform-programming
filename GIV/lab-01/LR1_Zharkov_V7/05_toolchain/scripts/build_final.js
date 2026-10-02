// Збірка production-assets із 01_source (повторювана, безпечна для запуску багато разів).
const sharp = require('/home/claude/.npm-global/lib/node_modules/sharp');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const SRC = f => path.join(ROOT, '01_source', f), FIN = f => path.join(ROOT, '03_final_assets', f), WORK = f => path.join(ROOT, '02_work', f);
const kb = f => +(fs.statSync(f).size / 1024).toFixed(1);
const WEBP_POSTER = { quality: 82, effort: 6, smartSubsample: true };
const TARGET = 2 / 3;            // канонічне співвідношення постера
const TOL = 0.02;                // допуск, коли безпечно робити cover-crop
const SAFE_MARGIN = 0.04;        // текст має лишатись ≥4% від краю після кропу

async function posterPipeline() {
  const meta = JSON.parse(fs.readFileSync(SRC('posters-meta.json'), 'utf8'));
  const decisions = {};
  const incoming = fs.readdirSync(path.join(ROOT, '01_source')).filter(f => /^poster-.*-master\.jpg$/.test(f)).map(f => f.replace(/^poster-|-master\.jpg$/g, ''));
  for (const id of incoming) if (!meta[id]) console.warn('SKIP (немає запису в posters-meta.json):', id);
  for (const id of Object.keys(meta)) {
    const srcPath = SRC(`poster-${id}-master.jpg`);
    const file = await sharp(srcPath).rotate().toBuffer();     // normalize orientation: застосувати EXIF-поворот
    const m = await sharp(file).metadata(); const { width: w, height: h } = m;
    if (w < 1000) { decisions[id] = { mode: 'REJECT: ширина < 1000 px', source_size: `${w}x${h}` }; console.warn('REJECT', id); continue; }   // валідація приймання
    const ar = w / h, dev = ar / TARGET - 1, bb = meta[id].text_bbox;
    let mode, buf;
    if (Math.abs(dev) <= TOL) {
      mode = 'cover-crop (відхилення ≤2%)';
      buf = await sharp(file).resize(1000, 1500, { fit: 'cover' }).toBuffer();
    } else if (ar > TARGET) {                  // занадто широкий -> кроп по ширині
      const cw = Math.round(h * TARGET), x0 = Math.round((w - cw) / 2);
      const nx0 = (bb[0] * w - x0) / cw, nx1 = (bb[2] * w - x0) / cw;
      if (nx0 >= SAFE_MARGIN && nx1 <= 1 - SAFE_MARGIN) { mode = 'cover-crop (safe-zone OK)'; buf = await sharp(file).extract({ left: x0, top: 0, width: cw, height: h }).resize(1000, 1500).toBuffer(); }
      else {
        const add = Math.round(w / TARGET) - h, top = Math.floor(add / 2), bot = add - top;
        mode = `pad/extend (+${add}px по висоті): кроп зачепив би текст`;
        const padded = await sharp(file).extend({ top, bottom: bot, extendWith: 'copy' }).toBuffer(); // extend і resize у sharp виконуються в фіксованому порядку -> два етапи
        buf = await sharp(padded).resize(1000, 1500).toBuffer();
        // для звіту: що було б при наївному cover-crop
        await sharp(file).resize(1000, 1500, { fit: 'cover' }).png().toFile(WORK(`naive-crop-${id}.png`));
      }
    } else { mode = 'MANUAL (занадто високий/вузький)'; buf = await sharp(file).resize(1000, 1500, { fit: 'cover' }).toBuffer(); }
    await sharp(buf).png().toFile(WORK(`normalized-${id}.png`));
    const out = {};
    for (const [name, [tw, th]] of Object.entries({ card: [320, 480], detail: [800, 1200], thumb: [96, 144] })) {
      const fn = FIN(`posters/poster-${id}-${name}.webp`);
      await sharp(buf).resize(tw, th, { kernel: 'lanczos3' }).webp(WEBP_POSTER).toFile(fn);
      out[name] = { file: path.relative(ROOT, fn), kb: kb(fn), size: `${tw}x${th}` };
    }
    // порівняння з JPEG на card (для звіту)
    const jpg = await sharp(buf).resize(320, 480).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    decisions[id] = { source_size: `${w}x${h}`, ratio: +ar.toFixed(4), deviation_pct: +(dev * 100).toFixed(2), mode, master_kb: kb(srcPath), out, card_jpeg_q82_kb: +(jpg.length / 1024).toFixed(1) };
  }
  fs.writeFileSync(path.join(ROOT, '04_experiment', 'poster_decisions.json'), JSON.stringify(decisions, null, 1));
  console.log(JSON.stringify(decisions, null, 1));
}

async function heroes() {
  const jobs = [['hero-desktop-master.png', 'hero/hero-desktop.webp', 85], ['hero-mobile-master.png', 'hero/hero-mobile.webp', 85], ['backdrop-zaliznyi-horyzont.png', 'backdrop/backdrop-zaliznyi-horyzont.webp', 85]];
  for (const [src, dst, q] of jobs) await sharp(WORK(src)).webp({ quality: q, effort: 6 }).toFile(FIN(dst));
}

const minify = s => s.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').replace(/\n/g, '').trim();
function svgs() {
  const logo = { 'logo-light.svg': 'logo-master-light.svg', 'logo-dark.svg': 'logo-master-dark.svg' };
  for (const [d, s] of Object.entries(logo)) fs.writeFileSync(FIN('logo/' + d), minify(fs.readFileSync(SRC(s), 'utf8')));
  fs.writeFileSync(FIN('css/header-pattern.svg'), minify(fs.readFileSync(SRC('header-pattern-master.svg'), 'utf8')));
  const icons = fs.readdirSync(SRC('icons')).filter(f => f.endsWith('.svg')); let sprite = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">';
  for (const f of icons) {
    const s = minify(fs.readFileSync(SRC('icons/' + f), 'utf8')).replace(' width="24" height="24"', '');
    fs.writeFileSync(FIN('icons/' + f), s);
    sprite += `<symbol id="${f.replace('.svg', '')}" viewBox="0 0 24 24" fill="currentColor">${s.replace(/^<svg[^>]*>/, '').replace('</svg>', '')}</symbol>`;
  }
  fs.writeFileSync(FIN('icons/genre-sprite.svg'), sprite + '</svg>');
}
(async () => { svgs(); await heroes(); await posterPipeline(); })();
