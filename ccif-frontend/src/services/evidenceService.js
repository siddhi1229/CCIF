import api from './api.js'

function normalizeEvidence(item) {
  const integrityScore = Number(item.integrity)
  return {
    ...item,
    caseId: item.caseId || item.case_id,
    uploadedBy: item.uploadedBy || item.uploaded_by,
    integrity: Number.isFinite(integrityScore)
      ? integrityScore >= 90 ? 'Verified' : integrityScore >= 70 ? 'Intact' : 'Needs Review'
      : item.integrity
  }
}

export async function getEvidence() {
  try {
    const response = await api.get('/evidence')
    return response.data.map(normalizeEvidence)
  } catch (error) {
    console.error('Error fetching evidence:', error)
    return []
  }
}

export async function getEvidenceByCase(caseId) {
  try {
    const response = await api.get(`/evidence/${caseId}`)
    return response.data.map(normalizeEvidence)
  } catch (error) {
    console.error(`Error fetching evidence for ${caseId}:`, error)
    return []
  }
}
