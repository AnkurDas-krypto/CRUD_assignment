"""
Test script for the underwriting workflow
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

from underwriting.services import UnderwritingWorkflow, get_embedding_service
from underwriting.models import Policy, Claim, Regulation

def setup_test_data():
    """Set up test data for the underwriting workflow"""
    # Create a test policy
    policy, created = Policy.objects.get_or_create(
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
    
    # Create test claims
    claim1, created = Claim.objects.get_or_create(
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
    
    claim2, created = Claim.objects.get_or_create(
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
    
    # Create test regulations
    reg, created = Regulation.objects.get_or_create(
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
    
    logger.info(f"Test data setup complete. Created: Policy={policy.policy_id}, Claims={claim1.claim_id},{claim2.claim_id}, Regulation={reg.lob}")
    
    return {
        "policy_id": policy.policy_id,
        "applicant_id": claim1.applicant_id,
        "lob": reg.lob
    }

def test_workflow():
    """Test the underwriting workflow"""
    # Set up test data
    data = setup_test_data()
    
    # Application data
    application_data = {
        "coverage_type": "Home Insurance",
        "coverage_amount": "$750,000",
        "property_age": "45 years",
        "property_type": "Single family home",
        "applicant_credit_score": "720",
        "previous_claims": "2",
        "security_system": "Yes"
    }
    
    # Initialize the workflow
    workflow = UnderwritingWorkflow()
    
    # Print embedding service stats before
    embedding_service = get_embedding_service()
    before_stats = embedding_service.get_stats()
    logger.info(f"Embedding service stats before workflow: {json.dumps(before_stats, indent=2)}")
    
    # Run the workflow
    logger.info(f"Running underwriting workflow for application: {json.dumps(application_data, indent=2)}")
    result = workflow.process_application(
        applicant_id=data["applicant_id"],
        policy_id=data["policy_id"],
        lob=data["lob"],
        application_data=application_data
    )
    
    # Print embedding service stats after
    after_stats = embedding_service.get_stats()
    logger.info(f"Embedding service stats after workflow: {json.dumps(after_stats, indent=2)}")
    
    # Add debugging prints
    logger.info("\n--- DEBUGGING DATA ACCESS ---")
    
    # Check if we can get the policy data directly
    policy = Policy.objects.filter(policy_id=data["policy_id"]).first()
    logger.info(f"Direct policy access: {policy is not None}")
    if policy:
        logger.info(f"Policy text preview: {policy.text[:100]}...")
    
    # Check claims
    claims = Claim.objects.filter(applicant_id=data["applicant_id"])
    logger.info(f"Claims count: {claims.count()}")
    for claim in claims:
        logger.info(f"Claim {claim.claim_id} preview: {claim.text[:50]}...")
    
    # Check regulations
    regulations = Regulation.objects.filter(lob=data["lob"])
    logger.info(f"Regulations count: {regulations.count()}")
    for reg in regulations:
        logger.info(f"Regulation {reg.regulation_id} preview: {reg.text[:50]}...")
    
    # Log the result
    logger.info("\n--- WORKFLOW RESULT ---")
    logger.info(f"Risk Summary: {result.get('risk_summary', 'No risk summary available')}")
    logger.info(f"Red Flags: {json.dumps(result.get('red_flags', []), indent=2)}")
    logger.info(f"Recommendations: {result.get('recommendations', 'No recommendations available')}")
    
    # Log messages
    logger.info("\n--- WORKFLOW MESSAGES ---")
    for i, msg in enumerate(result.get("messages", [])):
        logger.info(f"Message {i+1}: {msg.content}")

if __name__ == "__main__":
    logger.info("Starting underwriting workflow test...")
    test_workflow()
    logger.info("Underwriting workflow test complete.")
