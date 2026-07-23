// src/api/analyticsApi.js
import api from './axiosInstance'

export const analyticsApi = {
  getSummary: (params) => api.get('/analytics/summary', { params }),
  getMonthlyTrend: (params) => api.get('/analytics/monthly-trend', { params }),
  getCategoryBreakdown: (params) => api.get('/analytics/category-breakdown', { params }),
  getIncomeVsExpense: (params) => api.get('/analytics/income-vs-expense', { params }),
  getYearlyOverview: (params) => api.get('/analytics/yearly-overview', { params }),
}
