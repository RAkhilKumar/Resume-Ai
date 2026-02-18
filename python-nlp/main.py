"""
ResumeAI NLP Server - Fixed Version
Handles PDF/DOCX/TXT file uploads properly
"""
import io
from typing import Optional
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from nlp_engine import ResumeAnalyzer

app = FastAPI(title="ResumeAI NLP API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = ResumeAnalyzer()


class AnalyzeTextRequest(BaseModel):
    resume_text: str
    job_description: str
    job_title: str


@app.get("/")
def root():
    return {"status": "online", "version": "3.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/analyze")
def analyze_text(req: AnalyzeTextRequest):
    """Analyze from plain text"""
    if not req.resume_text.strip():
        raise HTTPException(status_code=400, detail="resume_text is empty")
    if not req.job_description.strip():
        raise HTTPException(status_code=400, detail="job_description is empty")
    return analyzer.analyze(req.resume_text, req.job_description, req.job_title)


@app.post("/analyze-file")
async def analyze_file(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    job_title: str = Form(...),
):
    """Analyze from uploaded file — Python extracts text from PDF/DOCX/TXT"""
    raw = await file.read()
    fname = (file.filename or "").lower()

    print(f"[NLP] File received: {file.filename} ({len(raw)} bytes)")
    print(f"[NLP] Content-Type: {file.content_type}")
    print(f"[NLP] JD length: {len(job_description)}")

    # Extract text
    resume_text = ""

    if fname.endswith(".pdf") or file.content_type == "application/pdf":
        resume_text = _extract_pdf(raw)
    elif fname.endswith(".docx") or "wordprocessingml" in (file.content_type or ""):
        resume_text = _extract_docx(raw)
    elif fname.endswith(".doc"):
        resume_text = _extract_pdf(raw)  # try pdf fallback
    else:
        # TXT or unknown — decode as text
        resume_text = raw.decode("utf-8", errors="ignore")

    resume_text = resume_text.strip()
    print(f"[NLP] Extracted text length: {len(resume_text)} chars")
    print(f"[NLP] First 200 chars: {resume_text[:200]}")

    if len(resume_text) < 30:
        raise HTTPException(
            status_code=422,
            detail=f"Could not extract readable text from '{file.filename}'. Got only {len(resume_text)} chars."
        )

    return analyzer.analyze(resume_text, job_description, job_title)


def _extract_pdf(data: bytes) -> str:
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=data, filetype="pdf")
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
        print(f"[PDF] Extracted {len(text)} chars via PyMuPDF")
        return text
    except ImportError:
        print("[PDF] PyMuPDF not available, trying pypdf")
    except Exception as e:
        print(f"[PDF] PyMuPDF error: {e}")

    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(data))
        text = "\n".join(p.extract_text() or "" for p in reader.pages)
        print(f"[PDF] Extracted {len(text)} chars via pypdf")
        return text
    except Exception as e:
        print(f"[PDF] pypdf error: {e}")
        return ""


def _extract_docx(data: bytes) -> str:
    try:
        from docx import Document
        doc = Document(io.BytesIO(data))
        text = "\n".join(p.text for p in doc.paragraphs)
        print(f"[DOCX] Extracted {len(text)} chars")
        return text
    except Exception as e:
        print(f"[DOCX] error: {e}")
        return ""


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
