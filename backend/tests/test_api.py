import asyncio
from io import BytesIO

from docx import Document
from fastapi.testclient import TestClient
import httpx
import pytest

from app.core.config import Settings
from app.main import app
from app.models.schemas import AnalysisRequest, ResumeAnalysis
from app.services.ai_service import AIAnalysisError, analyze_resume
from app.services.demo_analyzer import analyze_demo
from app.services.resume_parser import ResumeParseError, extract_resume_text

client = TestClient(app)
SYNTHETIC_RESUME = """Alex Example
Education: Bachelor of Computer Science, Sample University
Projects: Built a React and JavaScript portfolio website using Git.
Skills: HTML, CSS, communication, problem solving.
"""


def test_analysis_schema_and_demo_mode():
    response = analyze_demo(AnalysisRequest(resume_text=SYNTHETIC_RESUME, career_goal="Frontend Developer"))
    assert response.demo_mode is True
    assert response.skills_analysis.frameworks[0].name == "React"
    assert ResumeAnalysis.model_validate(response.model_dump())


def test_demo_summary_separates_inline_sections():
    inline_resume = "Synthetic resume. Education: BSc Computer Science. Projects: Built a React portfolio using JavaScript and Git. Skills include communication."
    response = analyze_demo(AnalysisRequest(resume_text=inline_resume))
    assert response.resume_summary.education == ["BSc Computer Science."]
    assert response.resume_summary.projects == ["Built a React portfolio using JavaScript and Git."]


def test_api_health_and_analysis():
    assert client.get("/api/health").status_code == 200
    result = client.post("/api/analyze", json={"resume_text": SYNTHETIC_RESUME})
    assert result.status_code == 200
    assert result.json()["demo_mode"] is True


def test_empty_resume_is_rejected():
    response = client.post("/api/analyze", json={"resume_text": "too short"})
    assert response.status_code == 422


def test_pdf_and_docx_parser_errors():
    try:
        extract_resume_text("resume.txt", b"no", 1000)
        assert False
    except ResumeParseError as exc:
        assert "Unsupported" in str(exc)
    document = Document()
    document.add_paragraph("Synthetic resume content")
    output = BytesIO()
    document.save(output)
    assert "Synthetic resume" in extract_resume_text("resume.docx", output.getvalue(), 1000)


def test_upload_rejects_unsupported_file():
    response = client.post("/api/resumes/upload", files={"file": ("resume.txt", b"plain text", "text/plain")})
    assert response.status_code == 415


def test_roles_api_returns_role_requirements():
    result = client.get("/api/roles")
    assert result.status_code == 200
    assert any(role["title"] == "Junior Frontend Developer" for role in result.json())


def test_ai_provider_failure_is_reported(monkeypatch):
    class BrokenClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def post(self, *_args, **_kwargs):
            raise httpx.ConnectError("provider unavailable")

    monkeypatch.setattr("app.services.ai_service.httpx.AsyncClient", lambda **_kwargs: BrokenClient())
    with pytest.raises(AIAnalysisError, match="provider returned an error"):
        asyncio.run(analyze_resume(
            AnalysisRequest(resume_text=SYNTHETIC_RESUME),
            Settings(ai_api_key="test-key"),
        ))
