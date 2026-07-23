// src/api/importApi.js
import api from './axiosInstance'

export const importApi = {
  preview: (formData) => api.post('/import/preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  confirm: (data) => api.post('/import/confirm', data),
}
