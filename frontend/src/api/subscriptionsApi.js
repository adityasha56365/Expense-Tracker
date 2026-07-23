// src/api/subscriptionsApi.js
import api from './axiosInstance'

export const subscriptionsApi = {
  getAll: () => api.get('/subscriptions'),
  create: (data) => api.post('/subscriptions', data),
  update: (id, data) => api.put(`/subscriptions/${id}`, data),
  delete: (id) => api.delete(`/subscriptions/${id}`),
  getUpcoming: () => api.get('/subscriptions/upcoming'),
  getSummary: () => api.get('/subscriptions/summary'),
  markPaid: (id) => api.post(`/subscriptions/${id}/mark-paid`),
  getInvoice: (id) => api.get(`/subscriptions/${id}/invoice`),
}
