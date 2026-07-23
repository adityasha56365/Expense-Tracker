// src/api/forecastApi.js
import api from './axiosInstance'

export const forecastApi = {
  getNextMonth: () => api.get('/forecast/next-month'),
  getRecommendations: () => api.get('/forecast/recommendations'),
}
