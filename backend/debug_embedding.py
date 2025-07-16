"""
Debug script for testing the embedding service

This script tests the EmbeddingService in isolation to verify:
1. The singleton pattern works correctly
2. Adding documents creates chunks and embeddings
3. The search functionality correctly retrieves documents
4. Persistence of the index across multiple calls
"""

import os
import sys
import django
import logging

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'item_api.settings')
django.setup()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from underwriting.services import get_embedding_service, EmbeddingService

def test_embedding_service():
    # Test singleton pattern
    service1 = get_embedding_service()
    service2 = get_embedding_service()
    
    assert id(service1) == id(service2), "Singleton pattern not working!"
    
    logger.info("Singleton pattern verified - both instances have the same ID")
    
    # Test with some sample documents
    policy_text = """
    Insurance Policy XYZ-123
    Coverage: $500,000 for property damage
    Exclusions: 
    - Damage due to natural disasters
    - Intentional damage by the insured
    - Wear and tear
    
    Terms and Conditions:
    This policy is valid for 12 months from the date of issuance.
    Claims must be filed within 30 days of the incident.
    """
    
    claims_text = """
    Claim History for Applicant 12345
    2022-01-15: Filed claim for water damage, amount $12,000
    2021-05-20: Filed claim for broken window, amount $800
    2020-11-05: Filed claim for theft, amount $5,500
    
    All claims were processed and approved.
    """
    
    regulations_text = """
    Insurance Regulations for Home Insurance
    1. All policies must include coverage for fire damage
    2. Insurers must respond to claims within 14 days
    3. Policy cancellations require 30 days notice
    4. Annual inspections may be required for properties over 50 years old
    """
    
    # Add documents to index
    logger.info("Adding test documents to index...")
    service1.add_to_index([policy_text], "policy", "XYZ-123")
    service1.add_to_index([claims_text], "claims", "12345")
    service1.add_to_index([regulations_text], "regulations", "home")
    
    # Check index stats
    stats = service1.get_stats()
    logger.info(f"Index stats after adding documents: {stats}")
    
    # Test searching
    logger.info("\nPerforming test searches...")
    
    # Test query 1
    query1 = "What's covered for water damage?"
    results1 = service1.search(query1, k=5)
    logger.info(f"Query: '{query1}'")
    logger.info(f"Found {len(results1)} results")
    for i, result in enumerate(results1):
        logger.info(f"Result {i+1}: Source={result['source']}, Distance={result['distance']:.4f}")
        logger.info(f"Text snippet: {result['text'][:100]}...")
    
    # Test query 2
    query2 = "Has the applicant filed claims for theft?"
    results2 = service1.search(query2, k=5)
    logger.info(f"\nQuery: '{query2}'")
    logger.info(f"Found {len(results2)} results")
    for i, result in enumerate(results2):
        logger.info(f"Result {i+1}: Source={result['source']}, Distance={result['distance']:.4f}")
        logger.info(f"Text snippet: {result['text'][:100]}...")
    
    # Test query 3
    query3 = "What are the regulations for policy cancellation?"
    results3 = service1.search(query3, k=5)
    logger.info(f"\nQuery: '{query3}'")
    logger.info(f"Found {len(results3)} results")
    for i, result in enumerate(results3):
        logger.info(f"Result {i+1}: Source={result['source']}, Distance={result['distance']:.4f}")
        logger.info(f"Text snippet: {result['text'][:100]}...")
        
    # Get instance again to verify persistence
    service3 = get_embedding_service()
    stats_again = service3.get_stats()
    logger.info(f"\nStats after getting service again: {stats_again}")
    assert stats_again["total_vectors"] > 0, "Index not persistent!"
    
    logger.info("Embedding service test complete!")

if __name__ == "__main__":
    logger.info("Starting embedding service test...")
    test_embedding_service()
