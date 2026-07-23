// src/api/splitsApi.js
import api from './axiosInstance'

export const splitsApi = {
  getAll: () => api.get('/splits'),
  create: (data) => api.post('/splits', data),
  getOne: (id) => api.get(`/splits/${id}`),
  settle: (id, data) => api.put(`/splits/${id}/settle`, data),
  delete: (id) => api.delete(`/splits/${id}`),
}
