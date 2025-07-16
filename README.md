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

#### Backend Setup

1. Navigate to the backend directory
   ```
   cd backend
   ```
2. Create Virtual Environment

Before installing dependencies, create a virtual environment:

**On macOS/Linux:**
```bash
python -m venv venv
source venv/bin/activate
```

**On Windows:**
```bash
python -m venv venv
venv\Scripts\activate

3. Install Python dependencies
   ```
   pip install -r requirements.txt
   ```

4. Apply database migrations
   ```
   python manage.py migrate
   ```

5. Start the Django server
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
