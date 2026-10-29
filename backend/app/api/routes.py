import json
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import get_settings
from app.models.schemas import AnalysisRequest, ResumeAnalysis, UploadResponse
from app.services.ai_service import AIAnalysisError, analyze_resume
from app.services.demo_analyzer import DATA_DIR
from app.services.resume_parser import ResumeParseError, extract_resume_text

router = APIRouter(prefix="/api")


@router.get("/health")
async def health() -> dict[str, str | bool]:
    settings = get_settings()
    return {"status": "ok", "demo_mode": not settings.ai_enabled}


@router.post("/analyze", response_model=ResumeAnalysis)
async def analyze(request: AnalysisRequest) -> ResumeAnalysis:
    settings = get_settings()
    if len(request.resume_text) > settings.max_resume_chars:
        raise HTTPException(status_code=413, detail=f"Resume text must be at most {settings.max_resume_chars} characters.")
    try:
        return await analyze_resume(request, settings)
    except AIAnalysisError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/resumes/upload", response_model=UploadResponse)
async def upload_resume(file: UploadFile = File(...)) -> UploadResponse:
    settings = get_settings()
    filename = Path(file.filename or "").name
    extension = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if extension not in {"pdf", "docx"}:
        raise HTTPException(status_code=415, detail="Unsupported file type. Upload a PDF or DOCX file.")
    max_bytes = settings.max_upload_mb * 1024 * 1024
    content = await file.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File is too large. Maximum upload size is {settings.max_upload_mb} MB.")
    if extension == "pdf" and not content.startswith(b"%PDF"):
        raise HTTPException(status_code=415, detail="The uploaded file does not appear to be a valid PDF.")
    try:
        text = extract_resume_text(filename, content, settings.max_resume_chars)
    except ResumeParseError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return UploadResponse(filename=filename, extracted_text=text, characters=len(text))


@router.get("/roles")
async def roles() -> list[dict]:
    return json.loads((DATA_DIR / "sample_roles.json").read_text(encoding="utf-8"))


@router.get("/resources")
async def resources() -> dict:
    return json.loads((DATA_DIR / "learning_resources.json").read_text(encoding="utf-8"))
