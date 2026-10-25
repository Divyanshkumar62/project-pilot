import api from './api';
import { API_ENDPOINTS } from '../constants/api';

export const getProfile = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.USERS.ME);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateProfile = async (profileData) => {
  try {
    const response = await api.put(API_ENDPOINTS.USERS.ME, profileData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updatePassword = async (passwordData) => {
  try {
    const response = await api.put(API_ENDPOINTS.USERS.PASSWORD, passwordData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateAvatar = async (fileOrFormData) => {
  try {
    const formData = (fileOrFormData instanceof FormData)
      ? fileOrFormData
      : (() => {
          const fd = new FormData();
          fd.append('avatar', fileOrFormData);
          return fd;
        })();
    
    const response = await api.put('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getPublicProfile = async (userId) => {
  try {
    const response = await api.get(API_ENDPOINTS.USERS.PUBLIC_PROFILE(userId));
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
