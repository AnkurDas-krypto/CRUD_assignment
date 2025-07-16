# MyChoice App

A simple web application for managing items categorized by groups.

## Project Structure

The application consists of two main parts:
- **Backend**: Django REST API
- **Frontend**: React application

## Prerequisites

- Python 3.8+
- Node.js 18+
- npm 8+

## Getting Started

### Option 1: Using the Start Script

The easiest way to run the application is to use the provided start script:

```
./start.sh
```

This script will:
1. Start the Django backend server on port 8000
2. Install frontend dependencies if needed
3. Start the React frontend on port 3000

### Option 2: Manual Setup

#### Backend Setup

1. Navigate to the backend directory
   ```
   cd backend
   ```

2. Install Python dependencies
   ```
   pip install -r requirements.txt
   ```

3. Apply database migrations
   ```
   python manage.py migrate
   ```

4. Start the Django server
   ```
   python manage.py runserver
   ```
   The backend will be available at http://localhost:8000

#### Frontend Setup

1. Navigate to the frontend directory
   ```
   cd frontend
   ```

2. Install JavaScript dependencies
   ```
   npm install
   ```

3. Start the React development server
   ```
   npm start
   ```
   The frontend will be available at http://localhost:3000

## API Endpoints

- **GET /items/**: List all items
- **POST /items/**: Create a new item
- **GET /items/{id}/**: Retrieve a specific item
- **PATCH /items/{id}/**: Update a specific item
- **DELETE /items/{id}/**: Delete a specific item

## Troubleshooting

If you encounter issues:

1. Make sure both servers are running
2. Check browser console for any frontend errors
3. Check terminal output for backend errors
4. Ensure no other services are using ports 3000 or 8000
