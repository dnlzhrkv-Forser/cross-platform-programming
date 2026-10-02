// Вимірює час завантаження+decode() у Chromium (холодний кеш, file://) для варіантів hero
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..');
(async () => {
  const b = await chromium.launch(); const out = {};
  const files = { 'SVG': '01_source/hero-desktop-master.svg', 'JPEG q85': '04_experiment/hero-desktop-master_JPEG_q85.jpg',
    'WebP q85': '04_experiment/hero-desktop-master_WebP_q85.webp', 'AVIF q65': '04_experiment/hero-desktop-master_AVIF_q65.avif' };
  for (const [k, f] of Object.entries(files)) {
    const ts = [];
    for (let i = 0; i < 9; i++) {
      const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
      await p.goto('file://' + path.join(ROOT,'04_experiment','blank.html'));
      const url = 'file://' + path.join(ROOT, f) + '?r=' + i + Math.random();
      const t = await p.evaluate(async (u) => { const img = new Image(); const t0 = performance.now(); img.src = u; await img.decode(); document.body.appendChild(img); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return performance.now() - t0; }, url);
      ts.push(t); await p.close();
    }
    ts.sort((a, c) => a - c); out[k] = +ts[4].toFixed(1);
  }
  fs.writeFileSync(path.join(ROOT, '04_experiment', 'exp1_decode_ms.json'), JSON.stringify(out, null, 1)); console.log(out); await b.close();
})();
