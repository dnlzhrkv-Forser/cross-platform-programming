// Експеримент №2: набір жанрових іконок — PNG-набір vs SVG (currentColor)
const sharp = require('/home/claude/.npm-global/lib/node_modules/sharp');
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const ROOT = path.resolve(__dirname, '..', '..'), OUT = path.join(ROOT, '04_experiment', 'icons_png');
fs.mkdirSync(OUT, { recursive: true });
const icons = fs.readdirSync(path.join(ROOT, '03_final_assets/icons')).filter(f => /^genre-(?!sprite)/.test(f)).map(f => f.replace('.svg', ''));
const colors = { light: '#1c1233', dark: '#faf6f0', accent: '#f2a93b' };
const sizes = [16, 24, 32, 48];           // CSS-розміри
const dprs = [1, 2];
const svgOf = (n, c) => fs.readFileSync(path.join(ROOT, '03_final_assets/icons', n + '.svg'), 'utf8').replace(/currentColor/g, c).replace('<svg ', '<svg width="24" height="24" ');
const raw = async (buf) => (await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true }));
function psnr(a, b) { let s = 0; for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; } const mse = s / a.length; return mse === 0 ? 99 : 10 * Math.log10(255 * 255 / mse); }
(async () => {
  // 1) Генерація PNG-набору (усі теми × розміри × dpr) з таймером
  let t0 = Date.now(), pngBytes = 0, pngFiles = 0;
  for (const n of icons) for (const [cn, c] of Object.entries(colors)) for (const s of sizes) for (const d of dprs) {
    const px = s * d, buf = await sharp(Buffer.from(svgOf(n, c)), { density: 72 * px / 24 }).resize(px, px).png({ compressionLevel: 9, effort: 10 }).toBuffer();
    fs.writeFileSync(path.join(OUT, `${n}_${cn}_${s}@${d}x.png`), buf); pngBytes += buf.length; pngFiles++;
  }
  const tPng = Date.now() - t0;
  // 2) SVG: 6 файлів (+ sprite), gzip
  let svgBytes = 0, svgGz = 0, svgFiles = 0;
  for (const n of icons) { const b = fs.readFileSync(path.join(ROOT, '03_final_assets/icons', n + '.svg')); svgBytes += b.length; svgGz += zlib.gzipSync(b, { level: 9 }).length; svgFiles++; }
  const spr = fs.readFileSync(path.join(ROOT, '03_final_assets/icons/genre-sprite.svg')); const sprGz = zlib.gzipSync(spr, { level: 9 }).length;
  // 3) Чіткість: 24px-PNG @1x розтягнутий браузером до 48px (2x-екран) vs еталон SVG@48 ; і PNG 16@1x -> 32
  const res = [];
  for (const [base, up] of [[16, 32], [24, 48], [32, 64]]) {
    let acc = 0, accSvg = 0;
    for (const n of icons) {
      const ref = await raw(await sharp(Buffer.from(svgOf(n, colors.light)), { density: 72 * up / 24 }).resize(up, up).png().toBuffer());
      const small = await sharp(Buffer.from(svgOf(n, colors.light)), { density: 72 * base / 24 }).resize(base, base).png().toBuffer();
      const stretched = await raw(await sharp(small).resize(up, up, { kernel: 'linear' }).png().toBuffer());   // як браузер масштабує 1x-PNG на 2x-екрані
      acc += psnr(ref.data, stretched.data);
      const svgRe = await raw(await sharp(Buffer.from(svgOf(n, colors.light)), { density: 72 * up / 24 }).resize(up, up).png().toBuffer());
      accSvg += psnr(ref.data, svgRe.data);
    }
    res.push({ css_px: base, dpr2_px: up, psnr_png1x_stretched: +(acc / icons.length).toFixed(1), psnr_svg: +(accSvg / icons.length).toFixed(1) });
  }
  const out = { icons: icons.length, themes: 3, png: { files: pngFiles, kb: +(pngBytes / 1024).toFixed(1), gen_ms: tPng }, svg: { files: svgFiles, kb: +(svgBytes / 1024).toFixed(2), gzip_kb: +(svgGz / 1024).toFixed(2), sprite_kb: +(spr.length / 1024).toFixed(2), sprite_gzip_kb: +(sprGz / 1024).toFixed(2) }, sharpness: res };
  fs.writeFileSync(path.join(ROOT, '04_experiment', 'exp2_icons_results.json'), JSON.stringify(out, null, 1)); console.log(JSON.stringify(out, null, 1));
})();
