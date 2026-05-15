import os
from dotenv import load_dotenv

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "phi3:mini")
EMBED_MODEL   = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")
CHROMA_PATH   = os.getenv("CHROMA_PATH", "./chroma_db")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")