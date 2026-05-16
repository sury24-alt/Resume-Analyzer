import os
from dotenv import load_dotenv
from langchain_community.embeddings import HuggingFaceInferenceAPIEmbeddings

load_dotenv()

print("Testing HF Inference API...")
try:
    embeddings = HuggingFaceInferenceAPIEmbeddings(
        api_key=os.getenv("HUGGINGFACE_API_KEY", ""),
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    vector = embeddings.embed_query("test")
    print("Success! Vector length:", len(vector))
except Exception as e:
    print("Error:", e)
