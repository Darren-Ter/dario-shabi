// Usage: node render.js            -> film.mp4 (+ audio.wav)
//        node render.js --stills   -> stills/*.jpg at key moments
// Env:   CHROME_PATH  path to a Chrome/Chromium binary (auto-detected otherwise)
//        STILLS       output dir for --stills (default: stills)
//        STILLS_T     comma-separated times in seconds for --stills
const puppeteer = require('puppeteer-core');
const ffmpeg = require('ffmpeg-static');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const FPS = 30;
const out = f => path.join(__dirname, f);

const CHROME_CANDIDATES = {
  darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium'],
  linux: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'],
  win32: ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'],
};
const chromePath = process.env.CHROME_PATH || (CHROME_CANDIDATES[process.platform] || []).find(p => fs.existsSync(p));
if (!chromePath) { console.error('Chrome not found. Set CHROME_PATH to a Chrome/Chromium binary.'); process.exit(1); }
const stillsMode = process.argv.includes('--stills');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--allow-file-access-from-files'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  await page.goto('file://' + path.resolve(__dirname, 'film.html') + '?export=1', { waitUntil: 'networkidle0' });
  await page.evaluate(() => window.__film.ready);
  const DUR = await page.evaluate(() => window.__film.DUR);

  const grab = t => page.evaluate(t => {
    window.__film.renderAt(t);
    return document.getElementById('c').toDataURL('image/jpeg', 0.93).split(',')[1];
  }, t);

  if (stillsMode) {
    const SD = out(process.env.STILLS || 'stills'); fs.mkdirSync(SD, { recursive: true });
    const times = process.env.STILLS_T ? process.env.STILLS_T.split(',').map(Number) : await page.evaluate(() => window.__film.KEYS);
    for (const t of times) fs.writeFileSync(`${SD}/${t.toFixed(2).padStart(5, '0')}.jpg`, Buffer.from(await grab(t), 'base64'));
    await browser.close();
    return;
  }

  const wav = await page.evaluate(() => window.__film.wavBase64(window.__film.synth()));
  fs.writeFileSync(out('audio.wav'), Buffer.from(wav, 'base64'));

  const ff = spawn(ffmpeg, ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', out('audio.wav'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-maxrate', '12M', '-bufsize', '24M', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out('film.mp4')], { stdio: ['pipe', 'ignore', 'inherit'] });
  const total = Math.round(DUR * FPS);
  for (let f = 0; f < total; f++) {
    const buf = Buffer.from(await grab(f / FPS), 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 150 === 0) console.log(`frame ${f}/${total}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('done: film.mp4');
})();
