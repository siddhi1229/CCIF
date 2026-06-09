import api from './api'

export async function getAlerts() {
  try {
    const response = await api.get('/alerts')
    return response.data
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return []
  }
}
