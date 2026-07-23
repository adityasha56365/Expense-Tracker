// src/api/ocrApi.js
import api from './axiosInstance'

export const ocrApi = {
  scanReceipt: (formData) =>
    api.post('/ocr/scan-receipt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),
}
