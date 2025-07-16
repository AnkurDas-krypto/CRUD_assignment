"""
Test the complete underwriting workflow with different applicants
"""

import os
import sys
import django
import logging
import json
import uuid
from datetime import datetime

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'item_api.settings')
django.setup()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from underwriting.services import get_embedding_service, UnderwritingWorkflow
from underwriting.models import Policy, Claim, Regulation

def setup_data():
    """Set up multiple test applicants and policies"""
    # Create policies
    policy1, _ = Policy.objects.get_or_create(
        policy_id="P12345",
        defaults={
            "text": """
            Insurance Policy P12345 - Standard Home Coverage
            
            Coverage:
            - $500,000 for property damage
            - $300,000 for liability
            - $50,000 for personal property
            
            Exclusions:
            - Damage due to natural disasters not explicitly covered
            - Intentional damage by the insured
            - Wear and tear
            - Pre-existing conditions
            
            Claims Process:
            1. Report within 30 days of incident
            2. Provide documentation and evidence
            3. Claims will be processed within 14 business days
            
            This policy is valid for 12 months from the date of issuance.
            """
        }
    )
    
    policy2, _ = Policy.objects.get_or_create(
        policy_id="P67890",
        defaults={
            "text": """
            Insurance Policy P67890 - Premium Auto Coverage
            
            Coverage:
            - $100,000 for bodily injury per person
            - $300,000 for bodily injury per accident
            - $50,000 for property damage
            - Comprehensive and collision with $500 deductible
            
            Exclusions:
            - Racing or other competitive activities
            - Using vehicle for commercial purposes
            - Damage caused while under influence of substances
            - Intentional damage
            
            Claims Process:
            1. Report within 24 hours of incident
            2. Provide police report if applicable
            3. Take vehicle to approved repair shop
            4. Claims will be processed within 7 business days
            
            This policy is valid for 6 months from the date of issuance.
            """
        }
    )
    
    # Create claims
    claim1, _ = Claim.objects.get_or_create(
        claim_id="C001",
        defaults={
            "applicant_id": "A9876",
            "text": """
            Claim C001 - Filed on 2023-05-15
            Applicant: A9876
            Amount: $12,000
            Reason: Water damage from burst pipe
            Status: Approved and paid
            """
        }
    )
    
    claim2, _ = Claim.objects.get_or_create(
        claim_id="C002",
        defaults={
            "applicant_id": "A9876",
            "text": """
            Claim C002 - Filed on 2022-11-20
            Applicant: A9876
            Amount: $5,500
            Reason: Theft of personal items
            Status: Approved and paid
            """
        }
    )
    
    claim3, _ = Claim.objects.get_or_create(
        claim_id="C003",
        defaults={
            "applicant_id": "A5432",
            "text": """
            Claim C003 - Filed on 2024-02-10
            Applicant: A5432
            Amount: $8,200
            Reason: Minor accident, collision with another vehicle
            Status: Approved and paid
            """
        }
    )
    
    # Create regulations
    reg1, _ = Regulation.objects.get_or_create(
        regulation_id="R001",
        defaults={
            "lob": "home",
            "text": """
            Home Insurance Regulations 2023
            
            1. All policies must include coverage for fire damage
            2. Insurers must respond to claims within 14 days
            3. Policy cancellations require 30 days notice
            4. Annual inspections may be required for properties over 50 years old
            5. Coverage for water damage must be explicitly stated
            6. Claims history may affect premium rates
            7. Deductibles must be clearly specified
            """
        }
    )
    
    reg2, _ = Regulation.objects.get_or_create(
        regulation_id="R002",
        defaults={
            "lob": "auto",
            "text": """
            Auto Insurance Regulations 2023
            
            1. Minimum liability coverage requirements:
               - $25,000 for bodily injury per person
               - $50,000 for bodily injury per accident
               - $25,000 for property damage
            2. Insurers must report all accidents to DMV within 30 days
            3. Premium increases due to accidents are capped at 25%
            4. Young drivers (under 25) may be subject to higher premiums
            5. Discounts must be offered for safe driving records
            6. DUI incidents may result in policy cancellation
            """
        }
    )
    
    return {
        "policies": [policy1, policy2],
        "claims": [claim1, claim2, claim3],
        "regulations": [reg1, reg2]
    }

def run_multiple_tests():
    """Run multiple test cases through the workflow"""
    # Set up test data
    data = setup_data()
    logger.info(f"Test data setup complete. Created: {len(data['policies'])} policies, {len(data['claims'])} claims, {len(data['regulations'])} regulations")
    
    # Create workflow
    workflow = UnderwritingWorkflow()
    
    # Test Case 1: Home Insurance Application
    application1 = {
        "applicant_id": "A9876",
        "policy_id": "P12345",
        "lob": "home",
        "application_data": {
            "coverage_type": "Home Insurance",
            "coverage_amount": "$750,000",
            "property_age": "45 years",
            "property_type": "Single family home",
            "applicant_credit_score": "720",
            "previous_claims": "2",
            "security_system": "Yes"
        }
    }
    
    # Test Case 2: Auto Insurance Application
    application2 = {
        "applicant_id": "A5432",
        "policy_id": "P67890",
        "lob": "auto",
        "application_data": {
            "coverage_type": "Auto Insurance",
            "coverage_amount": "$300,000",
            "vehicle_age": "3 years",
            "vehicle_make": "Toyota",
            "vehicle_model": "Camry",
            "applicant_credit_score": "680",
            "previous_claims": "1",
            "driving_record": "Clean for past 5 years"
        }
    }
    
    # Run test case 1
    logger.info("\n========== TEST CASE 1: HOME INSURANCE ==========")
    logger.info(f"Running underwriting workflow for home insurance application: {json.dumps(application1['application_data'], indent=2)}")
    
    # Get embedding service stats before
    embedding_service = get_embedding_service()
    stats_before_1 = embedding_service.get_stats()
    logger.info(f"Embedding service stats before test 1: {json.dumps(stats_before_1, indent=2)}")
    
    # Run workflow
    result1 = workflow.process_application(
        application1["applicant_id"],
        application1["policy_id"],
        application1["lob"],
        application1["application_data"]
    )
    
    # Get stats after
    stats_after_1 = embedding_service.get_stats()
    logger.info(f"Embedding service stats after test 1: {json.dumps(stats_after_1, indent=2)}")
    
    # Log results
    logger.info("\n--- TEST CASE 1 RESULTS ---")
    logger.info(f"Risk Summary: {result1.get('risk_summary', 'No risk summary available')}")
    logger.info(f"Red Flags: {json.dumps(result1.get('red_flags', []), indent=2)}")
    logger.info(f"Recommendations: {result1.get('recommendations', 'No recommendations available')}")
    
    # Run test case 2
    logger.info("\n========== TEST CASE 2: AUTO INSURANCE ==========")
    logger.info(f"Running underwriting workflow for auto insurance application: {json.dumps(application2['application_data'], indent=2)}")
    
    # Get embedding service stats before
    stats_before_2 = embedding_service.get_stats()
    logger.info(f"Embedding service stats before test 2: {json.dumps(stats_before_2, indent=2)}")
    
    # Run workflow
    result2 = workflow.process_application(
        application2["applicant_id"],
        application2["policy_id"],
        application2["lob"],
        application2["application_data"]
    )
    
    # Get stats after
    stats_after_2 = embedding_service.get_stats()
    logger.info(f"Embedding service stats after test 2: {json.dumps(stats_after_2, indent=2)}")
    
    # Log results
    logger.info("\n--- TEST CASE 2 RESULTS ---")
    logger.info(f"Risk Summary: {result2.get('risk_summary', 'No risk summary available')}")
    logger.info(f"Red Flags: {json.dumps(result2.get('red_flags', []), indent=2)}")
    logger.info(f"Recommendations: {result2.get('recommendations', 'No recommendations available')}")
    
    # Verify that embedding data persisted between runs
    logger.info("\n========== PERSISTENCE VERIFICATION ==========")
    vectors_added = stats_after_2["total_vectors"] - stats_before_1["total_vectors"]
    logger.info(f"Total vectors added during tests: {vectors_added}")
    
    # Run a direct search to verify both sets of data are accessible
    query = "Claims history for applicants"
    logger.info(f"Running direct search for: '{query}'")
    search_results = embedding_service.search(query, k=6)  # Get all chunks from both test cases
    
    # Print search results by source
    logger.info(f"Search returned {len(search_results)} results:")
    for i, result in enumerate(search_results):
        logger.info(f"Result {i+1}: Source={result['source']}, Doc={result['doc_id']}")
        logger.info(f"  Preview: {result['text'][:80]}...")

if __name__ == "__main__":
    logger.info("Starting comprehensive underwriting workflow test...")
    run_multiple_tests()
    logger.info("Test complete.")
