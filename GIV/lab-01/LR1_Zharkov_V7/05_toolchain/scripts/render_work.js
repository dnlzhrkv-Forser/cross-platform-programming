// SVG-джерела -> растрові робочі файли (02_work) та "постачальницькі" JPEG-майстри постерів (01_source)
const sharp = require('/home/claude/.npm-global/lib/node_modules/sharp');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const S = f => path.join(ROOT, '01_source', f), W = f => path.join(ROOT, '02_work', f);
(async () => {
  for (const id of ['misyachna-havan', 'zaliznyi-horyzont', 'smikh-u-provulku']) {
    await sharp(S(`poster-${id}.svg`)).jpeg({ quality: 92, mozjpeg: true }).toFile(S(`poster-${id}-master.jpg`));
  }
  for (const n of ['hero-desktop-master', 'hero-mobile-master', 'backdrop-zaliznyi-horyzont']) {
    await sharp(S(`${n}.svg`)).png().toFile(W(`${n}.png`));
  }
  for (const f of fs.readdirSync(path.join(ROOT,'01_source'))) if (f.endsWith('.jpg')) { const m = await sharp(S(f)).metadata(); console.log(f, m.width, m.height, fs.statSync(S(f)).size); }
})();
