"""Image-to-video with LTX-Video on the local ComfyUI: the film's last frame
(the container ship in fog) pushed forward for a few seconds, for the sign-in
panel's background loop. Run: python tools/generate_boat_loop.py [seed]"""
import json, os, sys, time, shutil, urllib.request

HOST = os.environ.get("COMFY_HOST", "http://127.0.0.1:8188")
CKPT = "ltx-video-2b-v0.9.5.safetensors"
T5 = "t5xxl_fp8_e4m3fn.safetensors"
IMAGE = "owed-boat-last.png"   # already in ComfyUI/input
OUT = os.path.join(os.path.dirname(__file__), "..", "film", "gen")
COMFY_OUT = os.path.expanduser(os.path.join("~", "ComfyUI_windows_portable", "ComfyUI", "output"))

PROMPT = ("A large container ship seen from above, sailing slowly forward through thick sea fog, "
          "steady straight course, white wake trailing behind, soft blue-grey light, cinematic drone "
          "shot, gentle camera drift, calm sea, high detail, photorealistic, smooth continuous motion")
NEG = ("worst quality, blurry, jittery, warping, deformed ship, extra ships, text, watermark, "
       "flicker, fast motion, camera shake")


def build(seed):
    return {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": T5, "type": "ltxv"}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"text": PROMPT, "clip": ["2", 0]}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["2", 0]}},
        "5": {"class_type": "LoadImage", "inputs": {"image": IMAGE}},
        "6": {"class_type": "LTXVImgToVideo",
              "inputs": {"positive": ["3", 0], "negative": ["4", 0], "vae": ["1", 2], "image": ["5", 0],
                         "width": 1216, "height": 704, "length": 121, "batch_size": 1, "strength": 1.0}},
        "7": {"class_type": "LTXVConditioning",
              "inputs": {"positive": ["6", 0], "negative": ["6", 1], "frame_rate": 25.0}},
        "8": {"class_type": "ModelSamplingLTXV",
              "inputs": {"model": ["1", 0], "max_shift": 2.05, "base_shift": 0.95}},
        "9": {"class_type": "KSampler",
              "inputs": {"model": ["8", 0], "seed": seed, "steps": 42, "cfg": 3.5,
                         "sampler_name": "euler", "scheduler": "simple",
                         "positive": ["7", 0], "negative": ["7", 1],
                         "latent_image": ["6", 2], "denoise": 1.0}},
        "10": {"class_type": "VAEDecode", "inputs": {"samples": ["9", 0], "vae": ["1", 2]}},
        "11": {"class_type": "SaveWEBM",
               "inputs": {"images": ["10", 0], "filename_prefix": "owed_boat", "codec": "vp9",
                          "fps": 25.0, "crf": 20.0}},
    }


def up(timeout=180):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            urllib.request.urlopen(HOST + "/system_stats", timeout=3).read()
            return True
        except Exception:
            time.sleep(3)
    return False


def post(wf):
    req = urllib.request.Request(HOST + "/prompt", data=json.dumps({"prompt": wf}).encode(),
                                 headers={"Content-Type": "application/json"})
    try:
        return json.load(urllib.request.urlopen(req))["prompt_id"]
    except urllib.error.HTTPError as e:
        raise SystemExit("prompt rejected: " + e.read().decode()[:1500])


def wait(pid, timeout=900):
    t0 = time.time()
    while time.time() - t0 < timeout:
        h = json.load(urllib.request.urlopen(HOST + "/history/" + pid))
        if pid in h:
            st = h[pid].get("status", {})
            if st.get("completed"):
                return h[pid]["outputs"]
            if st.get("status_str") == "error":
                raise SystemExit("generation error: " + json.dumps(st)[:1200])
        time.sleep(3)
    raise SystemExit("timeout")


def main():
    seed = int(sys.argv[1]) if len(sys.argv) > 1 else 7
    if not up():
        raise SystemExit("ComfyUI is not answering on " + HOST)
    os.makedirs(OUT, exist_ok=True)
    t0 = time.time()
    outputs = wait(post(build(seed)))
    got = None
    for node in outputs.values():
        for key in ("images", "gifs", "videos"):
            for f in node.get(key, []) or []:
                if str(f.get("filename", "")).endswith(".webm"):
                    got = f["filename"]
    if not got:
        raise SystemExit("no webm in outputs: " + json.dumps(outputs)[:600])
    dst = os.path.join(OUT, "boat-%d.raw.webm" % seed)
    shutil.copyfile(os.path.join(COMFY_OUT, got), dst)
    print("ok", dst, "%.0f KB" % (os.path.getsize(dst) / 1024), "%.0fs" % (time.time() - t0))


if __name__ == "__main__":
    main()
