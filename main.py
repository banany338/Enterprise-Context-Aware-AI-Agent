import io
import PyPDF2
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from vector_store import add_to_vector_store, query_vector_store
from llm_service import generate_answer

app = FastAPI(title="Enterprise Context-Aware AI Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    question: str

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Accepts a PDF file upload, extracts the text from it, and returns the first 500 characters.
    """
    
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        file_content = await file.read()
        
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        
        extracted_text = ""
        for page in pdf_reader.pages:
            extracted_text += page.extract_text() or ""
            
        num_chunks = add_to_vector_store(extracted_text, file.filename)
            
        return {
            "filename": file.filename,
            "text_preview": extracted_text[:500],
            "chunks_created": num_chunks
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Receives a user question, searches for relevant context in ChromaDB,
    and asks the LLM to generate a response based only on that context.
    """
    try:
        context = query_vector_store(request.question)
        
        answer = generate_answer(request.question, context)
        
        return {"answer": answer}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {str(e)}")
