import chromadb
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.ollama import Ollama
from core.config import OLLAMA_MODEL, EMBED_MODEL, CHROMA_PATH, OLLAMA_BASE_URL

MIN_SCORE = 0.30

def load_index(collection_name: str = "privora") -> VectorStoreIndex:
    client          = chromadb.PersistentClient(path=CHROMA_PATH)
    collection      = client.get_or_create_collection(collection_name)
    vector_store    = ChromaVectorStore(chroma_collection=collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    embed_model     = HuggingFaceEmbedding(model_name=EMBED_MODEL)

    return VectorStoreIndex.from_vector_store(
        vector_store,
        storage_context=storage_context,
        embed_model=embed_model,
    )

def query_index(
    question: str,
    collection_name: str = "privora",
    min_score: float = MIN_SCORE,
    top_k: int = 4,
) -> dict:
    index = load_index(collection_name)
    llm   = Ollama(model=OLLAMA_MODEL, base_url=OLLAMA_BASE_URL, request_timeout=120.0)

    query_engine = index.as_query_engine(
        llm=llm,
        similarity_top_k=top_k,
        streaming=False,
    )

    response   = query_engine.query(question)
    best_score = max(
        (node.score for node in response.source_nodes if node.score),
        default=0
    )

    if best_score < min_score:
        return {"answer": str(response), "sources": []}

    seen = {}
    for node in response.source_nodes:
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
    return {"answer": str(response), "sources": sources}