# Renders for the cinematic chapters (RTX 4090, ComfyUI + LTX-Video)

The landing page's three chapters ship on real Pexels footage (see `DESIGN-REFERENCES.md`, "Cinematic chapters"). This is the optional render list if you want clips that match the film's grade exactly. Every prompt keeps people and hands out of frame and lets a camera-only move plus dust, steam, paper grain or light carry the motion, because rigid objects and hands are where this model fails. If a take morphs, grows text, or adds a hand, reject it: next seed, then the alternate prompt, then keep the stock clip.

Output names the page expects: `assets/video/problem.mp4`, `assets/video/statement.mp4`, `assets/video/closing.mp4` (each with a `.jpg` poster of frame 1). To switch a chapter to a render, change its `<video data-src>` and `poster` in `index.html`.

## Common settings

- Workflow: ComfyUI → Browse Templates → Video → "LTXV Text to Video" (or drag `python_embeded\Lib\site-packages\comfyui_workflow_templates_json\templates\ltxv_text_to_video.json` onto the canvas).
- Load Checkpoint `ltx-video-2b-v0.9.5.safetensors`; Load CLIP `t5xxl_fp8_e4m3fn.safetensors`, type ltxv.
- EmptyLTXVLatentVideo 1280 × 736 (the widget snaps to multiples of 32; crop to 720 in ffmpeg), batch 1, length 145 frames (6 s) or 121 (5 s).
- LTXVConditioning frame_rate 24. LTXVScheduler steps 42, max_shift 2.05, base_shift 0.95, stretch on, terminal 0.1 (30 steps under-cooks into a flat gradient). KSamplerSelect euler. SamplerCustom cfg 3.5, add_noise on, `control_after_generate` fixed.
- Prototype at 832 × 480 × 97 frames (~24 s a take) until the prompt and seed hold, then render full size. Out of memory: 1152 × 640 first, then 121 frames.
- Check before keeping: a working clip is well over 1 MB (a few hundred KB means a static gradient). Tile three frames and look: `ffmpeg -y -i in.mp4 -vf "select='eq(n\,4)+eq(n\,60)+eq(n\,116)',tile=3x1" -frames:v 1 check.png`.
- Encode for the web (from the `owed` folder, real Gyan ffmpeg on PATH):
  `ffmpeg -y -i "<take>.mp4" -vf "crop=1280:720:0:8" -r 24 -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -g 48 -movflags +faststart -an assets\video\<key>.mp4`
  `ffmpeg -y -i assets\video\<key>.mp4 -frames:v 1 -q:v 3 assets\video\<key>.jpg`
  Add `,eq=saturation=0.85` after the crop if a clip looks too saturated next to the film.

## problem — "Most people replace it." (6 s, seed 20261, then 20262, 20263)

**Prompt.** A dead electric kettle sits unplugged on a kitchen counter beside a window, its cord coiled loosely next to it and its lid slightly open. Grey overcast morning light comes through a thin curtain and lands softly across the counter; the rest of the room is dim and still. Tiny dust motes drift slowly through the beam of window light. The kettle is plain brushed steel, unbranded, a little scuffed, and nothing on it glows. Muted, desaturated palette of cool grey, off-white and pale steel, very low contrast, quiet domestic realism. The camera pushes in extremely slowly toward the kettle on a locked, steady dolly, shallow depth of field, soft vintage lens. No people, no hands. The scene appears to be real-life footage.

**Alternate.** An open cardboard box sits on the floor of a hallway next to a front door, and inside it a pair of plain over-ear headphones with a frayed cable lies on top of an old power adapter. Soft grey daylight from a window falls from the left and the rest of the hallway sits in gentle shadow. A thin curtain beside the door moves very slightly in a draft. Everything is muted and desaturated: cardboard brown, grey wall, matte black plastic, no bright colours. The camera drifts slowly sideways past the box at knee height, steady and smooth, shallow depth of field. No people, no hands. The scene appears to be real-life footage.

**Negative.** steam, glowing lights, bright sunshine, clean showroom, product advertisement, text, letters, words, numbers, subtitles, watermark, logo, brand name, faces, people, person, hands, fingers, extra fingers, fused fingers, bad anatomy, CGI, 3D render, video game, cartoon, illustration, painting, oversaturated, neon, vivid colours, harsh contrast, HDR, lens flare, fast motion, camera shake, jitter, flicker, morphing, warping, melting, duplicated objects, motion smear, motion artifacts, low quality, worst quality, blurry, noisy, deformed, distorted

Reject any take where the kettle changes shape, gains a second spout or handle, or steam appears.

## statement — "Nobody reads it. Owed reads all of it." (5 s, seed 20271, then 20272, 20273)

**Prompt.** Extreme close-up of a page of dense fine print in a paper warranty booklet, seen at a steep angle so the columns of tiny type stretch away into soft focus. The lettering is far too small and blurred to read; it registers as rows of grey texture on thin cream paper with a faint fibre grain. A single warm desk lamp lights the page from the left and falls off quickly into deep black shadow; the rest of the frame is dark. The camera slides very slowly across the page, tracking along the lines of type, with a shallow macro depth of field so only a narrow band is sharp. Paper grain, warm-on-black palette, nothing else in frame. No hands, no people. The scene appears to be real-life footage shot on a macro lens.

**Alternate.** A thin stack of paper booklets and folded leaflets of terms and conditions lies on a dark wooden desk in an otherwise unlit room. A narrow bar of white scanner light glides slowly along the top page from bottom to top, lighting the dense tiny type as it passes and leaving it dim behind. The type is too small to read and looks like fine grey texture. One warm lamp glows softly, out of focus, in the far background. Deep blacks, cream paper, muted amber, rich shadow detail. The camera is locked off, looking down at a slight angle, with a very slight slow push-in. No hands, no people. The scene appears to be real-life footage.

**Negative.** legible text, readable letters, large headline, bold type, coloured pages, bright room, daylight, computer screen, blue light, numbers, subtitles, watermark, logo, brand name, faces, people, person, hands, fingers, extra fingers, fused fingers, bad anatomy, CGI, 3D render, video game, cartoon, illustration, painting, oversaturated, neon, vivid colours, harsh contrast, HDR, lens flare, fast motion, camera shake, jitter, flicker, morphing, warping, melting, duplicated objects, motion smear, motion artifacts, low quality, worst quality, noisy, deformed, distorted

Reject any take where words become readable or the columns bend.

## closing — "Before you buy a new one, check who owes you the old one." (6 s, seed 20291, then 20292, 20293)

**Prompt.** The same plain brushed-steel electric kettle, now working, sits on a kitchen counter beside a window in early morning light and sends a steady, gentle plume of steam upward. Low golden sunlight comes through the window from behind and to the side, backlighting the steam so it glows softly while the kettle itself stays in quiet half-light. The counter is tidy: a wooden board, a folded cloth, a single mug. Muted, hopeful palette of honey light, cool shadow and pale steel, low contrast, no bright colours. The camera pulls back extremely slowly from the kettle, steady, shallow depth of field, so the whole calm kitchen settles into frame. No hands, no faces, no people. The scene appears to be real-life footage.

**Alternate.** A small workshop bench in the warm light of dusk, with a few plain hand tools laid neatly on a leather mat, a small screwdriver set, and a repaired pair of over-ear headphones resting on a folded cloth at the centre. A desk lamp on the left gives a warm pool of light and the window behind glows deep blue and orange. Fine dust hangs in the air and drifts slowly through the lamplight. Everything is still and cared for. Muted palette of oiled wood, brass, matte black and dusk blue. The camera glides slowly sideways along the bench, steady and level, shallow depth of field. No hands, no people, no writing or logos on anything. The scene appears to be real-life footage.

**Negative.** broken, dirty, rust, cluttered, night, cold blue light, fire, smoke, harsh shadows, text, letters, words, numbers, subtitles, watermark, logo, brand name, faces, people, person, hands, fingers, extra fingers, fused fingers, bad anatomy, CGI, 3D render, video game, cartoon, illustration, painting, oversaturated, neon, vivid colours, harsh contrast, HDR, lens flare, fast motion, camera shake, jitter, flicker, morphing, warping, melting, duplicated objects, motion smear, motion artifacts, low quality, worst quality, blurry, noisy, deformed, distorted

Reject any take where the steam turns into smoke or the kettle changes shape between first and last frame. The dead kettle in the problem chapter and this steaming one close the loop.
