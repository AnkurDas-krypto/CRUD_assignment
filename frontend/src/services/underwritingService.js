// Underwriting API Service
const BASE_URL = 'http://localhost:8000/api/underwriting';

export const underwritingService = {
    // Get all applications with optional filtering
    async getApplications(filters = {}) {
        const params = new URLSearchParams(filters);
        const response = await fetch(`${BASE_URL}/list_applications/?${params}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    // Get detailed information about a specific application
    async getApplicationDetails(applicationId) {
        const response = await fetch(`${BASE_URL}/get_application_details/?application_id=${applicationId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    // Get dashboard overview with statistics
    async getDashboardOverview() {
        const response = await fetch(`${BASE_URL}/dashboard_overview/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    // Process a new application
    async processApplication(applicationData) {
        const response = await fetch(`${BASE_URL}/process_application/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(applicationData),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    // Explain a red flag
    async explainFlag(applicationId, selectedFlag) {
        const response = await fetch(`${BASE_URL}/explain_flag/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                application_id: applicationId,
                selected_flag: selectedFlag
            }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    // Generate embeddings
    async generateEmbeddings(inputTexts, model = 'embed-model') {
        const response = await fetch(`${BASE_URL}/embeddings/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                input: inputTexts
            }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }
};

export default underwritingService;
