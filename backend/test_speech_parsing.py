#!/usr/bin/env python3

# Test script for speech parsing logic
import sys
import os

# Add the Django project to the path
sys.path.append('/Users/ankurdas/Desktop/mychoice-app/backend')

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'item_api.settings')
import django
django.setup()

from items.views import ItemViewSet

def test_speech_parsing():
    """Test the updated speech parsing logic"""
    viewset = ItemViewSet()
    
    test_cases = [
        "Name, Flash, Group, Primary",
        "orange primary",
        "apple secondary", 
        "flash primary",
        "banana secondary",
        "name apple group primary",
        "add banana to secondary group"
    ]
    
    print("🧪 Testing Speech Parsing Logic")
    print("=" * 50)
    
    for i, test_input in enumerate(test_cases, 1):
        print(f"\nTest {i}: '{test_input}'")
        result = viewset.parse_speech_input(test_input)
        if result:
            print(f"✅ Success: Name='{result['name']}', Group='{result['group']}'")
        else:
            print("❌ Failed to parse")
    
    print("\n" + "=" * 50)
    print("✅ Testing completed!")

if __name__ == "__main__":
    test_speech_parsing()
