import axios from "axios";

const API_URL = "http://localhost:5000"; // Change to your server address

export const registerUser = (email, password) => axios.post(`${API_URL}/register`, { email, password });
export const loginUser = (email, password) => axios.post(`${API_URL}/login`, { email, password });
export const getUserProfile = (token) => axios.get(`${API_URL}/profile`, { headers: { Authorization: token } });
export const swipeUser = (token, swipedUserId, action) => axios.post(`${API_URL}/swipe`, { swiped_user_id: swipedUserId, action }, { headers: { Authorization: token } });