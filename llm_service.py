import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage


load_dotenv()

def generate_answer(question: str, context: str) -> str:
    """
    Generates an answer using an LLM, strictly bound by the provided context.
    """
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0, groq_api_key=os.getenv("GROQ_API_KEY"))
    #What is the main challenge in DNA analysis mentioned in the document?"
    
    system_prompt = (
        "You are a helpful internal company assistant. "
        "Answer the user's question using ONLY the provided context. "
        "If the answer is not contained in the context, reply exactly with: "
        "'I cannot answer this based on the provided documents.'"
    )
    
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Context:\n{context}\n\nQuestion: {question}")
    ]
    
    response = llm.invoke(messages)
    return response.content
