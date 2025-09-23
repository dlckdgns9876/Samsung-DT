# tools/make_sample_profile.py
from pathlib import Path
from TTS.api import TTS

OUT = Path("profiles") / "demo" / "user_clean.wav"
OUT.parent.mkdir(parents=True, exist_ok=True)

def make_with(model_name: str, text: str, language: str | None):
    print(f"-> loading: {model_name}")
    tts = TTS(model_name)
    # TTS 0.22.x에서는 tts_to_file 사용
    kwargs = {"text": text, "file_path": str(OUT)}
    if language is not None:
        kwargs["language"] = language
    tts.tts_to_file(**kwargs)
    print("saved:", OUT)

try:
    # (있으면) 한국어 단일화자 모델
    make_with("tts_models/ko/kss/tacotron2-DDC",
              "안녕하세요. 샘플 목소리입니다. 테스트 파일입니다.", language="ko")
except Exception as e:
    print("Korean model failed:", repr(e))
    print("Fallback -> English LJSpeech")
    # 폴백: 영어 LJSpeech (언어 인자 없이)
    make_with("tts_models/en/ljspeech/tacotron2-DDC",
              "Hello. This is a sample voice to debug the pipeline.", language=None)
