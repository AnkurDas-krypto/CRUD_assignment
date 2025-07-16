"""
Debug script to test the embedding service separately from the workflow
"""

import os
import sys
import django
import logging
import json

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'item_api.settings')
django.setup()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from underwriting.services import get_embedding_service
from underwriting.models import Policy, Claim, Regulation

def run_embedding_test():
    """Test the embedding service directly"""
    # Get embedding service singleton
    embedding_service = get_embedding_service()
    
    # Print initial stats
    stats = embedding_service.get_stats()
    logger.info(f"Initial embedding service stats: {json.dumps(stats, indent=2)}")
    
    # Get some test data
    policy = Policy.objects.filter(policy_id="P12345").first()
    claims = Claim.objects.filter(applicant_id="A9876")
    regulations = Regulation.objects.filter(lob="home")
    
    # Print data summary
    logger.info(f"Test data: Policy={policy is not None}, Claims={claims.count()}, Regulations={regulations.count()}")
    
    # Test adding policy to index
    if policy:
        policy_text = policy.text
        logger.info(f"Adding policy text ({len(policy_text)} chars) to index...")
        added = embedding_service.add_to_index([policy_text], "policy", policy.policy_id)
        logger.info(f"Added {added} policy chunks to index")
        
        # Get updated stats
        stats = embedding_service.get_stats()
        logger.info(f"Stats after adding policy: {json.dumps(stats, indent=2)}")
        
    # Test adding claims to index
    if claims.exists():
        claims_text = " ".join([claim.text for claim in claims])
        logger.info(f"Adding claims text ({len(claims_text)} chars) to index...")
        added = embedding_service.add_to_index([claims_text], "claims", "A9876")
        logger.info(f"Added {added} claims chunks to index")
        
        # Get updated stats
        stats = embedding_service.get_stats()
        logger.info(f"Stats after adding claims: {json.dumps(stats, indent=2)}")
    
    # Test adding regulations to index
    if regulations.exists():
        regulations_text = " ".join([reg.text for reg in regulations])
        logger.info(f"Adding regulations text ({len(regulations_text)} chars) to index...")
        added = embedding_service.add_to_index([regulations_text], "regulations", "home")
        logger.info(f"Added {added} regulations chunks to index")
        
        # Get updated stats
        stats = embedding_service.get_stats()
        logger.info(f"Stats after adding regulations: {json.dumps(stats, indent=2)}")
    
    # Test search functionality
    query = "Application for Home Insurance coverage amount $750,000"
    logger.info(f"Searching for: '{query}'")
    results = embedding_service.search(query, k=10)
    
    # Print search results
    logger.info(f"Search returned {len(results)} results")
    for i, result in enumerate(results):
        logger.info(f"Result {i+1}: Source={result['source']}, Distance={result['distance']:.4f}")
        logger.info(f"Text: {result['text'][:100]}...")

if __name__ == "__main__":
    logger.info("Starting direct embedding service test...")
    run_embedding_test()
    logger.info("Test complete.")
