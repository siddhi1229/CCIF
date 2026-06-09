import api from './api'
import { crimeCategories as uiMeta } from '../data/mockCrimeCategories.js'

export async function getCrimeCategories() {
  try {
    const response = await api.get('/crimes')
    return response.data.map((domain) => {
      const meta = uiMeta.find((item) => item.crimeCode === domain.crimeCode)
      return { ...domain, icon: meta?.icon, gradient: meta?.gradient }
    })
  } catch (error) {
    console.error('Error fetching crime categories:', error)
    return []
  }
}
