# Agentic-AI Dynamic Underwriting Assistant: Interview Questions & Answers

These questions and answers are tailored to your agentic-ai application, LangGraph workflow, and the tools/models used, based on your `agentic-ai.md` documentation.

---

## General Architecture & Flow

### 1. What is the main goal of the Dynamic Underwriting Assistant?
**Answer:**
The goal is to automate and enhance the insurance underwriting process using AI. The system ingests policies, claims, and regulations, processes them with embeddings and vector search, and uses a LangGraph workflow to generate risk summaries, recommendations, and explanations for underwriters.

---

### 2. What are the main API endpoints and what do they do?
**Answer:**
- `/api/policies` (POST/GET): Save or list policy documents.
- `/api/claims` (POST/GET): Save or list past claims.
- `/api/regulations` (POST/GET): Save or list regulation snippets.
- `/api/embeddings` (POST): Generate embeddings for text chunks.
All POST endpoints accept JSON, assign a UUID and createdAt, and persist to a database or file. GET endpoints return all saved items.

---

### 3. How is data stored and retrieved in this system?
**Answer:**
Data is stored in a database (or JSON files for POC). Each entity (policy, claim, regulation) is saved with a UUID and timestamp. Data is retrieved via REST API GET endpoints.

---

## Vector Store & Embeddings

### 4. What is FAISS and why is it used?
**Answer:**
FAISS is a library for efficient similarity search and clustering of dense vectors. It is used here as an in-memory vector index to store and search embeddings of text chunks, enabling fast retrieval of relevant context for underwriting decisions.

---

### 5. How are text chunks embedded and indexed?
**Answer:**
Text is split into overlapping chunks (~500 tokens, 50 overlap), each chunk is embedded using an embedding model (e.g., Groq), and the resulting vectors are added to the FAISS index. Metadata is stored to map vectors back to their source.

---

### 6. How does the embedding service work?
**Answer:**
The embedding service exposes a POST `/api/embeddings` endpoint. It accepts a list of text chunks and a model name, returns a list of embedding vectors, which are then indexed in FAISS for similarity search.

---

## Data Chunking & Retrieval

### 7. Why do you chunk large texts before embedding?
**Answer:**
Chunking allows the system to handle long documents by breaking them into manageable pieces, ensuring each chunk fits the model’s input size and enabling more granular retrieval of relevant information during vector search.

---

### 8. How are chunks associated with their source data?
**Answer:**
Each chunk is tagged with metadata such as source type (policy, claim, regulation), a unique ID, and its offset in the original text. This allows for traceability and context reconstruction.

---

## Prompt Engineering

### 9. What is the purpose of the risk summary prompt?
**Answer:**
The risk summary prompt instructs the LLM to analyze the application and its context (policy, claims, regulations) and produce a concise risk summary, recommended coverage, and any red flags, using the retrieved chunks as evidence.

---

### 10. How does the deep explanation prompt work?
**Answer:**
When an underwriter selects a red flag, the deep explanation prompt asks the LLM to provide a detailed explanation with citations (e.g., chunk IDs or page numbers), helping users understand the reasoning behind the flag.

---

## LangGraph Workflow

### 11. What is LangGraph and how is it used in this project?
**Answer:**
LangGraph is a workflow orchestration tool for chaining together data fetchers, embedding/retrieval steps, LLM chains, and UI components. In this project, it defines the flow from data fetching, embedding, retrieval, risk summarization, to UI rendering and explanation.

---

### 12. Can you describe the main nodes and edges in the LangGraph workflow?
**Answer:**
- **fetch_context:** Fetches policy, claims, and regulations from APIs.
- **embed_and_retrieve:** Chunks, embeds, and retrieves top-k relevant chunks using FAISS.
- **summarize_risk:** Uses an LLM to generate a risk summary and red flags.
- **ui_render:** Renders the summary and flags in the UI.
- **explain_deeply:** LLM generates a detailed explanation for a selected flag.
- **ui_explain:** Renders the explanation in the UI.
Edges define the order and data flow between these nodes.

---

### 13. How does the custom chain (`embed_and_retrieve`) work?
**Answer:**
It receives raw texts and application data, performs chunking and embedding, uses FAISS to retrieve the most relevant chunks for each context (policy, claims, regulations), and outputs these for downstream LLM summarization.

---

### 14. How is security handled in the API?
**Answer:**
APIs are secured via JWT/OAuth2 at the gateway level. Service-to-service calls use authorization headers. Base URLs and secrets are configured via environment variables.

---

### 15. How is the system designed for extensibility?
**Answer:**
- Microservice endpoints can be scaled or swapped independently.
- The LangGraph YAML can be extended with new nodes or chains.
- Embedding models and vector stores can be replaced as needed.
- Prompts can be iterated for better LLM performance.

---

### 16. What are the main benefits of this agentic approach?
**Answer:**
- Automates complex underwriting workflows
- Provides explainable AI outputs
- Modular and extensible architecture
- Fast, context-aware retrieval using embeddings and vector search
- Easy to integrate new data sources or models

---

These questions and answers will help you discuss the architecture, flow, and technical choices of your agentic-ai underwriting assistant project in detail during interviews.
