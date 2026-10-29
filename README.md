# ResumeAI

ResumeAI is a responsive resume analyzer for students and early-career candidates. It turns pasted resume content or a PDF/DOCX upload into six evidence-focused insights: summary, skills, suggested roles, missing skills, learning suggestions, and resume improvement suggestions.

## Features

- React + TypeScript frontend built with Vite, accessible responsive layouts, Recharts, and Lucide icons.
- FastAPI backend with validated Pydantic request/response models.
- PDF and DOCX text extraction with upload size, extension, PDF signature, and text-length limits.
- Deterministic demo analysis when no AI API key is configured; the UI labels this mode clearly.
- Optional OpenAI-compatible chat-completions provider configured only on the backend.
- No history or resume persistence. Uploaded file content is processed in memory.
- Sample role requirements and vetted documentation resources are bundled as editable datasets.

## Architecture

`src/` contains the single-page React experience, typed API client, and styles. `backend/app/api/routes.py` owns REST routes; `models/schemas.py` defines strict Pydantic contracts; `services/` contains parsing, deterministic demo analysis, and optional AI integration. Static role/resource datasets live under `backend/app/data/`.

## Prerequisites

- Node.js 20+ and npm
- Python 3.10+

## Setup

From the project root:

```powershell
npm.cmd install
python -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
Copy-Item .env.example .env
```

Set the environment file values as needed. The frontend only reads `VITE_API_URL`; never place AI credentials in frontend variables. Backend settings are loaded from `.env` in the working directory.

## Run independently

Start the API from the `backend` directory after activating the virtual environment:

```powershell
Set-Location backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

In another terminal, from the project root:

```powershell
npm.cmd run dev
```

Open <http://localhost:5173>. Configure `FRONTEND_ORIGIN` to the exact frontend origin if using a different port or host.

## AI provider and demo mode

With the default empty `AI_API_KEY`, `/api/analyze` uses deterministic text matching against the bundled sample roles and displays a Demo mode banner. Demo output is illustrative and not represented as genuine AI analysis.

To enable AI, configure `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`, and `AI_PROVIDER` in the backend environment. The provider endpoint is OpenAI-compatible (`/chat/completions`). Resume text will be sent to that external provider; the app discloses this to the user. Provider response JSON is validated against the same strict Pydantic response model. For enterprise or privacy-sensitive use, confirm provider data handling and retention policies before enabling it.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health and demo-mode status |
| POST | `/api/analyze` | Analyze `resume_text`, optional `career_goal`, and `experience_level` |
| POST | `/api/resumes/upload` | Extract text from multipart PDF or DOCX `file` |
| GET | `/api/roles` | Bundled sample role requirements |
| GET | `/api/resources` | Configured learning resources |

Interactive API documentation is available at <http://localhost:8000/docs>.

## Tests and build

Backend tests (run from `backend/`):

```powershell
Set-Location backend
.\.venv\Scripts\python.exe -m pytest
```

Frontend type-check and production build (run from root):

```powershell
npm.cmd run build
npm.cmd test
```

## Privacy and limitations

- The application has no accounts, database, analysis history, or saved uploads.
- Uploaded files are processed in memory and are not written to disk by the API.
- PDF scans with no extractable text are not OCR processed; the API explains this.
- Role recommendations are suggested roles, not live vacancies or job listings. Match scores are rough estimates, not hiring predictions.
- Demo requirements and skill matching are intentionally simple and should be checked against real job descriptions.
- AI output can be inaccurate; verify every suggestion and never add unsubstantiated metrics or claims to a resume.
- This starter does not include authentication or multi-user persistence.
