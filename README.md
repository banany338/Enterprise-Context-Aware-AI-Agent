# Enterprise Context-Aware AI Agent

A full-stack, enterprise-grade backoffice application designed to process, vectorize, and semantically analyze unstructured company PDF documents using a Retrieval-Augmented Generation (RAG) architecture.

## 🚀 Key Features

- **Blazing Fast RAG Pipeline**: Combines FastAPI, LangChain, and ChromaDB for highly efficient vector extraction and querying.
- **Local Embeddings Toolkit**: Uses local HuggingFace embedding models (`all-MiniLM-L6-v2`) to eliminate external embedding costs and strictly protect intellectual property during the indexing phase.
- **Groq Llama 3.1 Inference**: Synthesizes complex context windows in milliseconds. Strictly governed by system prompts to *prevent hallucinations*.
- **Ultra-Modern Frontend**: Built with Vite, React, TypeScript, and TailwindCSS v4. Features a fluid full-viewport UI scaling and a dark enterprise sidebar.
- **Brain Inspector**: A responsive, slide-in technical pane that mathematically proves the AI's logic by exposing the raw retrieved source text, file origins, and semantic distance scores instantly after every response.
- **Dynamic Search Intelligence**: An onboard slider controlling the $k$-nearest neighbors search radius algorithm, allowing users to balance context-depth with token limitations.

---

## 🛠️ Technology Stack

**Backend System**
- Python 3.11
- FastAPI Server
- LangChain + ChromaDB (Local SQLite Vector Storage)
- HuggingFace Models (`all-MiniLM-L6-v2`)
- Groq Cloud API (`llama-3.1-8b-instant`)

**Frontend Client**
- Vite + React + TypeScript
- TailwindCSS v4
- Axios + Lucide Icons

**Infrastructure**
- Docker & Docker Compose
- Multi-staged CI-ready deployments

---

## ⚙️ Getting Started

### Prerequisites

You will need a Groq API key to handle the generative LLM pipeline.
Create a `.env` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key_here
```

### Option 1: Native Development

**Start the Backend:**
```bash
# Strongly recommended to use an isolated venv
python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --reload
```
API runs universally on `http://localhost:8000`

**Start the Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Client runs universally on `http://localhost:5173`

### Option 2: Docker Orchestration (Production Ready)

Automatically compiles the static React bundle using `node:20-alpine`, orchestrates the `python:3.11-slim` backend, networks the ports, and correctly binds a local volume to persist `chroma_db` datasets through reboots.

```bash
docker-compose up --build
```
The unified platform will operate securely at `http://localhost:5173`. 

---

## 📝 Usage Constraints & Notes
*   **Database Wipes**: Using the "Clear Database" button structurally executes a full disk `.delete_collection()` command before wiping local application state. All uploaded file representations are irreversibly lost. 
*   **Vector Consistency**: Docker environments mapped for SQLite must share persistent volume bindings. `docker-compose.yml` natively mounts your `./chroma_db` folder safely back to the host container.
