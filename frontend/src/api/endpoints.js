// src/api/endpoints.js
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const authConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

// Register User
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, userData);
    return response.data;
  } catch (error) {
    console.error("Error registering user:", error.response?.data || error.message);
    throw error;
  }
};

// Login User
export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, credentials);
    return response.data;
  } catch (error) {
    console.error("Login failed:", error.response?.data || error.message);
    throw error;
  }
};

// Contact
export const sendContactMessage = async (data) => {
  try {
    const response = await axios.post(`${API_BASE}/contact`, data);
    return response.data;
  } catch (error) {
    console.error("Error sending contact message:", error.response?.data || error.message);
    throw error;
  }
};

// Posts
export const getPosts = async () => {
  try {
    const response = await axios.get(`${API_BASE}/posts`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch posts:", error.response?.data || error.message);
    throw error;
  }
};

export const createPost = async (postData) => {
  try {
    const response = await axios.post(`${API_BASE}/posts`, postData);
    return response.data;
  } catch (error) {
    console.error("Failed to create post:", error.response?.data || error.message);
    throw error;
  }
};

export const updatePost = async (postId, postData) => {
  try {
    const response = await axios.put(`${API_BASE}/posts/${postId}`, postData);
    return response.data;
  } catch (error) {
    console.error("Failed to update post:", error.response?.data || error.message);
    throw error;
  }
};

export const deletePost = async (postId) => {
  try {
    const response = await axios.delete(`${API_BASE}/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete post:", error.response?.data || error.message);
    throw error;
  }
};

// Reactions & comments (used by frontend to persist engagement so AI can pick it up)
export const addReaction = async (postId, reaction) => {
  try {
    const response = await api.post(`/posts/${postId}/reactions`, reaction);
    return response.data;
  } catch (error) {
    console.error('Failed to add reaction:', error.response?.data || error.message);
    throw error;
  }
};

export const addComment = async (postId, comment) => {
  try {
    const response = await api.post(`/posts/${postId}/comments`, comment);
    return response.data;
  } catch (error) {
    console.error('Failed to add comment:', error.response?.data || error.message);
    throw error;
  }
};


// Candidates
export const getCandidates = async () => {
  try {
    const response = await axios.get(`${API_BASE}/candidates`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch candidates:", error.response?.data || error.message);
    throw error;
  }
};

export const addCandidate = async (candidateData) => {
  try {
    const response = await axios.post(`${API_BASE}/candidates`, candidateData);
    return response.data;
  } catch (error) {
    console.error("Failed to add candidate:", error.response?.data || error.message);
    throw error;
  }
};

export const updateCandidate = async (candidateId, candidateData) => {
  try {
    const response = await axios.put(`${API_BASE}/candidates/${candidateId}`, candidateData);
    return response.data;
  } catch (error) {
    console.error("Failed to update candidate:", error.response?.data || error.message);
    throw error;
  }
};

export const deleteCandidate = async (candidateId) => {
  try {
    const response = await axios.delete(`${API_BASE}/candidates/${candidateId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete candidate:", error.response?.data || error.message);
    throw error;
  }
};

// Voters
export const getVoters = async (token) => {
  try {
    const response = await axios.get(`${API_BASE}/voters`, authConfig(token));
    return response.data;
  } catch (error) {
    console.error("Failed to fetch voters:", error.response?.data || error.message);
    throw error;
  }
};

export const getVoterById = async (id, token) => {
  try {
    const response = await axios.get(`${API_BASE}/voters/${id}`, authConfig(token));
    return response.data;
  } catch (error) {
    console.error("Failed to fetch voter:", error.response?.data || error.message);
    throw error;
  }
};

export const addVoter = async (voterData, token) => {
  try {
    const response = await axios.post(`${API_BASE}/voters`, voterData, authConfig(token));
    return response.data;
  } catch (error) {
    console.error("Failed to add voter:", error.response?.data || error.message);
    throw error;
  }
};

export const updateVoter = async (id, updatedData, token) => {
  try {
    const response = await axios.put(`${API_BASE}/voters/${id}`, updatedData, authConfig(token));
    return response.data;
  } catch (error) {
    console.error("Failed to update voter:", error.response?.data || error.message);
    throw error;
  }
};

export const deleteVoter = async (id, token) => {
  try {
    const response = await axios.delete(`${API_BASE}/voters/${id}`, authConfig(token));
    return response.data;
  } catch (error) {
    console.error("Failed to delete voter:", error.response?.data || error.message);
    throw error;
  }
};

// Elections
export const createElection = async (electionData, token) => {
  try {
    const response = await axios.post(`${API_BASE}/election/create`, electionData, authConfig(token));
    return response.data;
  } catch (error) {
    console.error("Failed to create election:", error.response?.data || error.message);
    throw error;
  }
};

export const getElections = async () => {
  try {
    const response = await axios.get(`${API_BASE}/election`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch elections:", error.response?.data || error.message);
    throw error;
  }
};

export const getElectionById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE}/election/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch election:", error.response?.data || error.message);
    throw error;
  }
};

export const endElection = async (id, token) => {
  try {
    const response = await axios.put(`${API_BASE}/election/${id}/end`, {}, authConfig(token));
    return response.data;
  } catch (error) {
    console.error("Failed to end election:", error.response?.data || error.message);
    throw error;
  }
};

// Admin
export const getAdminStats = async () => {
  try {
    const response = await axios.get(`${API_BASE}/admin/stats`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch admin stats:", error.response?.data || error.message);
    throw error;
  }
};

export const getWinningCandidates = async () => {
  try {
    const response = await axios.get(`${API_BASE}/admin/winners`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch winning candidates:", error.response?.data || error.message);
    throw error;
  }
};

export const getPrediction = async (electionId) => {
  try {
    const response = await axios.get(`${API_BASE}/prediction/public/${electionId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch prediction:", error.response?.data || error.message);
    throw error;
  }
};


// Votes
export const getVotes = async () => {
  try {
    const response = await axios.get(`${API_BASE}/votes`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch votes:", error.response?.data || error.message);
    throw error;
  }
};
