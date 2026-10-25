import api from "./api";

export const listWebhooks = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}/webhooks`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createWebhook = async (projectId, webhookData) => {
  try {
    const response = await api.post(`/projects/${projectId}/webhooks`, webhookData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteWebhook = async (projectId, webhookId) => {
  try {
    const response = await api.delete(`/projects/${projectId}/webhooks/${webhookId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const testWebhook = async (projectId, webhookId) => {
  try {
    const response = await api.post(`/projects/${projectId}/webhooks/${webhookId}/test`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
