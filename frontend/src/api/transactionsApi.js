// src/api/transactionsApi.js
import api from './axiosInstance'

export const transactionsApi = {
  getAll: (params) => api.get('/transactions', { params }),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  search: (params) => api.get('/transactions/search', { params }),
}
