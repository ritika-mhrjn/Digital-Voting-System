import { api } from './axiosInstance';

// Auth functions
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error("Error registering user:", error.response?.data || error.message);
    throw error;
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    console.error("Login failed:", error.response?.data || error.message);
    throw error;
  }
};

// Contact
export const sendContactMessage = async (data) => {
  try {
    const response = await api.post('/contact', data);
    return response.data;
  } catch (error) {
    console.error("Error sending contact message:", error.response?.data || error.message);
    throw error;
  }
};

// Posts
export const getPosts = async () => {
  try {
    const response = await api.get('/posts');
    // Return the actual data array, not the entire response
    return response.data.data || [];
  } catch (error) {
    console.error("Failed to fetch posts:", error.response?.data || error.message);
    return [];
  }
};

export const createPost = async (postData) => {
  try {
    const response = await api.post('/posts', postData);
    return response.data;
  } catch (error) {
    console.error("Failed to create post:", error.response?.data || error.message);
    throw error;
  }
};

export const updatePost = async (postId, postData) => {
  try {
    const response = await api.put(`/posts/${postId}`, postData);
    return response.data;
  } catch (error) {
    console.error("Failed to update post:", error.response?.data || error.message);
    throw error;
  }
};

export const deletePost = async (postId) => {
  try {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete post:", error.response?.data || error.message);
    throw error;
  }
};

// Reactions & comments
export const addReaction = async (postId, reactionData) => {
  try {
    const response = await api.post(`/posts/${postId}/reactions`, reactionData);
    return response.data;
  } catch (error) {
    console.error('Failed to add reaction:', error.response?.data || error.message);
    throw error;
  }
};

export const addComment = async (postId, commentData) => {
  try {
    const response = await api.post(`/posts/${postId}/comments`, commentData);
    return response.data;
  } catch (error) {
    console.error('Failed to add comment:', error.response?.data || error.message);
    throw error;
  }
};


// USER PROFILE
export const updateUserProfile = async (userId, updates) => {
  try {
    const response = await api.put(`/users/${userId}`, updates);
    return response.data;
  } catch (error) {
    console.error("Failed to update user profile:", error.response?.data || error.message);
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch user profile:", error.response?.data || error.message);
    throw error;
  }
};

export const uploadProfileImage = async (userId, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('profilePic', imageFile);

    const response = await api.post(`/users/${userId}/profile-pic`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to upload profile image:", error.response?.data || error.message);
    throw error;
  }
};

// Candidates
export const getCandidates = async () => {
  try {
    const response = await api.get('/candidates');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch candidates:", error.response?.data || error.message);
    throw error;
  }
};

export const addCandidate = async (candidateData) => {
  try {
    const response = await api.post('/candidates', candidateData);
    return response.data;
  } catch (error) {
    console.error("Failed to add candidate:", error.response?.data || error.message);
    throw error;
  }
};

export const updateCandidate = async (candidateId, candidateData) => {
  try {
    const response = await api.put(`/candidates/${candidateId}`, candidateData);
    return response.data;
  } catch (error) {
    console.error("Failed to update candidate:", error.response?.data || error.message);
    throw error;
  }
};

export const deleteCandidate = async (candidateId) => {
  try {
    const response = await api.delete(`/candidates/${candidateId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete candidate:", error.response?.data || error.message);
    throw error;
  }
};

// Voters
export const getVoters = async () => {
  try {
    const response = await api.get('/voters');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch voters:", error.response?.data || error.message);
    throw error;
  }
};

export const addVoter = async (voterData) => {
  try {
    const response = await api.post('/voters/bulk', { voters: [voterData] });
    return response.data;
  } catch (error) {
    console.error("Failed to add voter:", error.response?.data || error.message);
    throw error;
  }
};

export const verifyVoter = async (voterId) => {
  try {
    const response = await api.patch(`/voters/verify/${voterId}`, {});
    return response.data;
  } catch (error) {
    console.error("Failed to verify voter:", error.response?.data || error.message);
    throw error;
  }
};

export const getVoterById = async (id) => {
  try {
    const response = await api.get(`/voters/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch voter:", error.response?.data || error.message);
    throw error;
  }
};

export const updateVoter = async (id, updatedData) => {
  try {
    const response = await api.put(`/voters/${id}`, updatedData);
    return response.data;
  } catch (error) {
    console.error("Failed to update voter:", error.response?.data || error.message);
    throw error;
  }
};

export const deleteVoter = async (id) => {
  try {
    const response = await api.delete(`/voters/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete voter:", error.response?.data || error.message);
    throw error;
  }
};

// Elections
export const createElection = async (electionData) => {
  try {
    const response = await api.post('/elections/create', electionData);
    return response.data;
  } catch (error) {
    console.error("Failed to create election:", error.response?.data || error.message);
    throw error;
  }
};

export const getElections = async () => {
  try {
    const response = await api.get('/elections');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch elections:", error.response?.data || error.message);
    throw error;
  }
};

export const getElectionById = async (id) => {
  try {
    const response = await api.get(`/elections/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch election:", error.response?.data || error.message);
    throw error;
  }
};

export const updateElection = async (electionId, updateData) => {
  try {
    const response = await api.put(`/elections/${electionId}`, updateData);
    return response.data;
  } catch (error) {
    console.error("Failed to update election:", error.response?.data || error.message);
    throw error;
  }
};

export const endElection = async (id) => {
  try {
    const response = await api.put(`/elections/${id}/end`, {});
    return response.data;
  } catch (error) {
    console.error("Failed to end election:", error.response?.data || error.message);
    throw error;
  }
};

export const deleteElection = async (id) => {
  try {
    const response = await api.delete(`/elections/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete election:", error.response?.data || error.message);
    throw error;
  }
};

export const getPublicElections = async () => {
  try {
    const response = await api.get('/elections/public');
    return response.data;
  } catch (error) {
    console.error("Error fetching public elections:", error);
    throw error;
  }
};

// Admin
export const getAdminStats = async () => {
  try {
    const response = await api.get('/admin/stats');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch admin stats:", error.response?.data || error.message);
    throw error;
  }
};

export const getWinningCandidates = async () => {
  try {
    const response = await api.get('/admin/winners');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch winning candidates:", error.response?.data || error.message);
    throw error;
  }
};

export const getPrediction = async (electionId) => {
  try {
    const response = await api.get(`/prediction/public/${electionId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch prediction:", error.response?.data || error.message);
    throw error;
  }
};

// Votes
export const getVotes = async () => {
  try {
    const response = await api.get('/votes');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch votes:", error.response?.data || error.message);
    throw error;
  }
};