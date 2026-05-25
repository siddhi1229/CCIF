import api from './api.js'

export async function getDashboardStats() {
  try {
    const response = await api.get('/dashboard/stats')
    return response.data
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return null
  }
}
