// src/api/recurringApi.js
import api from './axiosInstance'

export const recurringApi = {
  detect: () => api.get('/recurring/detect'),
  getSubscriptions: () => api.get('/recurring/subscriptions'),
}
