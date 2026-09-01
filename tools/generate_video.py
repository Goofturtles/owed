"""
Generate Owed's ambient background clips locally, on your own GPU.

No API, no cloud, no per-second billing: this drives a local ComfyUI running
LTX-Video, so the clips cost nothing but electricity and anyone with the repo
can regenerate them from scratch.

    1. start ComfyUI            (default http://127.0.0.1:8188)
    2. python tools/generate_video.py             # every clip
       python tools/generate_video.py ink-water   # just one

Subject matter is deliberately abstract — ink, water, light, particles. Generated
video of objects, hands or faces reads as fake almost immediately; fluid and
particle motion is what these models are genuinely good at, and it happens to be
exactly what Owed is about (ink, and fine print on paper).

Rendered on an RTX 4090 in roughly 25–35s per 4-second 960x544 clip. The output
is then re-encoded for the web — see the note at the bottom of this file.
"""
import json
import os
import shutil
import sys
import time
import urllib.request

HOST = os.environ.get("COMFY_HOST", "http://127.0.0.1:8188")
CKPT = "ltx-video-2b-v0.9.5.safetensors"
T5 = "t5xxl_fp8_e4m3fn.safetensors"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "assets", "video")

NEG = ("blurry, low quality, jittery, flickering, distorted, warped, text, letters, words, "
       "watermark, logo, people, hands, faces, objects, furniture, cartoon, oversaturated, "
       "harsh contrast, fast motion, camera shake")

CLIPS = [
    dict(
        name="ink-water",
        w=960, h=544, frames=97, seed=51204,
        prompt=("Black ink dropped into clear water, billowing and unfurling in slow motion "
                "into soft feathered clouds and long trailing filaments that curl and twist "
                "as they sink. Backlit against a bright pale background so the ink reads as "
                "deep black silhouette. Continuous flowing movement throughout, macro lens, "
                "shallow depth of field, high detail, cinematic slow motion.")),
    dict(
        name="ember-drift",
        w=960, h=544, frames=97, seed=68430,
        prompt=("Hundreds of tiny bright glowing particles floating and swirling slowly "
                "through the air in a pitch black room, each particle a sharp point of warm "
                "light, drifting upward and sideways in gentle turbulent currents, some in "
                "focus and some blurred into soft bokeh circles. Deep black background, "
                "strong contrast, particles clearly visible, continuous motion, "
                "cinematic macro, shallow depth of field.")),
]


def build(c):
    """The LTX-Video graph, in ComfyUI's /prompt API format."""
    return {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": T5, "type": "ltxv"}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"text": c["prompt"], "clip": ["2", 0]}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["2", 0]}},
        "5": {"class_type": "EmptyLTXVLatentVideo",
              "inputs": {"width": c["w"], "height": c["h"], "length": c["frames"], "batch_size": 1}},
        "6": {"class_type": "LTXVConditioning",
              "inputs": {"positive": ["3", 0], "negative": ["4", 0], "frame_rate": 25.0}},
        "7": {"class_type": "ModelSamplingLTXV",
              "inputs": {"model": ["1", 0], "max_shift": 2.05, "base_shift": 0.95}},
        # 42 steps: at 30 the model under-cooks and returns flat gradients
        # instead of the motion the prompt asks for.
        "8": {"class_type": "KSampler",
              "inputs": {"model": ["7", 0], "seed": c["seed"], "steps": 42, "cfg": 3.5,
                         "sampler_name": "euler", "scheduler": "simple",
                         "positive": ["6", 0], "negative": ["6", 1],
                         "latent_image": ["5", 0], "denoise": 1.0}},
        "9": {"class_type": "VAEDecode", "inputs": {"samples": ["8", 0], "vae": ["1", 2]}},
        "10": {"class_type": "SaveWEBM",
               "inputs": {"images": ["9", 0], "filename_prefix": "owed_" + c["name"],
                          "codec": "vp9", "fps": 25.0, "crf": 34.0}},
    }


def post(wf):
    req = urllib.request.Request(HOST + "/prompt",
                                 data=json.dumps({"prompt": wf}).encode(),
                                 headers={"Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req))["prompt_id"]


def wait(pid, timeout=900):
    t0 = time.time()
    while time.time() - t0 < timeout:
        h = json.load(urllib.request.urlopen(HOST + "/history/" + pid))
        if pid in h:
            st = h[pid].get("status", {})
            if st.get("completed"):
                return h[pid]["outputs"]
            if st.get("status_str") == "error":
                raise RuntimeError(json.dumps(st)[:600])
        time.sleep(3)
    raise TimeoutError(pid)


def main():
    os.makedirs(OUT, exist_ok=True)
    comfy_out = os.environ.get(
        "COMFY_OUTPUT",
        os.path.expanduser(os.path.join("~", "ComfyUI_windows_portable", "ComfyUI", "output")))
    only = sys.argv[1:] or None
    for c in CLIPS:
        if only and c["name"] not in only:
            continue
        t0 = time.time()
        print("[gen] %-12s %dx%d %df ..." % (c["name"], c["w"], c["h"], c["frames"]), flush=True)
        outputs = wait(post(build(c)))
        got = None
        for node in outputs.values():
            for key in ("images", "gifs", "videos"):
                for f in node.get(key, []) or []:
                    if str(f.get("filename", "")).endswith(".webm"):
                        got = f["filename"]
        if not got:
            print("   !! no webm in outputs:", json.dumps(outputs)[:400])
            continue
        dst = os.path.join(OUT, c["name"] + ".raw.webm")
        shutil.copyfile(os.path.join(comfy_out, got), dst)
        print("   -> %s  %.1f KB  %.0fs" % (dst, os.path.getsize(dst) / 1024, time.time() - t0),
              flush=True)

    print("\nNow re-encode for the web:")
    print("  # ink-water is scroll-scrubbed, so it needs dense keyframes to seek smoothly")
    print("  ffmpeg -i ink-water.raw.webm  -c:v libvpx-vp9 -crf 44 -b:v 0 -g 8  "
          "-vf scale=800:-2 -an ink-water.webm")
    print("  # ember-drift just loops in the background")
    print("  ffmpeg -i ember-drift.raw.webm -c:v libvpx-vp9 -crf 46 -b:v 0 -g 60 "
          "-vf scale=860:-2 -an ember-drift.webm")
    print("  # posters, so nothing pops in")
    print("  ffmpeg -i <clip>.webm -vf select=eq(n\\,0) -frames:v 1 -q:v 6 <clip>.jpg")


if __name__ == "__main__":
    main()
