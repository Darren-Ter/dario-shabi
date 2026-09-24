# dario-shabi · 为什么 Dario 是个大傻逼

A 51-second satirical short film in Chinese, styled as a riso-printed case file against Anthropic's CEO. Every frame and every note of the score is generated in code. There is no footage, no image assets and no audio samples: the film is one HTML file that draws on a `<canvas>` and synthesizes its 128 BPM soundtrack sample by sample.

一部 51 秒的中文讽刺短片，以孔版印刷（riso）风格的「案卷」形式呈现。画面与音乐全部由代码实时生成：一个 HTML 文件，用 Canvas 绘制每一帧，用代码逐采样合成 128 BPM 的配乐。

![Title card](docs/03.38.jpg)

| | |
|---|---|
| ![Mugshot](docs/05.44.jpg) | ![Terms of service](docs/28.97.jpg) |

**▶ Watch:** download `film.mp4` from the [latest release](../../releases/latest), or open `film.html` in a browser.

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

- **`film.html`**: the whole film. Scenes are plain functions `(ctx, u, d, t)` placed on a bar grid (`SC` table). Every cut lands on the beat. `renderAt(t)` draws any moment deterministically, so scrubbing and exporting give the same frames.
- **Look**: four riso inks on paper, with halftone dot gradients, misregistered shadows, rubber stamps and grain, all done with Canvas 2D.
- **Sound**: `synth()` builds a stereo PCM buffer in JS (kick, snare, bass, stabs and hits timed to scene cuts). The browser plays it through WebAudio, and the renderer exports it as WAV.
- **`render.js`**: loads `film.html?export=1` in headless Chrome through Puppeteer, steps through the film frame by frame, and pipes JPEG frames plus the synthesized WAV into ffmpeg (H.264 + AAC).

## Disclaimer

This is satire and commentary on a public figure. The quotes and facts it cites come from public sources listed on the end card and in `film.html`: Dario Amodei's May 2025 Axios interview, his January 2025 essay *On DeepSeek and Export Controls*, Anthropic's mission statement, its September 2025 terms-of-service update, its supported-countries page, Claude Max pricing, and valuation figures as reported by TechCrunch and others. The film is not affiliated with or endorsed by Anthropic.

## License

[MIT](LICENSE) © 2026 Darren Ter
