import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

CHROMA_DB_DIR = "chroma_db"
COLLECTION_NAME = "company_docs"

_embeddings_instance = None
_vector_store_instance = None

def get_embeddings():
    """
    Returns embedding model inside a Singleton wrapper.
    """
    global _embeddings_instance
    if _embeddings_instance is None:
        _embeddings_instance = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return _embeddings_instance

def get_vector_store():
    """
    Returns the persistent Chroma client inside a global Singleton wrapper.
    """
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = Chroma(
            collection_name=COLLECTION_NAME,
            embedding_function=get_embeddings(),
            persist_directory=CHROMA_DB_DIR
        )
    return _vector_store_instance

def add_to_vector_store(text: str, filename: str) -> int:
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    
    chunks = text_splitter.split_text(text)
    
    if not chunks:
        return 0
        
    metadatas = [{"source": filename} for _ in chunks]

    vector_store = get_vector_store()
    vector_store.add_texts(texts=chunks, metadatas=metadatas)
    
    return len(chunks)

def query_vector_store(query: str, n_results: int = 3) -> dict:
    vector_store = get_vector_store()
    
    results = vector_store.similarity_search_with_score(query, k=n_results)
    
    context_chunks = []
    sources = set()
    raw_chunks = []
    
    for doc, score in results:
        context_chunks.append(doc.page_content)
        source_name = doc.metadata.get("source", "Unknown")
        sources.add(source_name)
        
        raw_chunks.append({
            "text": doc.page_content,
            "score": float(score),
            "source": source_name
        })
    
    context_string = "\n\n---\n\n".join(context_chunks)
    
    return {
        "context": context_string,
        "sources": list(sources),
        "raw_chunks": raw_chunks
    }

def clear_vector_store():
    """
    Deletes the current ChromaDB collection from disk and resets the Singleton.
    """
    global _vector_store_instance
    try:
        store = get_vector_store()
        store.delete_collection()
        _vector_store_instance = None
        return True
    except Exception as e:
        print(f"Failed to clear Vector DB: {e}")
        return False
