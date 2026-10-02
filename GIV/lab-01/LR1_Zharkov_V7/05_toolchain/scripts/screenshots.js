const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const path = require('path'); const ROOT = path.resolve(__dirname, '..', '..'); const url = 'file://' + ROOT + '/06_demo/index.html';
(async () => {
  const b = await chromium.launch();
  const shots = [['demo-desktop-light', 1440, 900, 'light', 1], ['demo-desktop-dark', 1440, 900, 'dark', 1], ['demo-mobile-light', 390, 844, 'light', 2]];
  for (const [n, w, h, th, dpr] of shots) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr }); await p.goto(url);
    await p.evaluate(t => document.documentElement.dataset.theme = t, th); await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(ROOT, '04_experiment', n + '.png'), fullPage: true }); await p.close();
  }
  await b.close();
})();
