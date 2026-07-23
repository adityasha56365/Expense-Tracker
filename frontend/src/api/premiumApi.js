// src/api/premiumApi.js
import api from './axiosInstance'

export const premiumApi = {
  getStatus: () => api.get('/premium/status'),
  activate: (data) => api.post('/premium/activate', data),
  deactivate: () => api.post('/premium/deactivate'),
}
