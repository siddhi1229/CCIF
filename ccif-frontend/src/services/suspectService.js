import api from './api'

const LOCAL_SUSPECTS_KEY = 'ccif-local-suspects'

function readLocalSuspects() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_SUSPECTS_KEY) || '[]')
  } catch {
    return []
  }
}

function writeLocalSuspect(suspect) {
  const existing = readLocalSuspects().filter((s) => s.id !== suspect.id)
  localStorage.setItem(LOCAL_SUSPECTS_KEY, JSON.stringify([suspect, ...existing]))
}

export function generateSuspectId() {
  const bytes = new Uint16Array(1)
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes)
    return `S-${String(2000 + (bytes[0] % 8000)).padStart(4, '0')}`
  }
  return `S-${Math.floor(2000 + Math.random() * 8000)}`
}

export function createLocalSuspect(suspect) {
  writeLocalSuspect(suspect)
  return suspect
}

export async function getSuspects() {
  try {
    const response = await api.get('/suspects')
    const localSuspects = readLocalSuspects()
    const liveIds = new Set(response.data.map((s) => s.id))
    return [...localSuspects.filter((s) => !liveIds.has(s.id)), ...response.data]
  } catch (error) {
    console.error('Error fetching suspects:', error)
    return readLocalSuspects()
  }
}

export async function getSuspect(suspectId) {
  try {
    const response = await api.get(`/suspects/${suspectId}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching suspect ${suspectId}:`, error)
    return readLocalSuspects().find((s) => s.id === suspectId) || null
  }
}

export async function findSuspectByName(name) {
  const all = await getSuspects()
  return all.find((s) => s.name.toLowerCase() === name.trim().toLowerCase()) || null
}
