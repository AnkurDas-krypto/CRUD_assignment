import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const getItems = async () => {
  try {
    console.log('Sending request to:', `${API_URL}/items/`);
    const response = await axios.get(`${API_URL}/items/`);
    console.log('Response received:', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request error:', error.message);
    }
    throw error;
  }
};

export const getItem = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/items/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching item ${id}:`, error);
    throw error;
  }
};

export const createItem = async (itemData) => {
  try {
    const response = await axios.post(`${API_URL}/items/`, itemData);
    return response.data;
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
};

export const updateItem = async (id, itemData) => {
  try {
    const response = await axios.patch(`${API_URL}/items/${id}/`, itemData);
    return response.data;
  } catch (error) {
    console.error(`Error updating item ${id}:`, error);
    throw error;
  }
};

export const deleteItem = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/items/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting item ${id}:`, error);
    throw error;
  }
};
