import api from './api'

export async function getOfficers() {
  try {
    const response = await api.get('/officers')
    return response.data
  } catch (error) {
    console.error('Error fetching officers:', error)
    return []
  }
}
