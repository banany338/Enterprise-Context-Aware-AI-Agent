import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_huggingface import HuggingFaceEmbeddings


CHROMA_DB_DIR = "chroma_db"
COLLECTION_NAME = "company_docs"

def get_embeddings():
    """
    Returns the appropriate embedding model based on available environment variables.
    """
    if os.getenv("OPENAI_API_KEY"):
        return OpenAIEmbeddings()
    else:
        return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def add_to_vector_store(text: str, filename: str) -> int:
    """
    Takes the extracted text and the filename, splits the text into smaller chunks,
    turns them into vector embeddings, and stores them in ChromaDB. Returns the number of chunks stored.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    
    chunks = text_splitter.split_text(text)
    
    if not chunks:
        return 0
        
    metadatas = [{"source": filename} for _ in chunks]

    embeddings = get_embeddings()

    vector_store = Chroma.from_texts(
        texts=chunks,
        embedding=embeddings,
        metadatas=metadatas,
        collection_name=COLLECTION_NAME,
        persist_directory=CHROMA_DB_DIR
    )
    
    return len(chunks)
