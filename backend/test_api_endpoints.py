#!/usr/bin/env python
"""
Test script for the new underwriting API endpoints

This script demonstrates how to use the new API endpoints:
1. get_application_details
2. list_applications  
3. dashboard_overview
"""

import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8000/api/underwriting"

def test_list_applications():
    """Test the list_applications endpoint"""
    print("Testing list_applications endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/list_applications/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {data['total_count']} applications")
            if data['applications']:
                print(f"   Latest application: {data['applications'][0]['applicant_id']}")
            return data['applications']
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return []
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return []

def test_dashboard_overview():
    """Test the dashboard_overview endpoint"""
    print("\nTesting dashboard_overview endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/dashboard_overview/")
        if response.status_code == 200:
            data = response.json()
            overview = data['overview']
            print(f"✅ Dashboard Overview:")
            print(f"   Total Applications: {overview['total_applications']}")
            print(f"   Pending: {overview['pending_applications']}")
            print(f"   Processed: {overview['processed_applications']}")
            print(f"   Flagged: {overview['flagged_applications_count']}")
            print(f"   High Risk: {overview['high_risk_applications_count']}")
            return data
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return None

def test_application_details(application_id):
    """Test the get_application_details endpoint"""
    print(f"\nTesting get_application_details endpoint for ID: {application_id}")
    try:
        response = requests.get(f"{BASE_URL}/get_application_details/", 
                               params={'application_id': application_id})
        if response.status_code == 200:
            data = response.json()
            details = data['detailed_results']
            print(f"✅ Application Details:")
            print(f"   Applicant ID: {details['applicant_id']}")
            print(f"   Status: {details['status']}")
            print(f"   Red Flags: {details['risk_assessment']['red_flags_count']}")
            print(f"   Related Claims: {details['related_data']['claims_count']}")
            return data
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return None

def main():
    """Main test function"""
    print("🚀 Testing Underwriting API Endpoints")
    print("=" * 50)
    
    # Test list applications
    applications = test_list_applications()
    
    # Test dashboard overview
    dashboard_data = test_dashboard_overview()
    
    # Test application details for the first application if available
    if applications:
        first_app_id = applications[0]['id']
        test_application_details(first_app_id)
    else:
        print("\n⚠️  No applications found to test details endpoint")
    
    print("\n" + "=" * 50)
    print("✅ API testing completed!")

if __name__ == "__main__":
    main()
