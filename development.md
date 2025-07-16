# Dynamic Underwriting Assistant - Development Guide

## 🏗️ **Architecture Overview**

The Dynamic Underwriting Assistant is a sophisticated agentic AI application built using **LangGraph** for orchestrating multi-agent workflows, **Django** for the backend API, and **React** for the frontend interface. The system leverages **FAISS** for vector storage, **Groq LLM** for intelligent analysis, and **tiktoken** for text processing.

---

## 🧠 **Core Components Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐ │
│  │ Policy Mgr  │ │ Claims Mgr  │ │ Regulation  │ │ Embed  │ │
│  │             │ │             │ │ Manager     │ │ Service│ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────┘ │
│                          │                                  │
│              ┌─────────────────────────────┐                │
│              │  Underwriting Processor     │                │
│              │  (Main LangGraph Interface) │                │
│              └─────────────────────────────┘                │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTP/REST API
┌─────────────────────────┼───────────────────────────────────┐
│                   BACKEND (Django)                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              API LAYER (Django REST)                   │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │ │
│  │  │Policy   │ │Claims   │ │Regulation│ │Underwriting     │ │ │
│  │  │ViewSet  │ │ViewSet  │ │ViewSet   │ │ViewSet          │ │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                AGENTIC AI LAYER                        │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │              LangGraph Workflow                     │ │ │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐ │ │ │
│  │  │  │Data     │ │Embedding│ │Risk     │ │Flag         │ │ │ │
│  │  │  │Fetcher  │ │Service  │ │Analyzer │ │Explainer    │ │ │ │
│  │  │  │Agent    │ │Agent    │ │Agent    │ │Agent        │ │ │ │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────────┘ │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 DATA LAYER                              │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │ │
│  │  │Policy   │ │Claim    │ │Regulation│ │UnderwritingApp  │ │ │
│  │  │Model    │ │Model    │ │Model     │ │Model            │ │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘ │ │
│  │                    Django ORM + SQLite                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              VECTOR STORAGE LAYER                      │ │
│  │  ┌─────────────────┐ ┌─────────────────────────────────┐ │ │
│  │  │   FAISS Index   │ │      Embedding Service         │ │ │
│  │  │  (Vector Store) │ │   (Chunking + Embeddings)      │ │ │
│  │  └─────────────────┘ └─────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 AI/LLM LAYER                            │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │               Groq LLM Integration                  │ │ │
│  │  │        (llama-3.1-8b-instant model)                │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 **LangGraph Workflow Architecture**

### **What is LangGraph?**
LangGraph is a framework for building stateful, multi-agent workflows using Large Language Models. It allows us to create complex AI systems where multiple specialized agents work together in a coordinated manner.

### **Our LangGraph Implementation:**

```python
class UnderwritingState(MessagesState):
    """State object that flows through the entire workflow"""
    applicant_id: str = ""
    policy_id: str = ""
    lob: str = ""
    application_data: Dict = {}
    policy_chunks: List[str] = []
    claims_chunks: List[str] = []
    regulations_chunks: List[str] = []
    risk_summary: str = ""
    red_flags: List[str] = []
    recommendations: str = ""
    explanation: str = ""
    task_complete: bool = False
    current_step: str = ""
```

### **Workflow Nodes (Agents):**

#### **1. Data Fetcher Agent** (`fetch_context_data`)
- **Purpose**: Retrieves relevant data from the database
- **Input**: Application identifiers (applicant_id, policy_id, lob)
- **Process**:
  ```python
  # Fetch policy data
  policy = Policy.objects.filter(policy_id=state["policy_id"]).first()
  
  # Fetch claims data  
  claims = Claim.objects.filter(applicant_id=state["applicant_id"])
  
  # Fetch regulations data
  regulations = Regulation.objects.filter(lob=state["lob"])
  ```
- **Output**: Raw text data for policies, claims, and regulations

#### **2. Embedding Service Agent** (`embed_and_retrieve`)
- **Purpose**: Processes and indexes text data, performs similarity search
- **Process**:
  ```python
  # Chunk documents using tiktoken
  chunks = self.embedding_service.chunk_text(text, chunk_size=500, overlap=50)
  
  # Generate embeddings (mock implementation)
  embeddings = self.embedding_service.get_embeddings(chunks)
  
  # Add to FAISS index
  self.embedding_service.add_to_index(texts, source, doc_id)
  
  # Perform similarity search
  relevant_chunks = self.embedding_service.search(query, k=15)
  ```
- **Output**: Relevant text chunks categorized by source

#### **3. Risk Analyzer Agent** (`summarize_risk`)
- **Purpose**: Uses Groq LLM to analyze risk and generate insights
- **Process**:
  ```python
  prompt = f"""As an insurance underwriting expert, analyze this application:
  
  APPLICATION DATA: {json.dumps(application_data, indent=2)}
  CONTEXT: {context_str}
  
  RISK SUMMARY: [assessment]
  RED FLAGS: [specific concerns]
  RECOMMENDATIONS: [actions]"""
  
  response = self.llm.invoke([HumanMessage(content=prompt)])
  ```
- **Output**: Structured risk analysis with flags and recommendations

#### **4. Flag Explainer Agent** (`explain_flag`)
- **Purpose**: Provides detailed explanations for specific risk flags
- **Process**: Uses LLM to generate comprehensive explanations
- **Output**: Detailed analysis of specific risk factors

### **Workflow Routing Logic:**

```python
def router(self, state: UnderwritingState) -> str:
    """Routes between workflow steps based on current state"""
    current_step = state.get("current_step", "fetch_context")
    
    if current_step == "error" or state.get("task_complete", False):
        return END
    elif current_step == "fetch_context":
        return "fetch_context"
    elif current_step == "embed_and_retrieve":
        return "embed_and_retrieve"
    elif current_step == "summarize_risk":
        return "summarize_risk"
    else:
        return END
```

---

## 🗄️ **Data Models & Storage**

### **Django Models:**

#### **1. Policy Model**
```python
class Policy(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    policy_id = models.CharField(max_length=100, unique=True)
    text = models.TextField()  # Policy document content
    metadata = models.JSONField(default=dict)  # Structured data
    created_at = models.DateTimeField(auto_now_add=True)
```

**Purpose**: Stores insurance policy documents and terms
**Data Flow**: 
- Frontend → Policy Manager → API → Policy Model → Database
- Used by LangGraph for context retrieval

#### **2. Claim Model**
```python
class Claim(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    applicant_id = models.CharField(max_length=100)
    text = models.TextField()  # Claim description
    metadata = models.JSONField(default=dict)
    lob = models.CharField(max_length=50)  # Line of Business
    created_at = models.DateTimeField(auto_now_add=True)
```

**Purpose**: Stores historical claims data for risk assessment
**Data Flow**:
- Frontend → Claim Manager → API → Claim Model → Database
- Retrieved by applicant_id during underwriting

#### **3. Regulation Model**
```python
class Regulation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    text = models.TextField()  # Regulation content
    metadata = models.JSONField(default=dict)
    lob = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Purpose**: Stores regulatory requirements and compliance rules
**Data Flow**:
- Frontend → Regulation Manager → API → Regulation Model → Database
- Retrieved by line of business (lob) during underwriting

#### **4. UnderwritingApplication Model**
```python
class UnderwritingApplication(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    applicant_id = models.CharField(max_length=100)
    policy_id = models.CharField(max_length=100)
    lob = models.CharField(max_length=50)
    application_data = models.JSONField()
    risk_summary = models.TextField(blank=True)
    red_flags = models.JSONField(default=list)
    recommendations = models.TextField(blank=True)
    status = models.CharField(max_length=50, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
```

**Purpose**: Stores processed underwriting applications and results
**Data Flow**:
- Created automatically when LangGraph workflow completes
- Stores all analysis results for future reference

---

## 🔍 **Vector Storage & Embedding System**

### **FAISS Integration:**

```python
class EmbeddingService:
    def __init__(self):
        self.dimension = 1536  # Standard embedding dimension
        self.index = faiss.IndexFlatL2(self.dimension)  # L2 distance index
        self.chunk_metadata = []  # Metadata for each chunk
        self.encoding = tiktoken.get_encoding("gpt2")  # Tokenizer
```

### **Text Chunking Process:**
```python
def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50):
    """Split text into overlapping chunks for better context preservation"""
    tokens = self.encoding.encode(text)
    chunks = []
    for i in range(0, len(tokens), chunk_size - overlap):
        chunk = self.encoding.decode(tokens[i: i + chunk_size])
        chunks.append(chunk)
    return chunks
```

**Why Chunking?**
- Large documents exceed LLM token limits
- Overlap ensures context continuity
- Smaller chunks improve search relevance

### **Embedding Generation:**
```python
def get_embeddings(self, texts: List[str]) -> List[List[float]]:
    """Generate vector embeddings for text chunks"""
    # Current: Mock implementation for testing
    # Production: Would use Groq's embedding API
    embeddings = []
    for text in texts:
        embedding = np.random.rand(self.dimension).tolist()
        embeddings.append(embedding)
    return embeddings
```

### **Vector Search Process:**
```python
def search(self, query: str, k: int = 5) -> List[Dict]:
    """Semantic search using FAISS index"""
    query_embedding = self.get_embeddings([query])[0]
    query_array = np.array([query_embedding], dtype=np.float32)
    
    distances, indices = self.index.search(query_array, min(k, self.index.ntotal))
    
    # Return relevant chunks with metadata
    results = []
    for i, idx in enumerate(indices[0]):
        if idx >= 0 and idx < len(self.chunk_metadata):
            result = self.chunk_metadata[idx].copy()
            result['distance'] = distances[0][i]
            results.append(result)
    return results
```

---

## 🔄 **Complete Process Flow**

### **1. Data Ingestion Flow:**

```
Frontend Form → API Endpoint → Django Model → Database
     ↓              ↓              ↓           ↓
Policy Mgr → POST /api/policies/ → Policy → SQLite
Claims Mgr → POST /api/claims/ → Claim → SQLite  
Regulation → POST /api/regulations/ → Regulation → SQLite
```

### **2. Underwriting Process Flow:**

```
1. User Input (Frontend)
   ├── Applicant ID: "APP-001"
   ├── Policy ID: "POL-2024-001"
   ├── Line of Business: "auto"
   └── Application Data: {
       "age": 22,
       "driving_record": "2 violations",
       "vehicle_type": "sports car",
       ...
   }

2. API Call
   POST /api/underwriting/process_application/
   └── UnderwritingViewSet.process_application()

3. LangGraph Workflow Initialization
   initial_state = {
       "applicant_id": "APP-001",
       "policy_id": "POL-2024-001", 
       "lob": "auto",
       "application_data": {...},
       "current_step": "fetch_context"
   }

4. Workflow Execution:

   Step 1: Data Fetcher Agent
   ├── Query: Policy.objects.filter(policy_id="POL-2024-001")
   ├── Query: Claim.objects.filter(applicant_id="APP-001")
   ├── Query: Regulation.objects.filter(lob="auto")
   └── Output: Raw text data

   Step 2: Embedding Service Agent  
   ├── Chunk texts using tiktoken (500 tokens, 50 overlap)
   ├── Generate embeddings for each chunk
   ├── Add to FAISS index with metadata
   ├── Create search query from application data
   ├── Perform similarity search (k=15)
   └── Output: Relevant context chunks by source

   Step 3: Risk Analyzer Agent
   ├── Construct comprehensive prompt with:
   │   ├── Application data (JSON format)
   │   ├── Policy chunks (top 2)
   │   ├── Claims chunks (top 2)
   │   └── Regulation chunks (top 2)
   ├── Send to Groq LLM (llama-3.1-8b-instant)
   ├── Parse structured response:
   │   ├── Extract RISK SUMMARY section
   │   ├── Extract RED FLAGS (lines starting with -)
   │   └── Extract RECOMMENDATIONS section
   ├── Apply fallback logic if parsing fails
   └── Output: Risk analysis with flags

5. Result Storage
   ├── Create UnderwritingApplication record
   ├── Store all analysis results
   └── Return response to frontend

6. Frontend Display
   ├── Show risk summary
   ├── Display red flags as clickable items
   ├── Show recommendations
   └── Enable flag explanations
```

### **3. Flag Explanation Flow:**

```
1. User clicks red flag → Frontend captures flag text
2. API Call: POST /api/underwriting/explain_flag/
3. LangGraph explain_flag() method
   ├── Construct explanation prompt
   ├── Include selected flag and context
   ├── Send to Groq LLM
   └── Return detailed explanation
4. Frontend displays explanation in modal
```

---

## 🚀 **API Endpoints**

### **Core Endpoints:**

| Endpoint | Method | Purpose | Input | Output |
|----------|---------|---------|-------|--------|
| `/api/policies/` | GET/POST | Manage policies | Policy data | Policy list/created |
| `/api/claims/` | GET/POST | Manage claims | Claim data | Claim list/created |
| `/api/regulations/` | GET/POST | Manage regulations | Regulation data | Regulation list/created |
| `/api/underwriting/process_application/` | POST | Main workflow | Application data | Risk analysis |
| `/api/underwriting/explain_flag/` | POST | Flag explanation | Flag text + app ID | Detailed explanation |
| `/api/underwriting/embeddings/` | POST | Generate embeddings | Text array | Vector embeddings |

### **API Request/Response Examples:**

#### **Process Application:**
```json
// Request
{
  "applicant_id": "APP-001",
  "policy_id": "POL-2024-001",
  "lob": "auto", 
  "application_data": {
    "age": 22,
    "driving_record": "clean",
    "vehicle_type": "sedan"
  }
}

// Response  
{
  "application_id": "uuid-here",
  "risk_summary": "Low to moderate risk assessment...",
  "red_flags": [
    "Young driver (age 22) - higher risk demographic",
    "Limited driving experience"
  ],
  "recommendations": "Standard coverage with monitoring...",
  "status": "completed"
}
```

---

## 🎛️ **Frontend Architecture**

### **React Component Structure:**

```
App.js
├── Header.js (Navigation)
└── UnderwritingDashboard.js
    ├── PolicyManager.js
    │   ├── Add policy form
    │   ├── Policy list display
    │   └── Policy details modal
    ├── ClaimManager.js
    │   ├── Add claim form
    │   ├── Claims list display
    │   └── Claim details modal
    ├── RegulationManager.js
    │   ├── Add regulation form
    │   ├── Regulations list display
    │   └── Regulation details modal
    ├── UnderwritingProcessor.js (Main Interface)
    │   ├── Application form
    │   ├── Processing status
    │   ├── Results display
    │   ├── Red flags with explanations
    │   └── Flag explanation modal
    └── EmbeddingService.js
        ├── Text input form
        ├── Embedding generation
        └── Results display
```

### **State Management:**
- **Local State**: Each component manages its own form data
- **API Communication**: Direct fetch calls to backend
- **Error Handling**: Toast notifications for errors
- **Loading States**: Visual feedback during API calls

---

## 🔧 **Configuration & Environment**

### **Environment Variables:**
```bash
# Backend (.env)
GROQ_API_KEY=your_groq_api_key_here
DJANGO_SECRET_KEY=your_django_secret_key  
DEBUG=True
KMP_DUPLICATE_LIB_OK=TRUE  # For FAISS on macOS

# Frontend (.env)
REACT_APP_API_URL=http://localhost:8000
```

### **Key Dependencies:**

#### **Backend (requirements.txt):**
```
django==5.2.4
djangorestframework==3.16.0
django-cors-headers==4.7.0
langgraph                # Workflow orchestration
langchain-groq           # Groq LLM integration
faiss-cpu               # Vector storage
tiktoken                # Text tokenization
python-dotenv           # Environment variables
numpy                   # Numerical operations
```

#### **Frontend (package.json):**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "@chakra-ui/react": "^2.8.2",  // UI components
    "@emotion/react": "^11.11.1",   // Styling
    "framer-motion": "^10.16.4"     // Animations
  }
}
```

---

## 🧪 **Testing Strategy**

### **Backend Testing:**
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **Workflow Tests**: LangGraph execution testing
- **Mock Testing**: LLM response simulation

### **Frontend Testing:**
- **Component Tests**: React component rendering
- **Integration Tests**: API communication
- **E2E Tests**: Complete user workflows

---

## 🔒 **Security Considerations**

1. **API Key Management**: Groq API key stored in environment variables
2. **CORS Configuration**: Controlled cross-origin requests
3. **Input Validation**: Form data validation on both ends
4. **Error Handling**: Graceful failure without exposing internals

---

## 📈 **Performance Optimizations**

1. **Chunking Strategy**: Optimal chunk size (500 tokens) with overlap
2. **Vector Search**: FAISS L2 index for fast similarity search
3. **Caching**: Component-level state management
4. **Lazy Loading**: On-demand data fetching

---

## 🚀 **Production Considerations**

### **Scalability:**
- **Database**: Migrate from SQLite to PostgreSQL
- **Vector Storage**: Distributed FAISS or Pinecone
- **LLM**: Production Groq API with rate limiting
- **Deployment**: Docker containers with orchestration

### **Monitoring:**
- **Logging**: Structured logging for workflow steps
- **Metrics**: API response times and success rates
- **Alerting**: Error rate monitoring

### **Security:**
- **Authentication**: JWT token-based auth
- **Authorization**: Role-based access control
- **Data Privacy**: PII encryption and anonymization

---

## 🎯 **Key Benefits of This Architecture**

1. **Modularity**: Each agent has a specific responsibility
2. **Scalability**: Easy to add new agents or modify existing ones
3. **Maintainability**: Clear separation of concerns
4. **Extensibility**: Framework supports complex workflows
5. **Observability**: Full workflow state tracking
6. **Reliability**: Robust error handling and fallbacks

This architecture demonstrates how modern agentic AI systems can be built using LangGraph to create intelligent, multi-step workflows that combine the power of Large Language Models with traditional software engineering practices.
