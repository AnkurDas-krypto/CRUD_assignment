Full-Stack Coding Task: Django API + React App
Task Overview
You’ll be building a small API in Django that supports basic CRUD operations and a single-page React app that communicates with the API. The task will help assess your understanding of both Django backend development and React frontend development.

Part 1: Django API (Backend)
Objective: Create a simple Django app with a REST API to manage a collection of "items".

1. Data:
An item entity should have at least the following fields
name: Name of the item.
group: Item group.
created_at: Timestamp for when the item was created.
updated_at: Timestamp for when the item was last updated.
2. API Endpoints:
Create the following endpoints:

GET /items/: List all items.
POST /items/: Create a new item.
PATCH /items/{id}/: Update an existing item.
GET /items/{id}/: Get a specific item by its ID.
Any library or framework can be used to help build the API endpoints (such as Django Rest Framework).

3. Additional rules to adhere to:
There should be at least two item groups: Primary and Secondary.
Each group should contain only unique item names. For example, an item named 'Rock' can appear in both the Primary and Secondary groups, but there can't be two items named 'Rock' in the same group (e.g., in the Primary group).
4. Error Handling:
Return appropriate HTTP status codes for success and failure (e.g., 404 for "not found", 400 for "bad request", etc.).
Part 2: React App (Frontend)
Objective: Create a small React app that communicates with the Django API and allows users to interact with the items.

1. App Structure:
Build a small app to interact with the API. You can choose the structure and methods for managing state, making HTTP requests, and organizing components. Utilize all endpoints and build the following functionality - list items, create new item, review single item, update existing item.
2. Design:
Feel free to use any UI framework (such as Chakra UI, or something else).