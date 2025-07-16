# Underwriting API Documentation

## Overview
The underwriting API provides comprehensive endpoints for managing insurance underwriting applications, including detailed result analysis and dashboard views.

## New API Endpoints

### 1. Get Application Details
**Endpoint:** `GET /api/underwriting/get_application_details/`

**Query Parameters:**
- `application_id` (required): UUID of the underwriting application

**Description:**
Retrieves comprehensive details for a specific underwriting application, including:
- Complete application data
- Risk assessment results
- Red flags and recommendations  
- Related claims, policies, and regulations

**Example Request:**
```bash
curl "http://localhost:8000/api/underwriting/get_application_details/?application_id=your-uuid-here"
```
**Example Response:**
```json
{
  "application": {
    "id": "uuid",
    "applicant_id": "APPL123",
    "policy_id": "POL456",
    "lob": "auto",
    "status": "processed",
    "created_at": "2025-07-15T10:30:00Z"
  },
  "detailed_results": {
    "application_id": "uuid",
    "risk_assessment": {
      "risk_summary": "Medium to High Risk...",
      "recommendations": "Increase premium due to...",
      "red_flags": ["Prior Claims (2)", "Speeding Tickets"],
      "red_flags_count": 2
    },
    "related_data": {
      "policy": {...},
      "claims": [...],
      "claims_count": 2,
      "regulations": [...],
      "regulations_count": 3
    }
  }
}
```

### 2. List Applications
**Endpoint:** `GET /api/underwriting/list_applications/`

**Query Parameters (all optional):**
- `applicant_id`: Filter by applicant ID
- `policy_id`: Filter by policy ID
- `lob`: Filter by line of business
- `status`: Filter by application status

**Description:**
Lists all underwriting applications with summary information and filtering options.

**Example Request:**
```bash
curl "http://localhost:8000/api/underwriting/list_applications/?lob=auto&status=processed"
```

**Example Response:**
```json
{
  "applications": [
    {
      "id": "uuid",
      "applicant_id": "APPL123",
      "policy_id": "POL456",
      "status": "processed",
      "summary": {
        "red_flags_count": 2,
        "has_recommendations": true,
        "has_risk_summary": true
      }
    }
  ],
  "total_count": 25,
  "filters_applied": {
    "lob": "auto",
    "status": "processed"
  }
}
```

### 3. Dashboard Overview
**Endpoint:** `GET /api/underwriting/dashboard_overview/`

**Description:**
Provides a comprehensive dashboard view with statistics, recent applications, and risk analysis.

**Example Request:**
```bash
curl "http://localhost:8000/api/underwriting/dashboard_overview/"
```

**Example Response:**
```json
{
  "overview": {
    "total_applications": 50,
    "pending_applications": 5,
    "processed_applications": 45,
    "flagged_applications_count": 12,
    "high_risk_applications_count": 8
  },
  "recent_applications": [...],
  "flagged_applications": [...],
  "high_risk_applications": [...],
  "line_of_business_stats": {
    "auto": {
      "count": 30,
      "flagged": 8,
      "processed": 28
    },
    "home": {
      "count": 20,
      "flagged": 4,
      "processed": 17
    }
  },
  "timestamp": "2025-07-15T10:30:00Z"
}
```

## Existing Endpoints

### Process Application
**Endpoint:** `POST /api/underwriting/process_application/`

Processes a new underwriting application through the LangGraph workflow.

### Explain Red Flag
**Endpoint:** `POST /api/underwriting/explain_flag/`

Provides detailed explanation for a specific red flag.

### Generate Embeddings
**Endpoint:** `POST /api/underwriting/embeddings/`

Generates embeddings for text chunks.

## Usage Examples

### Frontend Integration
```javascript
// Get application details
const getApplicationDetails = async (applicationId) => {
  const response = await fetch(
    `/api/underwriting/get_application_details/?application_id=${applicationId}`
  );
  return response.json();
};

// Get dashboard data
const getDashboardData = async () => {
  const response = await fetch('/api/underwriting/dashboard_overview/');
  return response.json();
};

// List applications with filters
const listApplications = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/underwriting/list_applications/?${params}`);
  return response.json();
};
```

### Python Integration
```python
import requests

# Get application details
def get_application_details(application_id):
    response = requests.get(
        f"http://localhost:8000/api/underwriting/get_application_details/",
        params={'application_id': application_id}
    )
    return response.json()

# Get dashboard overview
def get_dashboard_overview():
    response = requests.get(
        "http://localhost:8000/api/underwriting/dashboard_overview/"
    )
    return response.json()
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200 OK`: Success
- `400 Bad Request`: Missing required parameters
- `404 Not Found`: Application not found
- `500 Internal Server Error`: Server error

Error responses include descriptive error messages:
```json
{
  "error": "Missing required parameter: application_id"
}
```

## Authentication

The API endpoints follow the same authentication requirements as other Django REST framework endpoints in the application.
