import os
from github import Github, Auth
from llama_index.core import Document, VectorStoreIndex, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.node_parser import CodeSplitter, SentenceSplitter
import chromadb
from core.config import GITHUB_TOKEN, EMBED_MODEL, CHROMA_PATH

CODE_EXTENSIONS = {'.py', '.js', '.ts', '.jsx', '.tsx', '.go', '.rs', '.java', '.cpp', '.c', '.h'}
DOC_EXTENSIONS  = {'.md', '.mdx', '.txt', '.rst'}
SKIP_DIRS       = {'node_modules', '.git', '__pycache__', 'dist', 'build', '.next', 'venv'}

def get_embed_model():
    return HuggingFaceEmbedding(model_name=EMBED_MODEL)

def get_chroma_collection(collection_name: str):
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    collection = client.get_or_create_collection(collection_name)
    vector_store = ChromaVectorStore(chroma_collection=collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    return storage_context

def fetch_github_files(repo_url: str) -> list[Document]:
    auth = Auth.Token(GITHUB_TOKEN)
    g = Github(auth=auth)

    parts = repo_url.rstrip('/').split('/')
    owner, repo_name = parts[-2], parts[-1]

    repo = g.get_repo(f"{owner}/{repo_name}")
    documents = []

    def process_contents(contents):
        for item in contents:
            if item.type == 'dir':
                if item.name not in SKIP_DIRS:
                    process_contents(repo.get_contents(item.path))
                continue

            ext = os.path.splitext(item.name)[1].lower()
            if ext not in CODE_EXTENSIONS and ext not in DOC_EXTENSIONS:
                continue

            try:
                content = item.decoded_content.decode('utf-8', errors='ignore')
                if not content.strip():
                    continue

                doc = Document(
                    text=content,
                    metadata={
                        'file_path': item.path,
                        'file_name': item.name,
                        'file_type': 'code' if ext in CODE_EXTENSIONS else 'doc',
                        'extension': ext,
                        'repo': f"{owner}/{repo_name}",
                        'url': item.html_url,
                    }
                )
                documents.append(doc)
                print(f"  ✓ {item.path}")

            except Exception as e:
                print(f"  ✗ {item.path} — {e}")

    print(f"\nFetching {owner}/{repo_name}...")
    process_contents(repo.get_contents(""))
    print(f"Fetched {len(documents)} files.\n")
    return documents

def chunk_documents(documents: list[Document]) -> list:
    nodes = []

    doc_splitter = SentenceSplitter(
        chunk_size=512,
        chunk_overlap=50,
    )

    for doc in documents:
        try:
            if doc.metadata['file_type'] == 'code':
                lang_map = {
                    '.py': 'python', '.js': 'javascript', '.ts': 'typescript',
                    '.jsx': 'javascript', '.tsx': 'typescript', '.go': 'go',
                    '.rs': 'rust', '.java': 'java', '.cpp': 'cpp',
                }

                lang = lang_map.get(doc.metadata['extension'], 'python')

                code_splitter = CodeSplitter(
                    language=lang,
                    chunk_lines=40,
                    chunk_lines_overlap=5,
                    max_chars=1500,
                )

                nodes.extend(code_splitter.get_nodes_from_documents([doc]))
            else:
                nodes.extend(doc_splitter.get_nodes_from_documents([doc]))
        except Exception:
            nodes.extend(doc_splitter.get_nodes_from_documents([doc]))

    print(f"Created {len(nodes)} chunks.\n")
    return nodes

def ingest_repo(repo_url: str, collection_name: str = "privora") -> dict:
    print("=== Privora Ingestion Pipeline ===\n")

    documents = fetch_github_files(repo_url)
    if not documents:
        raise ValueError("No documents fetched. Check the repo URL and token.")

    nodes = chunk_documents(documents)

    print("Embedding and storing in ChromaDB...")
    embed_model     = get_embed_model()
    storage_context = get_chroma_collection(collection_name)

    VectorStoreIndex(
        nodes,
        storage_context=storage_context,
        embed_model=embed_model,
        show_progress=True,
    )

    print("\n✓ Ingestion complete.\n")
    return {
        "file_count":  len(documents),
        "chunk_count": len(nodes),
    }

if __name__ == "__main__":
    repo = input("Enter GitHub repo URL: ")
    ingest_repo(repo)


def repo_to_collection(repo_url: str) -> str:
    parts = repo_url.rstrip("/").split("/")
    owner, name = parts[-2], parts[-1]
    return f"{owner}_{name}".lower().replace(" ", "_")