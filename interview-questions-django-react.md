# Django + React Project Interview Questions & Answers

These questions and answers are tailored to your full-stack Django + React project as described in `project.md`.

---

## Django (Backend) Questions

### 1. How do you ensure that item names are unique within each group?
**Answer:**
I use a `UniqueConstraint` in the Django model’s `Meta` class:
```python
class Meta:
    constraints = [
        UniqueConstraint(fields=['name', 'group'], name='unique_name_per_group')
    ]
```
This ensures that the same item name cannot appear twice in the same group, but can exist in different groups.

---

### 2. Where are the items stored when you create them via the API?
**Answer:**
Items are stored in the database configured for the Django project (by default, SQLite, but it could be PostgreSQL, MySQL, etc.). The `Item` model is mapped to a database table, and each API call that creates or updates an item results in a row being inserted or updated in that table.

---

### 3. How does the API handle error cases, such as duplicate items or missing fields?
**Answer:**
- If you try to create a duplicate item in the same group, the database constraint triggers an error, and Django REST Framework returns a 400 Bad Request with details.
- If required fields are missing, the serializer validation fails and also returns a 400 Bad Request.

---

### 4. Why did you use Django REST Framework’s ModelViewSet for the API?
**Answer:**
`ModelViewSet` provides all the CRUD operations (list, create, retrieve, update, partial_update, destroy) out of the box, reducing boilerplate code and ensuring consistency. It also makes it easy to add custom actions if needed.

---

### 5. How do you handle timestamps for item creation and updates?
**Answer:**
The `created_at` field uses `auto_now_add=True` to automatically set the timestamp when the item is created. The `updated_at` field uses `auto_now=True` to update the timestamp every time the item is modified.

---

### 6. How does the speech-to-text item creation work?
**Answer:**
The `/items/speech_to_text/` endpoint accepts an audio file, transcribes it using the Whisper model, parses the text to extract the item name and group, and then creates the item in the database. The parsing logic is flexible and supports simple formats like `"orange primary"`.

---

### 7. How are HTTP status codes handled in your API?
**Answer:**
- 200 for successful GET/UPDATE
- 201 for successful creation
- 400 for bad requests (validation errors, duplicates, etc.)
- 404 for not found
- 500 for server errors

---

### 8. How do you ensure only valid groups are used?
**Answer:**
The `group` field in the model uses `choices=[('Primary', 'Primary'), ('Secondary', 'Secondary')]`, so only these two values are accepted. Any other value will cause serializer validation to fail.

---

### 9. How do you parse speech input to extract item name and group?
**Answer:**
The backend parses the transcribed text by looking for the group word (“primary” or “secondary”) and treats everything before it as the item name, ignoring common filler words. This makes the system robust to different speech patterns.

---

## React (Frontend) Questions

### 10. How does the React app communicate with the Django API?
**Answer:**
The React app uses the Fetch API (or Axios) to make HTTP requests to the Django API endpoints. Service files (like `itemService.js`) encapsulate these requests.

---

### 11. How do you prevent duplicate API calls in your React components?
**Answer:**
By using the `useEffect` hook with an empty dependency array (`[]`), the data-fetching function runs only once when the component mounts. Also, loading state is managed to prevent concurrent requests. In development, React.StrictMode can cause double calls, but this does not happen in production.

---

### 12. How do you handle form validation and error messages in the frontend?
**Answer:**
Chakra UI’s `FormControl` and `isRequired` are used for basic validation. Errors from the backend are displayed using Chakra’s `Alert` component. Toast notifications are used for success messages.

---

### 13. How do you ensure the UI is user-friendly for both manual and speech input?
**Answer:**
- There are clear buttons for both manual and speech input.
- The form is accessible from multiple places (header, list page).
- The speech input page provides clear instructions and feedback.

---

### 14. How do you update the UI after creating or editing an item?
**Answer:**
After a successful create or update, the app navigates back to the item list and shows a toast notification. The list is refreshed to show the latest data.

---

### 15. How do you display and update a single item?
**Answer:**
The `ItemDetail` component fetches and displays a single item by its ID. The `ItemForm` component is reused for both creating and editing, with the form pre-filled when editing.

---

### 16. How do you handle unique constraints in the frontend?
**Answer:**
If a user tries to create a duplicate item in the same group, the backend returns a 400 error, which is caught and displayed as an error message in the form.

---

### 17. How do you structure your React components for this project?
**Answer:**
There are separate components for listing items, showing item details, creating/editing items, and handling speech input. This keeps the code modular and maintainable.

---

### 18. How do you style your React app?
**Answer:**
Chakra UI is used for all styling, providing a modern, responsive, and accessible design out of the box.

---

### 19. How do you handle API errors and loading states in the UI?
**Answer:**
Loading states are shown with spinners or loading text. Errors are displayed using Chakra’s `Alert` component, and success is shown with toast notifications.

---

### 20. How do you ensure the app is accessible and easy to use?
**Answer:**
- All form fields are labeled and required fields are marked.
- Buttons are clearly labeled and use icons for clarity.
- The UI is responsive and works on all screen sizes.

---

## Bonus: Full-Stack Integration

### 21. How does the frontend know the structure of the data returned by the backend?
**Answer:**
The frontend expects the data structure defined by the Django serializer. Both are kept in sync, and any changes to the backend serializer are reflected in the frontend service and components.

---

### 22. How do you test your API endpoints?
**Answer:**
I use tools like curl, Postman, or even Python scripts to test the endpoints directly. The frontend also serves as a test by making real requests and displaying results.

---

### 23. How do you handle CORS issues between Django and React?
**Answer:**
By using the `django-cors-headers` package and configuring allowed origins in Django settings, the frontend can communicate with the backend without CORS errors.

---

### 24. How do you deploy this full-stack app?
**Answer:**
- The Django backend can be deployed on platforms like Heroku, AWS, or DigitalOcean.
- The React frontend can be built and served via Netlify, Vercel, or as static files from Django.
- Environment variables are used to configure API URLs for production.

---

These questions and answers are tailored to your actual code and project requirements. Review them and you’ll be well-prepared for technical questions about your Django + React project!
