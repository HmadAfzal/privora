<div align="center">

<img src="/assets/logo.png" width="120"/>

# Privora

**Private, self-hosted AI knowledge base for your codebase.**

</div>

Point Privora at your GitHub repositories, ask questions in plain English, and get answers with exact source citations, all running locally on your own machine. Your code never leaves your server.

[![Demo Video](https://cdn.loom.com/sessions/thumbnails/YOUR_LOOM_ID-with-play.gif)](https://www.loom.com/share/YOUR_LOOM_ID)

---

## Why Privora

Most AI tools that understand your codebase send your code to the cloud. Privora doesn't.

- **100% local** — embeddings, vector storage, and LLM inference all run on your machine
- **Multi-repo** — index as many repositories as you want, each in its own collection
- **Streaming answers** — responses stream word by word with source citations
- **No vendor lock-in** — swap models via settings, no code changes needed

---

## How It Works

```
GitHub Repo → Fetch files → Chunk & embed → ChromaDB
                                                ↓
User question → Embed query → Vector search → Ollama LLM → Streaming answer + sources
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI |
| RAG Pipeline | LlamaIndex |
| Vector DB | ChromaDB (local) |
| Embeddings | HuggingFace `all-MiniLM-L6-v2` |
| LLM Runtime | Ollama |
| Frontend | React + Vite |
| Serving | Nginx |

---

## Prerequisites

Before you start, make sure you have:

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Ollama](https://ollama.com/download) installed and running
- A [GitHub Personal Access Token](https://github.com/settings/tokens) (classic, with `repo` scope)
- A [HuggingFace Token](https://huggingface.co/settings/tokens) (free, for faster model downloads)

---

## Quick Start (Docker)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/privora.git
cd privora
```

### 2. Pull an Ollama model

Privora uses Ollama for local LLM inference. Pull a model before starting:

```bash
ollama pull qwen2.5:0.5b      # recommended — fast, low RAM (~1GB)
# or
ollama pull phi3:mini          # better quality, needs ~4GB RAM
# or
ollama pull llama3             # best quality, needs ~8GB RAM
```

Make sure Ollama is running:

```bash
ollama serve
```

### 3. Configure environment

Copy the example env file and fill in your tokens:

```bash
cp .env.example .env
```

Edit `.env`:

```env
GITHUB_TOKEN=your_github_pat_here
OLLAMA_MODEL=qwen2.5:0.5b
EMBED_MODEL=all-MiniLM-L6-v2
CHROMA_PATH=./chroma_db
HF_TOKEN=your_huggingface_token_here
```

### 4. Start Privora

```bash
docker compose up --build
```

First build takes 5–10 minutes (downloading Python packages and the embedding model). Subsequent starts are instant.

### 5. Open the app

```
http://localhost:3000
```

---

## First Steps

1. Click **Repos** in the sidebar
2. Paste a GitHub repo URL (e.g. `https://github.com/owner/repo`)
3. Press Enter or click **+** — Privora will fetch, chunk, and embed the repo
4. Once indexed, click the repo to select it
5. Switch to **Chats**, type your question, and hit Enter

---

## Running Without Docker (Native)

If you want to run natively (especially for GPU support):

### Backend

```bash
cd privora

# CPU only
pip install -r requirements.txt

# GPU (CUDA) — includes torch with CUDA and nvidia packages
pip install -r requirements-gpu.txt

# Start the backend
uvicorn api.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`, backend at `http://localhost:8000`.

---

## GPU Support

Privora's backend runs CPU-only inside Docker (Ollama handles GPU acceleration separately via the host). For full GPU acceleration on embeddings:

1. Use the native setup above with `requirements-gpu.txt`
2. Make sure your CUDA drivers are installed
3. Ollama will automatically use your GPU for inference

---

## Settings

Access settings via the gear icon at the bottom of the sidebar.

| Setting | Description | Default |
|---|---|---|
| Ollama model | Which locally pulled model to use | `qwen2.5:0.5b` |
| Similarity threshold | Minimum score to show sources (0.05–0.95) | `0.30` |
| Top-K chunks | How many source chunks to retrieve per query | `4` |

Changes take effect immediately on the next query. No restart needed.

### Data Management

- **Re-index all repos** — re-fetches and re-embeds every indexed repo from GitHub
- **Clear all data** — wipes all indexed repos from ChromaDB (settings are preserved)

---

## Project Structure

```
privora/
├── core/
│   ├── config.py          # env vars and config
│   ├── ingestion.py       # GitHub fetching, chunking, embedding
│   └── query.py           # vector search and LLM query
├── api/
│   └── main.py            # FastAPI routes
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api/client.js
│   │   ├── store/useStore.js
│   │   ├── components/
│   │   │   ├── Sidebar/
│   │   │   ├── Chat/
│   │   │   ├── Settings/
│   │   │   └── ui/
│   │   └── styles/tokens.js
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── Dockerfile.backend
├── docker-compose.yml
├── requirements.txt        # CPU (Docker)
├── requirements-gpu.txt    # GPU (native)
├── .env
├── .gitignore
└── .env.example
```

---

## Environment Variables

| Variable | Required | Description | Default |
|---|---|---|---|
| `GITHUB_TOKEN` | Yes | GitHub classic PAT with `repo` scope | — |
| `OLLAMA_MODEL` | No | Ollama model name | `phi3:mini` |
| `EMBED_MODEL` | No | HuggingFace embedding model | `all-MiniLM-L6-v2` |
| `CHROMA_PATH` | No | Path to ChromaDB storage | `./chroma_db` |
| `HF_TOKEN` | No | HuggingFace token (recommended) | — |

---

## Troubleshooting

**Ollama connection error inside Docker**

Privora uses host networking so the backend can reach Ollama on `localhost:11434`. If you get connection errors, make sure Ollama is running before starting Docker:

```bash
ollama serve
docker compose up
```

**Ingestion times out**

Large repos take time. The nginx proxy timeout is set to 600s. For very large repos, consider indexing via the native setup instead.

**Port 3000 already in use**

Change the port in `docker-compose.yml`:

```yaml
network_mode: "host"
```

Then change `listen 3000` in `frontend/nginx.conf` to any free port.

**Out of memory during inference**

Switch to a smaller model in Settings → Ollama model:

```
qwen2.5:0.5b   # ~1GB RAM
tinyllama      # ~600MB RAM
```

---