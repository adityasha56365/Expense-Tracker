// src/api/goalsApi.js
import api from './axiosInstance'

export const goalsApi = {
  getAll: () => api.get('/goals'),
  getOne: (id) => api.get(`/goals/${id}`),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
  contribute: (id, data) => api.post(`/goals/${id}/contribute`, data),
  getSuggestions: (id) => api.get(`/goals/${id}/suggestions`),
}
