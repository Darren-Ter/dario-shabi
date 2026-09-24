# dario-shabi · 为什么 Dario 是个大傻逼

A 51-second satirical short film in Chinese, styled as a riso-printed case file against Anthropic's CEO. Every frame and every note of the score is generated in code. There is no footage, no image assets and no audio samples: the film is one HTML file that draws on a `<canvas>` and synthesizes its 128 BPM soundtrack sample by sample.

一部 51 秒的中文讽刺短片，以孔版印刷（riso）风格的「案卷」形式呈现。画面与音乐全部由代码实时生成：一个 HTML 文件，用 Canvas 绘制每一帧，用代码逐采样合成 128 BPM 的配乐。

[![▶ Watch the film](docs/03.38.jpg)](https://video.aigenius.media/film.mp4)

| | |
|---|---|
| ![Mugshot](docs/05.44.jpg) | ![Terms of service](docs/28.97.jpg) |

**▶ Watch:** [film.mp4 (1080p, sound on)](https://video.aigenius.media/film.mp4)

## How it was made

No video editor, no stock footage, no music software. The film is about 1,200 lines of JavaScript in a single HTML file. It redraws a 1920×1080 canvas 30 times a second from basic shapes and text, and it computes every sample of the soundtrack with a small synthesizer written in the same file. The MP4 is a screen-accurate export: a script opens the page in headless Chrome, captures each frame, and hands the frames and the audio to ffmpeg.

没有剪辑软件、没有素材、没有音乐软件。整部片子是一个约 1200 行 JavaScript 的 HTML 文件：每秒 30 次在 1920×1080 的画布上用图形和文字重绘画面，配乐的每一个采样也由同一文件里的小型合成器计算出来。MP4 则是用脚本在无头 Chrome 中逐帧截取画面，再和音频一起交给 ffmpeg 合成。

## Run it

Open `film.html` in a desktop browser and press play (with sound). It needs an internet connection for Google Fonts.

## Render to MP4

Requires Node 18+ and a local Chrome or Chromium. ffmpeg is bundled through `ffmpeg-static`.

```sh
npm install
npm run render     # -> film.mp4 + audio.wav (1920×1080, 30 fps)
npm run stills     # -> stills/*.jpg at two points in each scene
```

If Chrome isn't found automatically, set `CHROME_PATH=/path/to/chrome`. For stills at specific times, pass `STILLS_T=3.38,5.44`.

## How it works

### One clock for picture and sound

Everything sits on a 128 BPM grid. One beat is `BT = 60 / 128` seconds and one bar is four beats. The `SC` table places each scene by bar number:

```js
['jobs', 7, 8.5, sJobs],   // starts at bar 7, ends at bar 8.5
```

The soundtrack is generated from the same scene start times (`ST.jobs`, `ST.val`, …), so a sound effect and the visual it belongs to are written against the same number and cannot drift apart. `renderAt(t)` draws any moment of the film from `t` alone, with no state carried between frames. That makes scrubbing, playback and export produce identical frames.

### Anatomy of a scene

A scene is a plain function `(ctx, u, d, t)`: the canvas context, the time since the scene started, the scene's length, and the global time. Here is the Axios jobs scene (~13 s), trimmed:

```js
function sJobs(ctx, u, d, t) {
  field(ctx, K.paper);                                     // paper background
  dotGrad(ctx, K.blue, 18, radial(1900, 0, 900, 1.3));     // halftone glow in the corner
  stagger(ctx, '“1–5 年内，', 120, 280, u, 0, { size: 78 }); // characters drop in one by one
  if (u > BT) text(ctx, '一半', 90, 560, {                  // on beat 2, "half" slams in
    size: 330, color: K.red, scale: slamS(u, BT, 1.3, .08), shadow: K.ink });
  // ...then five of the ten workers vanish, one every half beat
}
```

And the matching lines in `synth()`:

```js
stampHit(ST.jobs + BT, 1.2); slam(ST.jobs + BT, .7);                  // the "一半" slam
for (let j = 0; j < 5; j++) pop(ST.jobs + 2 * BT + j * BT * .5);      // one pop per vanishing worker
```

Camera shake is keyed the same way (`imp(ST.jobs + BT, 1.1)`), so the picture jolts on the same beat.

### The riso look

Risograph prints use a few flat inks that overlap and never line up perfectly. The film fakes this with Canvas 2D only:

- **Four inks on paper:** a fixed palette `K` (red, blue, yellow, near-black) on an off-white paper colour.
- **Halftone dots:** `dotGrad()` draws a rotated dot grid whose dot size follows a function, which gives printed-looking gradients. `dots()` builds a repeating dot pattern for shading.
- **Misregistration:** text and shapes get an offset shadow in another ink, and the whole frame jitters slightly eight times a second, like print plates that don't sit still.
- **Paper and grain:** paper fibres are multiplied over every frame, with rotating layers of specks and grain on top, plus a soft vignette.
- **Overprint:** highlighter swipes and dot shading use the `multiply` blend mode, so inks darken where they overlap as real ink would.

### The soundtrack

`synth()` writes a 51-second stereo buffer at 44.1 kHz directly into arrays. Every instrument is a small function: the kick is a sine wave with a falling pitch, hats and claps are filtered noise, bass and chord stabs are filtered sawtooth waves, and the bell is FM synthesis. Kicks duck the bass, chords and pads (sidechain), and everything passes through a small hand-written reverb and a soft clipper. The harmony is an A-minor loop (Am–F–C–G) that turns darker (Am–F–Dm–E) in the burning scene. A fixed random seed means the output is identical on every run. In the browser the buffer plays through WebAudio, and the picture follows the audio clock so they stay in sync.

### Export

`render.js` opens `film.html?export=1` in headless Chrome through Puppeteer, waits for the fonts, calls `renderAt(frame / 30)` for each frame, and pipes the canvas as JPEG into ffmpeg. It also asks the page for `synth()`'s output as a WAV file and muxes it in as AAC.

### Make your own

To change the film, edit `film.html`: rearrange or retime scenes in the `SC` table, add a scene function, add its sound cues in `synth()`, and open the file in a browser to preview. Run `npm run render` to export.

## Disclaimer

This is satire and commentary on a public figure. It is not affiliated with or endorsed by Anthropic. The jokes, framing and conclusions are opinion. The quotes and figures come from the public sources below, which are also summarized on the end card and in the note under the player in `film.html`.

### Sources

| Scene (timestamp) | Claim in the film | Source |
|---|---|---|
| Count 02 · jobs (~13 s) | "Within 1–5 years, AI could wipe out half of entry-level white-collar jobs." | Axios, [*Behind the Curtain: A white-collar bloodbath*](https://www.axios.com/2025/05/28/ai-jobs-white-collar-unemployment-anthropic), 28 May 2025 (interview with Dario Amodei) |
| Count 02 · valuation (~16 s) | Anthropic valued at $61.5B (2025.03) → $183B (2025.09) → $380B (2026.02) → $965B (2026.05) | Anthropic: [Series E](https://www.anthropic.com/news/anthropic-raises-series-e-at-usd61-5b-post-money-valuation), [Series F](https://www.anthropic.com/news/anthropic-raises-series-f-at-usd183b-post-money-valuation), [Series G](https://www.anthropic.com/news/anthropic-raises-30-billion-series-g-funding-380-billion-post-money-valuation), [Series H](https://www.anthropic.com/news/series-h); TechCrunch on [Series G](https://techcrunch.com/2026/02/12/anthropic-raises-another-30-billion-in-series-g-with-a-new-value-of-380-billion/) and [Series H](https://techcrunch.com/2026/05/28/anthropic-raises-65-billion-nears-1t-valuation-ahead-of-ipo/) |
| Count 02 · pricing (~18 s) | Claude Max costs $200 / month | [claude.com/pricing](https://claude.com/pricing) (top Max tier) |
| Count 03 · DeepSeek (~20 s) | DeepSeek R1 released 20 January 2025 | [DeepSeek release notes](https://api-docs.deepseek.com/news/news250120) |
| Count 03 · essay (~22 s) | Nine days later: "DeepSeek makes export controls even more existentially important." | Dario Amodei, [*On DeepSeek and Export Controls*](https://darioamodei.com/on-deepseek-and-export-controls), 29 January 2025 |
| Count 03 · terms of service (~27 s) | No sales to entities more than 50% Chinese-owned, even if incorporated abroad; national-security rationale; revenue impact in the hundreds of millions of dollars | Anthropic, [*Updating restrictions of sales to unsupported regions*](https://www.anthropic.com/news/updating-restrictions-of-sales-to-unsupported-regions), September 2025 |
| Count 03 · mission (~31 s) | Mission: "ensure that the world safely makes the transition through transformative AI" | [anthropic.com/company](https://www.anthropic.com/company) |
| Count 03 · mission (~33 s) | Mainland China, Hong Kong and Macau are not supported regions | [anthropic.com/supported-countries](https://www.anthropic.com/supported-countries) |

The 2021 departure from OpenAI in Count 01 and the "Responsible Scaling" driving sequence are commentary rather than quotations. Chinese on-screen quotes are the author's translations. Figures are as of the dates shown in the film and may have changed since.

## License

[MIT](LICENSE) © 2026 Darren Ter
