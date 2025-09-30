# ai-voice-web/server/main.py

import uuid
import subprocess
import os
import re
from shutil import which
from pathlib import Path
from typing import Optional, List

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from TTS.api import TTS  # Coqui TTS

# ── 경로 ──────────────────────────────────────────────────────────────────────
BASE = Path(__file__).resolve().parent.parent  # ai-voice-web/
WEB_BUILD = BASE / "web-react" / "dist"  # React 빌드 결과물 경로
DATA = BASE / "generated"
PROFILES = BASE / "profiles" 
for p in (WEB_BUILD, DATA, PROFILES):
    p.mkdir(parents=True, exist_ok=True)

# ── ffmpeg 경로 탐색(여러 후보를 순회) ───────────────────────────────────────
def find_ffmpeg():
    cands = [
        which("ffmpeg"),  # PATH 에 있으면 우선 사용
        str(Path(os.getenv("LOCALAPPDATA", "")) / "Microsoft/WindowsApps/ffmpeg.exe"),  # winget 별칭
        str(Path(os.getenv("USERPROFILE", "")) / "scoop/shims/ffmpeg.exe"),             # scoop
        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",                                      # 수동 설치 흔한 경로
        r"C:\ffmpeg\bin\ffmpeg.exe",
        str(BASE / "bin" / ("ffmpeg.exe" if os.name == "nt" else "ffmpeg")),            # 프로젝트 로컬
    ]
    for p in cands:
        if p and Path(p).exists():
            return p
    return None

FFMPEG = find_ffmpeg()

# ── FastAPI 앱 ────────────────────────────────────────────────────────────────
app = FastAPI(title="AI Voice TTS Service", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 외의 정적 파일 서빙 설정
app.mount("/generated", StaticFiles(directory=str(DATA), html=False), name="generated")
app.mount("/profiles", StaticFiles(directory=str(PROFILES), html=False), name="profiles")

# React 앱의 assets(js, css 등) 서빙
app.mount("/assets", StaticFiles(directory=WEB_BUILD / "assets"), name="assets")

# ── 헬스 체크 ────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"ok": True}

# ── 요청 스키마 ──────────────────────────────────────────────────────────────
class SynthesizeRequest(BaseModel):
    text: str
    engine: str = "xtts"    # 기본: xtts (kss는 현재 빌드에서 비활성)
    language: str = "ko"
    userId: Optional[str] = None

# ── 모델 캐시 & 로더 ─────────────────────────────────────────────────────────
_models = {}

def get_model(name: str):
    if name in _models:
        return _models[name]
    if name == "xtts":
        m = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
    elif name == "kss":
        # 현재 설치된 TTS(0.22.x) 기준 ko/kss 레지스트리 이슈가 있어 막아둔다.
        raise RuntimeError("현재 빌드에서는 'kss' 모델을 지원하지 않습니다. xtts를 사용하세요.")
    else:
        raise ValueError("unknown engine")
    _models[name] = m
    return m

# ── 한국어 문장 분할 ─────────────────────────────────────────────────────────
def split_sentences_ko(text: str) -> List[str]:
    """
    한국어 문장 분할: 마침표/물음표/느낌표/말줄임표/따옴표 뒤 공백 기준으로 단순 분할.
    라이브러리 없이 안전한 규칙만 사용.
    """
    text = (text or "").strip()
    if not text:
        return []
    parts = re.split(r'(?<=[\.\?\!…\”\"\'])\s+', text)
    return [p.strip() for p in parts if p.strip()]

# ── 보이스 프로필 업로드 (m4a/mp3 등 → WAV 자동 변환) ─────────────────────────
@app.post("/voice-profiles/upload")
async def upload_profile(userId: str = Form(...), file: UploadFile = File(...)):
    if not userId.strip():
        raise HTTPException(400, "userId required")

    user_dir = PROFILES / userId
    user_dir.mkdir(parents=True, exist_ok=True)

    # 업로드 파일 임시 저장
    ext = Path(file.filename or "").suffix.lower() or ".bin"
    tmp_in = user_dir / f"raw_{uuid.uuid4().hex}{ext}"
    out_wav = user_dir / "user_clean.wav"

    try:
        data = await file.read()
        with open(tmp_in, "wb") as f:
            f.write(data)
    except Exception as e:
        raise HTTPException(400, f"failed to save upload: {e}")

    # ffmpeg 확인
    if not FFMPEG:
        raise HTTPException(
            500,
            "ffmpeg not found. scoop install ffmpeg 하거나 ai-voice-web/bin/ffmpeg.exe 를 두세요."
        )

    # ffmpeg로 WAV(모노/24kHz/PCM16) 변환
    cmd = [FFMPEG, "-y", "-i", str(tmp_in), "-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le", str(out_wav)]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except FileNotFoundError:
        raise HTTPException(500, "ffmpeg not found at resolved path.")
    except subprocess.CalledProcessError as e:
        # ffmpeg 오류 메시지 일부 노출
        raise HTTPException(400, f"ffmpeg convert failed: {e.stderr.decode(errors='ignore')[:400]}")
    finally:
        try:
            tmp_in.unlink(missing_ok=True)
        except Exception:
            pass

    return {"ok": True, "path": f"/profiles/{userId}/user_clean.wav"}

# ── TTS 합성 (문장 청크 처리 + ffmpeg 병합) ───────────────────────────────────
@app.post("/tts/synthesize")
def synthesize(req: SynthesizeRequest):
    text = (req.text or "").strip()
    if not text:
        raise HTTPException(400, "text is empty")

    tts = get_model(req.engine)

    if req.engine != "xtts":
        raise HTTPException(400, "kss engine is disabled in this build. Use xtts.")

    if not req.userId or not req.userId.strip():
        raise HTTPException(400, "xtts requires userId")

    spk = PROFILES / req.userId / "user_clean.wav"
    if not spk.exists():
        raise HTTPException(400, f"speaker_wav not found for userId={req.userId}")

    # 문장을 청크로 나눠 처리
    sentences = split_sentences_ko(text)
    if not sentences:
        raise HTTPException(400, "no valid sentences")

    CHUNK_SIZE = 5  # 문장 5개씩 묶어서 합성 (느리면 3으로 낮춰도 됨)
    chunks = [" ".join(sentences[i:i + CHUNK_SIZE]) for i in range(0, len(sentences), CHUNK_SIZE)]

    part_paths: List[Path] = []
    concat_list_path: Optional[Path] = None
    out = DATA / f"{uuid.uuid4().hex}.wav"

    try:
        # 각 청크를 개별 wav로 합성
        for idx, chunk_text in enumerate(chunks):
            part = DATA / f"{uuid.uuid4().hex}_part{idx}.wav"
            tts.tts_to_file(
                text=chunk_text,
                speaker_wav=str(spk),
                language=req.language,
                file_path=str(part),
            )
            part_paths.append(part)

        # 병합
        if len(part_paths) == 1:
            # 한 청크만이면 그대로 결과로 사용
            out.write_bytes(part_paths[0].read_bytes())
        else:
            if not FFMPEG:
                raise HTTPException(500, "ffmpeg is required to merge audio chunks.")
            # ffmpeg concat demuxer 사용 (경로 안전하게 -safe 0)
            concat_list_path = DATA / f"{uuid.uuid4().hex}_concat.txt"
            with open(concat_list_path, "w", encoding="utf-8") as f:
                for p in part_paths:
                    f.write(f"file '{p.as_posix()}'\n")

            cmd = [
                FFMPEG, "-y",
                "-f", "concat", "-safe", "0",
                "-i", str(concat_list_path),
                "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le",
                str(out),
            ]
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        return {"audioUrl": f"/generated/{out.name}"}

    except subprocess.CalledProcessError as e:
        # 전체 stderr를 로깅하고, 클라이언트에게는 간결한 메시지 또는 일부만 전달
        # logger.error(f"ffmpeg failed: {e.stderr.decode(errors='ignore')}")
        raise HTTPException(500, f"ffmpeg failed while merging: {e.stderr.decode(errors='ignore')[:500]}")
    finally:
        # 임시 청크 파일 정리
        for p in part_paths:
            try:
                p.unlink(missing_ok=True)
            except Exception:
                pass
        # 임시 병합 목록 파일 정리
        if concat_list_path:
            concat_list_path.unlink(missing_ok=True)

# ── React 앱 서빙 (Catch-all) ─────────────────────────────────────────────────
# API 경로가 아닌 모든 GET 요청을 React의 index.html로 전달하여 클라이언트 사이드 라우팅 지원
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    index_path = WEB_BUILD / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="React app not built. Run `npm run build` in `web-react` directory.")
    return FileResponse(index_path)
