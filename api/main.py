from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
from core.ingestion import ingest_repo, repo_to_collection
from typing import Optional
import json
import chromadb
from core.config import CHROMA_PATH, OLLAMA_BASE_URL
from core.query import query_index
import shutil
import os
from datetime import datetime, timezone


app = FastAPI(title="Privora API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class IngestRequest(BaseModel):
    repo_url: str
    collection_name: Optional[str] = None

class QueryRequest(BaseModel):
    question: str
    collection_name: str = "privora"

class DeleteRequest(BaseModel):
    collection_name: str = "privora"

class SettingsModel(BaseModel):
    ollama_model:      str   = "phi3:mini"
    min_score:         float = 0.30
    similarity_top_k:  int   = 4

def get_client():
    return chromadb.PersistentClient(path=CHROMA_PATH)


META_PATH     = os.path.join(CHROMA_PATH, "_privora_meta.json")
SETTINGS_PATH = os.path.join(CHROMA_PATH, "_privora_settings.json")

DEFAULT_SETTINGS = {
    "ollama_model":     "phi3:mini",
    "min_score":        0.30,
    "similarity_top_k": 4,
}

def load_all_meta() -> dict:
    if not os.path.exists(META_PATH):
        return {}
    try:
        with open(META_PATH, "r") as f:
            return json.load(f)
    except Exception:
        return {}

def save_all_meta(meta: dict):
    os.makedirs(CHROMA_PATH, exist_ok=True)
    with open(META_PATH, "w") as f:
        json.dump(meta, f, indent=2)

def load_settings() -> dict:
    if not os.path.exists(SETTINGS_PATH):
        return DEFAULT_SETTINGS.copy()
    try:
        with open(SETTINGS_PATH, "r") as f:
            data = json.load(f)
            return {**DEFAULT_SETTINGS, **data}
    except Exception:
        return DEFAULT_SETTINGS.copy()

def save_settings(settings: dict):
    os.makedirs(CHROMA_PATH, exist_ok=True)
    with open(SETTINGS_PATH, "w") as f:
        json.dump(settings, f, indent=2)


@app.get("/")
def root():
    return {"status": "ok", "product": "Privora"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/collections")
def list_collections():
    try:
        client = get_client()
        cols   = [c.name for c in client.list_collections()]
        return {"collections": cols}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/repos")
def list_repos():
    try:
        client      = get_client()
        collections = [c.name for c in client.list_collections()]
        repos = []
        for col in collections:
            parts = col.split("_", 1)
            if len(parts) == 2:
                repos.append({
                    "collection": col,
                    "name":       f"{parts[0]}/{parts[1]}",
                    "url":        f"https://github.com/{parts[0]}/{parts[1]}",
                })
        return {"repos": repos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/repos/meta/{collection_name}")
def get_repo_meta(collection_name: str):
    meta = load_all_meta()
    if collection_name not in meta:
        raise HTTPException(status_code=404, detail="No metadata found.")
    return meta[collection_name]

@app.post("/ingest")
def ingest(req: IngestRequest):
    try:
        collection_name = repo_to_collection(req.repo_url)
        result          = ingest_repo(req.repo_url, collection_name)

        meta = load_all_meta()
        meta[collection_name] = {
            "file_count":  result["file_count"],
            "chunk_count": result["chunk_count"],
            "indexed_at":  datetime.now(timezone.utc).isoformat(),
            "repo_url":    req.repo_url,
        }
        save_all_meta(meta)

        return {
            "status":      "success",
            "repo":        req.repo_url,
            "collection":  collection_name,
            "file_count":  result["file_count"],
            "chunk_count": result["chunk_count"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/query")
def query(req: QueryRequest):
    try:
        settings = load_settings()
        client   = get_client()
        existing = [c.name for c in client.list_collections()]
        if req.collection_name not in existing:
            raise HTTPException(status_code=400, detail="No documents indexed yet.")
        collection = client.get_collection(req.collection_name)
        if collection.count() == 0:
            raise HTTPException(status_code=400, detail="Collection is empty.")
        result = query_index(
            req.question,
            req.collection_name,
            min_score=settings["min_score"],
            top_k=settings["similarity_top_k"],
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/query/stream")
async def query_stream(req: QueryRequest):
    try:
        client   = get_client()
        existing = [c.name for c in client.list_collections()]
        if req.collection_name not in existing:
            raise HTTPException(status_code=400, detail="No documents indexed yet.")
        collection = client.get_collection(req.collection_name)
        if collection.count() == 0:
            raise HTTPException(status_code=400, detail="Collection is empty.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    def generate():
        from llama_index.core import VectorStoreIndex, StorageContext
        from llama_index.vector_stores.chroma import ChromaVectorStore
        from llama_index.embeddings.huggingface import HuggingFaceEmbedding
        from llama_index.llms.ollama import Ollama
        from core.config import EMBED_MODEL, OLLAMA_MODEL

        settings     = load_settings()
        ollama_model = settings.get("ollama_model", OLLAMA_MODEL)
        min_score    = settings.get("min_score", 0.30)
        top_k        = settings.get("similarity_top_k", 4)

        chroma_client   = chromadb.PersistentClient(path=CHROMA_PATH)
        collection      = chroma_client.get_or_create_collection(req.collection_name)
        vector_store    = ChromaVectorStore(chroma_collection=collection)
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        embed_model     = HuggingFaceEmbedding(model_name=EMBED_MODEL)

        index = VectorStoreIndex.from_vector_store(
            vector_store,
            storage_context=storage_context,
            embed_model=embed_model,
        )

        llm = Ollama(model=ollama_model, base_url=OLLAMA_BASE_URL, request_timeout=120.0)

        query_engine = index.as_query_engine(
            llm=llm,
            similarity_top_k=top_k,
            streaming=True,
        )

        streaming_response = query_engine.query(req.question)

        for text in streaming_response.response_gen:
            chunk = json.dumps({"type": "chunk", "text": text})
            yield f"data: {chunk}\n\n"

        source_nodes = streaming_response.source_nodes
        best_score   = max(
            (n.score for n in source_nodes if n.score),
            default=0
        )

        sources = []
        if best_score >= min_score:
            seen = {}
            for node in source_nodes:
                file  = node.metadata.get("file_path", "unknown")
                score = round(node.score, 3) if node.score else 0
                if file not in seen or score > seen[file]["score"]:
                    seen[file] = {
                        "file":    file,
                        "url":     node.metadata.get("url", ""),
                        "score":   score,
                        "snippet": node.text[:200].strip(),
                    }
            sources = sorted(seen.values(), key=lambda x: x["score"], reverse=True)

        done = json.dumps({"type": "done", "sources": sources})
        yield f"data: {done}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/delete")
def delete_repo(req: DeleteRequest):
    try:
        client   = get_client()
        existing = [c.name for c in client.list_collections()]
        if req.collection_name in existing:
            client.delete_collection(req.collection_name)

        for item in os.listdir(CHROMA_PATH):
            item_path = os.path.join(CHROMA_PATH, item)
            if os.path.isdir(item_path):
                shutil.rmtree(item_path)

        meta = load_all_meta()
        if req.collection_name in meta:
            del meta[req.collection_name]
            save_all_meta(meta)

        return {"status": "deleted", "collection": req.collection_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/settings")
def get_settings():
    return load_settings()

@app.post("/settings")
def update_settings(req: SettingsModel):
    data = {
        "ollama_model":     req.ollama_model,
        "min_score":        req.min_score,
        "similarity_top_k": req.similarity_top_k,
    }
    save_settings(data)
    return {"status": "saved", **data}


@app.post("/reindex-all")
def reindex_all():
    meta = load_all_meta()
    if not meta:
        raise HTTPException(status_code=400, detail="No repos to reindex.")

    results = []
    for collection_name, info in meta.items():
        repo_url = info.get("repo_url")
        if not repo_url:
            continue
        try:
            client   = get_client()
            existing = [c.name for c in client.list_collections()]
            if collection_name in existing:
                client.delete_collection(collection_name)

            result = ingest_repo(repo_url, collection_name)

            meta[collection_name] = {
                "file_count":  result["file_count"],
                "chunk_count": result["chunk_count"],
                "indexed_at":  datetime.now(timezone.utc).isoformat(),
                "repo_url":    repo_url,
            }
            results.append({"collection": collection_name, "status": "ok"})
        except Exception as e:
            results.append({"collection": collection_name, "status": "error", "detail": str(e)})

    save_all_meta(meta)
    return {"results": results}


@app.post("/clear-all")
def clear_all():
    try:
        client = get_client()
        for col in client.list_collections():
            client.delete_collection(col.name)

        for item in os.listdir(CHROMA_PATH):
            item_path = os.path.join(CHROMA_PATH, item)
            if os.path.isdir(item_path):
                shutil.rmtree(item_path)
            elif item != "_privora_settings.json":
                os.remove(item_path)

        save_all_meta({})
        return {"status": "cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))