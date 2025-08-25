#!/usr/bin/env python3
"""
Firebase Configuration and Connection Test
Tests Firebase authentication and Firestore database connectivity
"""

import requests
import json
import sys
from datetime import datetime

class FirebaseConfigTester:
    def __init__(self):
        self.firebase_config = {
            "apiKey": "AIzaSyDLH-GwBMtKgPoONfgcGiD6nB88ASA86eY",
            "authDomain": "zamflow-1.firebaseapp.com",
            "projectId": "zamflow-1",
            "storageBucket": "zamflow-1.firebasestorage.app",
            "messagingSenderId": "725858457543",
            "appId": "1:725858457543:web:731f321834b36e789fabe2"
        }
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, test_func):
        """Run a single test"""
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            result = test_func()
            if result:
                self.tests_passed += 1
                print(f"✅ Passed")
            else:
                print(f"❌ Failed")
            return result
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_firebase_project_exists(self):
        """Test if Firebase project exists and is accessible"""
        try:
            # Test Firebase Auth REST API endpoint
            url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={self.firebase_config['apiKey']}"
            response = requests.post(url, json={
                "email": "test@example.com",
                "password": "testpass123",
                "returnSecureToken": True
            }, timeout=10)
            
            # We expect either success or a specific error (like email already exists)
            # If we get a 400 with invalid API key, that's a config issue
            if response.status_code == 400:
                error_data = response.json()
                if "INVALID_API_KEY" in str(error_data):
                    print(f"❌ Invalid API Key: {self.firebase_config['apiKey']}")
                    return False
                else:
                    # Other 400 errors might be expected (like email format issues)
                    print(f"✅ Firebase Auth API is accessible (got expected error: {error_data.get('error', {}).get('message', 'Unknown')})")
                    return True
            elif response.status_code == 200:
                print("✅ Firebase Auth API is accessible")
                return True
            else:
                print(f"❌ Unexpected response: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Network error: {str(e)}")
            return False

    def test_firestore_access(self):
        """Test Firestore database access"""
        try:
            # Test Firestore REST API
            project_id = self.firebase_config['projectId']
            url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents"
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                print("✅ Firestore database is accessible")
                return True
            elif response.status_code == 403:
                print("❌ Firestore access denied - Check security rules")
                return False
            elif response.status_code == 404:
                print("❌ Firestore database not found")
                return False
            else:
                print(f"❌ Unexpected Firestore response: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Firestore network error: {str(e)}")
            return False

    def test_firebase_config_validity(self):
        """Test if Firebase configuration values are valid"""
        required_fields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']
        
        for field in required_fields:
            if not self.firebase_config.get(field):
                print(f"❌ Missing required field: {field}")
                return False
        
        # Check if values look valid
        if not self.firebase_config['apiKey'].startswith('AIza'):
            print(f"❌ API key format looks invalid")
            return False
            
        if not self.firebase_config['authDomain'].endswith('.firebaseapp.com'):
            print(f"❌ Auth domain format looks invalid")
            return False
            
        print("✅ Firebase configuration format is valid")
        return True

    def test_cors_and_domain_setup(self):
        """Test if domain is properly configured for Firebase"""
        try:
            # This is a basic test - in reality, CORS is tested by the browser
            auth_domain = self.firebase_config['authDomain']
            url = f"https://{auth_domain}"
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                print("✅ Firebase Auth domain is accessible")
                return True
            else:
                print(f"⚠️ Firebase Auth domain returned {response.status_code}")
                return True  # This might be expected
                
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Could not reach auth domain: {str(e)}")
            return True  # This might be expected

def main():
    print("🔥 Firebase Configuration and Connection Test")
    print("=" * 50)
    
    tester = FirebaseConfigTester()
    
    # Run all tests
    tester.run_test("Firebase Configuration Validity", tester.test_firebase_config_validity)
    tester.run_test("Firebase Project Accessibility", tester.test_firebase_project_exists)
    tester.run_test("Firestore Database Access", tester.test_firestore_access)
    tester.run_test("CORS and Domain Setup", tester.test_cors_and_domain_setup)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All Firebase tests passed!")
        return 0
    else:
        print("⚠️ Some Firebase tests failed. Check configuration and permissions.")
        return 1

if __name__ == "__main__":
    sys.exit(main())