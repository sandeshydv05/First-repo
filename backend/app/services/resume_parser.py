from io import BytesIO

import fitz
from docx import Document


class ResumeParseError(ValueError):
    pass


def extract_resume_text(filename: str, content: bytes, max_chars: int) -> str:
    suffix = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    try:
        if suffix == "pdf":
            with fitz.open(stream=content, filetype="pdf") as document:
                text = "\n".join(page.get_text() for page in document)
        elif suffix == "docx":
            document = Document(BytesIO(content))
            text = "\n".join(paragraph.text for paragraph in document.paragraphs)
        else:
            raise ResumeParseError("Unsupported file type. Upload a PDF or DOCX file.")
    except ResumeParseError:
        raise
    except Exception as exc:
        raise ResumeParseError("We couldn't read this file. Check that it is a valid PDF or DOCX.") from exc

    text = text.strip()
    if not text:
        raise ResumeParseError("No readable text was found. Scanned PDFs require OCR, which is not configured.")
    if len(text) > max_chars:
        text = text[:max_chars]
    return text
