import os
import faiss
import numpy as np
import tiktoken
from typing import List, Dict, Any, Tuple, Optional
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END, MessagesState
from datetime import datetime
import json
import requests
import logging
from .models import Policy, Claim, Regulation

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class UnderwritingState(MessagesState):
    """State for the underwriting workflow"""
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


# Global instance for singleton pattern
_EMBEDDING_SERVICE_INSTANCE = None

def get_embedding_service():
    """Get or create the singleton EmbeddingService instance"""
    global _EMBEDDING_SERVICE_INSTANCE
    if _EMBEDDING_SERVICE_INSTANCE is None:
        _EMBEDDING_SERVICE_INSTANCE = EmbeddingService()
        logger.info("Created new EmbeddingService singleton instance")
    return _EMBEDDING_SERVICE_INSTANCE


class EmbeddingService:
    """Service for handling text embeddings and vector storage"""
    
    def __init__(self):
        """Initialize the embedding service with a FAISS index"""
        self.dimension = 1536  # Standard embedding dimension for large language models
        self.index = faiss.IndexFlatL2(self.dimension)
        self.chunk_metadata = []
        self.encoding = tiktoken.get_encoding("gpt2")
        logger.info(f"EmbeddingService initialized with {self.dimension}-dimensional FAISS index")
    
    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Split text into overlapping chunks by tokens"""
        if not text or not text.strip():
            return []
            
        tokens = self.encoding.encode(text)
        chunks = []
        
        # If text is very small, return as a single chunk
        if len(tokens) <= chunk_size:
            return [text]
            
        # Create overlapping chunks
        for i in range(0, len(tokens), chunk_size - overlap):
            chunk = self.encoding.decode(tokens[i:i + chunk_size])
            chunks.append(chunk)
            
        logger.info(f"Chunked text into {len(chunks)} chunks (avg {len(text)/len(chunks):.1f} chars/chunk)")
        return chunks
    
    def get_embeddings(self, texts: List[str]) -> np.ndarray:
        """Get embeddings for text chunks - uses deterministic mock embeddings for testing"""
        # In a real implementation, this would call an embedding API
        embeddings = []
        
        for text in texts:
            if not text or not text.strip():
                # For empty text, create a zero vector
                embeddings.append(np.zeros(self.dimension))
                continue
                
            # Create a deterministic embedding based on text hash
            # This won't give good similarity results but ensures consistency for testing
            text_hash = hash(text) % 100000
            np.random.seed(text_hash)
            embedding = np.random.rand(self.dimension)
            # Normalize the vector for better search results
            embedding = embedding / np.linalg.norm(embedding)
            embeddings.append(embedding)
        
        return np.array(embeddings, dtype=np.float32)
    
    def add_to_index(self, texts: List[str], source: str, doc_id: str) -> int:
        """Add text chunks to FAISS index and return number of chunks added"""
        if not texts:
            logger.warning(f"No texts provided for source: {source}, doc_id: {doc_id}")
            return 0
            
        # Chunk all texts
        all_chunks = []
        for text in texts:
            if not text or not isinstance(text, str):
                continue
            chunks = self.chunk_text(text)
            all_chunks.extend(chunks)
        
        if not all_chunks:
            logger.warning(f"No valid chunks created for source: {source}, doc_id: {doc_id}")
            return 0
            
        # Generate embeddings for all chunks
        start_idx = len(self.chunk_metadata)  # Track where these chunks start in the metadata list
        embeddings_array = self.get_embeddings(all_chunks)
        
        # Add embeddings to FAISS index
        try:
            self.index.add(embeddings_array)
            logger.info(f"Added {len(all_chunks)} chunks to index for {source} {doc_id}")
        except Exception as e:
            logger.error(f"Error adding to FAISS index: {str(e)}")
            return 0
        
        # Store metadata for each chunk
        for i, chunk in enumerate(all_chunks):
            self.chunk_metadata.append({
                'source': source,
                'doc_id': doc_id,
                'chunk_index': i,
                'text': chunk
            })
        
        logger.info(f"Index now contains {self.index.ntotal} vectors, {len(self.chunk_metadata)} chunks with metadata")
        return len(all_chunks)
    
    def search(self, query: str, k: int = 5) -> List[Dict]:
        """Search for relevant chunks using the query"""
        if not query or not query.strip():
            logger.warning("Empty query provided for search")
            return []
            
        if self.index.ntotal == 0:
            logger.warning("Search called on empty FAISS index")
            return []
        
        # Limit k to the number of vectors we have
        k = min(k, self.index.ntotal)
        
        # Get embedding for query
        query_embedding = self.get_embeddings([query])[0].reshape(1, -1)
        
        try:
            # Search the index
            distances, indices = self.index.search(query_embedding, k)
            
            # Process search results
            results = []
            for i, idx in enumerate(indices[0]):
                if idx >= 0 and idx < len(self.chunk_metadata):
                    result = self.chunk_metadata[idx].copy()
                    result['distance'] = float(distances[0][i])
                    results.append(result)
            
            logger.info(f"Search for '{query[:30]}...' returned {len(results)} results")
            return results
        except Exception as e:
            logger.error(f"Error searching FAISS index: {str(e)}")
            return []
            
    def get_stats(self) -> Dict:
        """Return statistics about the embedding service"""
        sources = {}
        for chunk in self.chunk_metadata:
            source = chunk['source']
            if source not in sources:
                sources[source] = 0
            sources[source] += 1
            
        return {
            "total_vectors": self.index.ntotal,
            "total_chunks": len(self.chunk_metadata),
            "chunks_by_source": sources,
            "dimension": self.dimension
        }
    

class UnderwritingWorkflow:
    """Main underwriting workflow using LangGraph"""
    
    def __init__(self):
        self.llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.1)
        self.embedding_service = get_embedding_service()
        self.workflow = self._build_workflow()
    
    def fetch_context_data(self, state: UnderwritingState) -> Dict:
        """Fetch context data from databases"""
        try:
            # Log the state received
            applicant_id = state.get("applicant_id", "")
            policy_id = state.get("policy_id", "")
            lob = state.get("lob", "")
            
            logger.info(f"Fetching data for applicant={applicant_id}, policy={policy_id}, lob={lob}")
            
            # Fetch policy data
            policy = Policy.objects.filter(policy_id=policy_id).first()
            if policy:
                policy_text = policy.text
                logger.info(f"Found policy {policy_id}: {len(policy_text)} chars")
            else:
                policy_text = ""
                logger.warning(f"No policy found with ID {policy_id}")
            
            # Fetch claims data
            claims = Claim.objects.filter(applicant_id=applicant_id)
            if claims.exists():
                claims_text = " ".join([claim.text for claim in claims])
                logger.info(f"Found {claims.count()} claims for applicant {applicant_id}: {len(claims_text)} chars")
            else:
                claims_text = ""
                logger.warning(f"No claims found for applicant {applicant_id}")
            
            # Fetch regulations data
            regulations = Regulation.objects.filter(lob=lob)
            if regulations.exists():
                regulations_text = " ".join([reg.text for reg in regulations])
                logger.info(f"Found {regulations.count()} regulations for LOB {lob}: {len(regulations_text)} chars")
            else:
                regulations_text = ""
                logger.warning(f"No regulations found for LOB {lob}")
            
            return {
                "messages": [AIMessage(content=f"📋 Data Fetcher: Retrieved policy ({len(policy_text)} chars), {claims.count()} claims, and {regulations.count()} regulations")],
                "policy_text": policy_text,
                "claims_text": claims_text,
                "regulations_text": regulations_text,
                "current_step": "embed_and_retrieve"
            }
        except Exception as e:
            logger.error(f"Error fetching context data: {str(e)}", exc_info=True)
            return {
                "messages": [AIMessage(content=f"❌ Data Fetcher: Error fetching data - {str(e)}")],
                "current_step": "error"
            }
    
    def embed_and_retrieve(self, state: UnderwritingState) -> Dict:
        """Chunk texts and retrieve relevant context using the embedding service"""
        try:
            # Extract data from state
            applicant_id = state.get("applicant_id", "")
            policy_id = state.get("policy_id", "")
            lob = state.get("lob", "")
            application_data = state.get("application_data", {})
            policy_text = state.get("policy_text", "")
            claims_text = state.get("claims_text", "")
            regulations_text = state.get("regulations_text", "")
            
            logger.info(f"Processing application for applicant {applicant_id}, policy {policy_id}, LOB {lob}")
            
            # Get or create embedding service from the singleton
            embedding_service = get_embedding_service()
            
            # Show stats before adding new content
            before_stats = embedding_service.get_stats()
            logger.info(f"Embedding service before adding new content: {before_stats}")
            
            # Create comprehensive search query from application data
            coverage_type = application_data.get('coverage_type', '')
            coverage_amount = application_data.get('coverage_amount', '')
            other_fields = ', '.join([f"{k}: {v}" for k, v in application_data.items() 
                                      if k not in ['coverage_type', 'coverage_amount']])
            
            query = f"Application for {coverage_type} coverage amount {coverage_amount}. {other_fields}"
            logger.info(f"Search query created: {query[:100]}...")
            
            # Add documents to index with detailed logging
            chunks_added = 0
            if policy_text:
                added = embedding_service.add_to_index([policy_text], "policy", policy_id)
                logger.info(f"Added {added} policy chunks to index")
                chunks_added += added
            
            if claims_text:
                added = embedding_service.add_to_index([claims_text], "claims", applicant_id)
                logger.info(f"Added {added} claims chunks to index")
                chunks_added += added
            
            if regulations_text:
                added = embedding_service.add_to_index([regulations_text], "regulations", lob)
                logger.info(f"Added {added} regulations chunks to index")
                chunks_added += added
            
            # Search for relevant chunks
            logger.info(f"Searching for relevant chunks with query: {query[:50]}...")
            relevant_chunks = embedding_service.search(query, k=15)
            logger.info(f"Search returned {len(relevant_chunks)} chunks")
            
            # Separate chunks by source
            policy_chunks = [chunk['text'] for chunk in relevant_chunks if chunk['source'] == 'policy'][:5]
            claims_chunks = [chunk['text'] for chunk in relevant_chunks if chunk['source'] == 'claims'][:5]
            regulations_chunks = [chunk['text'] for chunk in relevant_chunks if chunk['source'] == 'regulations'][:5]
            
            # Log the results
            logger.info(f"Found {len(policy_chunks)} policy chunks, {len(claims_chunks)} claims chunks, {len(regulations_chunks)} regulation chunks")
            
            # Show stats after processing
            after_stats = embedding_service.get_stats()
            logger.info(f"Embedding service after processing: {after_stats}")
            
            message = f"🔍 Embedding Service: Added {chunks_added} chunks and retrieved {len(relevant_chunks)} relevant chunks"
            if not relevant_chunks:
                message += " (WARNING: No relevant chunks found - similarity search may not be working correctly)"
            
            return {
                "messages": [AIMessage(content=message)],
                "policy_chunks": policy_chunks,
                "claims_chunks": claims_chunks,
                "regulations_chunks": regulations_chunks,
                "current_step": "summarize_risk"
            }
        except Exception as e:
            logger.error(f"Error in embed_and_retrieve: {str(e)}", exc_info=True)
            return {
                "messages": [AIMessage(content=f"❌ Embedding Service: Error - {str(e)}")],
                "current_step": "error"
            }
    
    def summarize_risk(self, state: UnderwritingState) -> Dict:
        """Generate risk summary using LLM"""
        try:
            application_data = state.get("application_data", {})
            policy_chunks = state.get("policy_chunks", [])
            claims_chunks = state.get("claims_chunks", [])
            regulations_chunks = state.get("regulations_chunks", [])
            
            # Create a comprehensive analysis prompt
            context_str = ""
            if policy_chunks:
                context_str += f"Policy Context: {' '.join(policy_chunks[:2])}\n"
            if claims_chunks:
                context_str += f"Claims History: {' '.join(claims_chunks[:2])}\n"
            if regulations_chunks:
                context_str += f"Regulations: {' '.join(regulations_chunks[:2])}\n"
            
            prompt = f"""As an insurance underwriting expert, analyze this application and identify specific risk factors:

APPLICATION DATA:
{json.dumps(application_data, indent=2)}

CONTEXT:
{context_str}

Please provide your analysis in the following format:

RISK SUMMARY: [Provide a clear assessment of the overall risk level]

RED FLAGS:
- [Specific concern 1 with brief explanation]
- [Specific concern 2 with brief explanation] 
- [Additional concerns if any]

RECOMMENDATIONS: [Coverage recommendations and risk mitigation suggestions]

Focus on concrete, actionable risk factors based on the application data."""
            
            response = self.llm.invoke([HumanMessage(content=prompt)])
            
            # Parse the structured response
            content = response.content
            
            # Extract sections using simple text parsing
            risk_summary = ""
            red_flags = []
            recommendations = ""
            
            # Extract risk summary
            if "RISK SUMMARY:" in content:
                risk_start = content.find("RISK SUMMARY:") + len("RISK SUMMARY:")
                risk_end = content.find("RED FLAGS:", risk_start)
                if risk_end == -1:
                    risk_end = content.find("RECOMMENDATIONS:", risk_start)
                if risk_end != -1:
                    risk_summary = content[risk_start:risk_end].strip()
                else:
                    risk_summary = content[risk_start:].strip()
            
            # Extract red flags
            if "RED FLAGS:" in content:
                flags_start = content.find("RED FLAGS:") + len("RED FLAGS:")
                flags_end = content.find("RECOMMENDATIONS:", flags_start)
                if flags_end != -1:
                    flags_section = content[flags_start:flags_end].strip()
                else:
                    flags_section = content[flags_start:].strip()
                
                # Parse individual flags (lines starting with -)
                for line in flags_section.split('\n'):
                    line = line.strip()
                    if line.startswith('-'):
                        flag = line[1:].strip()
                        if flag:
                            red_flags.append(flag)
            
            # Extract recommendations
            if "RECOMMENDATIONS:" in content:
                rec_start = content.find("RECOMMENDATIONS:") + len("RECOMMENDATIONS:")
                recommendations = content[rec_start:].strip()
            
            # Fallback if parsing fails
            if not risk_summary:
                risk_summary = content[:200] + "..." if len(content) > 200 else content
            
            if not red_flags:
                # Try to extract some meaningful flags from the application data
                app_age = application_data.get("age")
                driving_record = application_data.get("driving_record", "")
                previous_claims = application_data.get("previous_claims", "")
                
                if app_age and app_age < 30:
                    red_flags.append(f"Young driver (age {app_age}) - higher risk demographic")
                
                if "accident" in driving_record.lower() or "violation" in driving_record.lower():
                    red_flags.append(f"Driving record concerns: {driving_record}")
                
                if previous_claims and previous_claims.lower() not in ["none", "no claims", "no previous claims"]:
                    red_flags.append(f"Previous claims history: {previous_claims}")
                
                if not red_flags:
                    red_flags.append("Standard underwriting review required")
            
            if not recommendations:
                recommendations = "Standard coverage approval recommended with regular review"
            
            return {
                "messages": [AIMessage(content="📊 Risk Analyzer: Completed risk analysis")],
                "risk_summary": risk_summary,
                "red_flags": red_flags,
                "recommendations": recommendations,
                "current_step": "complete",
                "task_complete": True
            }
        except Exception as e:
            return {
                "messages": [AIMessage(content=f"❌ Risk Analyzer: Error - {str(e)}")],
                "current_step": "error"
            }
    
    def explain_flag(self, state: UnderwritingState, selected_flag: str) -> Dict:
        """Provide detailed explanation for a selected flag"""
        try:
            prompt = f"""The underwriter selected this flag for explanation:
{selected_flag}

Based on the application context and relevant chunks, provide a detailed explanation with citations and specific reasoning.

Include:
1. Why this is a concern
2. Specific data points that triggered this flag
3. Recommended actions
4. Risk mitigation strategies"""
            
            response = self.llm.invoke([HumanMessage(content=prompt)])
            
            return {
                "messages": [AIMessage(content="📝 Explanation Generator: Detailed explanation provided")],
                "explanation": response.content
            }
        except Exception as e:
            return {
                "messages": [AIMessage(content=f"❌ Explanation Generator: Error - {str(e)}")],
                "explanation": f"Error generating explanation: {str(e)}"
            }
    
    def router(self, state: UnderwritingState) -> str:
        """Route to next step based on current state"""
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
    
    def _build_workflow(self):
        """Build the LangGraph workflow"""
        workflow = StateGraph(UnderwritingState)
        
        # Add nodes
        workflow.add_node("fetch_context", self.fetch_context_data)
        workflow.add_node("embed_and_retrieve", self.embed_and_retrieve)
        workflow.add_node("summarize_risk", self.summarize_risk)
        
        # Set entry point
        workflow.set_entry_point("fetch_context")
        
        # Add conditional edges
        workflow.add_conditional_edges(
            "fetch_context",
            self.router,
            {
                "fetch_context": "fetch_context",
                "embed_and_retrieve": "embed_and_retrieve",
                END: END
            }
        )
        
        workflow.add_conditional_edges(
            "embed_and_retrieve",
            self.router,
            {
                "summarize_risk": "summarize_risk",
                END: END
            }
        )
        
        workflow.add_conditional_edges(
            "summarize_risk",
            self.router,
            {
                END: END
            }
        )
        
        return workflow.compile()
    
    def process_application(self, applicant_id: str, policy_id: str, lob: str, application_data: Dict) -> Dict:
        """Process an underwriting application"""
        # Create initial state dictionary
        initial_state = {
            "applicant_id": applicant_id,
            "policy_id": policy_id,
            "lob": lob,
            "application_data": application_data,
            "current_step": "fetch_context",
            "messages": []
        }
        
        # Debug the workflow execution
        logger.info(f"Starting workflow with initial state: applicant={applicant_id}, policy={policy_id}, lob={lob}")
        
        # Since we're using the singleton embedding service, let's try adding the content directly here
        # This is a workaround to ensure the embedding service has data
        try:
            # Get embedding service singleton
            embedding_service = get_embedding_service()
            
            # Direct database access to get the data
            policy = Policy.objects.filter(policy_id=policy_id).first()
            claims = Claim.objects.filter(applicant_id=applicant_id)
            regulations = Regulation.objects.filter(lob=lob)
            
            # Add texts to index directly
            if policy:
                embedding_service.add_to_index([policy.text], "policy", policy_id)
                logger.info(f"Directly added policy text to index (policy_id={policy_id})")
                
            if claims.exists():
                claims_text = " ".join([claim.text for claim in claims])
                embedding_service.add_to_index([claims_text], "claims", applicant_id)
                logger.info(f"Directly added claims text to index (applicant_id={applicant_id})")
                
            if regulations.exists():
                regulations_text = " ".join([reg.text for reg in regulations])
                embedding_service.add_to_index([regulations_text], "regulations", lob)
                logger.info(f"Directly added regulations text to index (lob={lob})")
            
        except Exception as e:
            logger.error(f"Error pre-populating embedding service: {str(e)}")
        
        # Now run the workflow
        result = self.workflow.invoke(initial_state)
        
        # Log the final embedding service state
        try:
            stats = embedding_service.get_stats()
            logger.info(f"Final embedding service stats: {stats}")
        except Exception as e:
            logger.error(f"Error getting final embedding stats: {str(e)}")
            
        return result
