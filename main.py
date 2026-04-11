import io
import PyPDF2
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from vector_store import add_to_vector_store, query_vector_store, clear_vector_store
from llm_service import generate_answer

app = FastAPI(title="Enterprise Context-Aware AI Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    question: str
    intelligence: int = 3

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
        retrieval_data = query_vector_store(request.question, n_results=request.intelligence)
        
        answer = generate_answer(request.question, retrieval_data["context"])
        
        return {
            "answer": answer,
            "sources": retrieval_data["sources"],
            "chunks": retrieval_data["raw_chunks"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {str(e)}")

@app.delete("/clear")
async def clear_db():
    """
    Deletes all uploaded documents and vectors from the local database.
    """
    try:
        success = clear_vector_store()
        if not success:
            raise Exception("ChromaDB failed to drop collection. Check backend logs.")
        return {"message": "Database and embeddings cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear database: {str(e)}")
