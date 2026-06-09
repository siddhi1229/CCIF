import api from './api'

const LOCAL_GRAPH_NODES_KEY = 'ccif-local-graph-nodes'
const LOCAL_GRAPH_EDGES_KEY = 'ccif-local-graph-edges'

function readLocalNodes() {
  try { return JSON.parse(localStorage.getItem(LOCAL_GRAPH_NODES_KEY) || '[]') } catch { return [] }
}

function readLocalEdges() {
  try { return JSON.parse(localStorage.getItem(LOCAL_GRAPH_EDGES_KEY) || '[]') } catch { return [] }
}

function normalizeGraph(data) {
  return {
    nodes: data.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        type: node.data.type || node.data.group,
        risk: node.data.risk || 72
      }
    })),
    edges: data.edges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        label: edge.data.label || edge.data.relationship || 'related',
        confidence: edge.data.confidence || 50
      }
    }))
  }
}

function mergeLocalGraph(base) {
  const localNodes = readLocalNodes()
  const localEdges = readLocalEdges()

  if (!localNodes.length && !localEdges.length) return base

  const existingNodeIds = new Set(base.nodes.map((n) => n.data.id))
  const existingEdgeIds = new Set(base.edges.map((e) => e.data.id))

  const newNodes = localNodes
    .filter((n) => !existingNodeIds.has(n.data.id))
    .map((n) => ({
      ...n,
      data: { ...n.data, risk: n.data.risk || 60 }
    }))

  const newEdges = localEdges
    .filter((e) => !existingEdgeIds.has(e.data.id))
    .map((e) => ({
      ...e,
      data: { ...e.data, confidence: e.data.confidence || 80 }
    }))

  return {
    nodes: [...base.nodes, ...newNodes],
    edges: [...base.edges, ...newEdges]
  }
}

export function addLocalGraphRelationships({ caseId, caseTitle, suspectId, suspectName, gangName, domainName }) {
  const nodes = readLocalNodes()
  const edges = readLocalEdges()

  const nodeIds = new Set(nodes.map((n) => n.data.id))
  const edgeIds = new Set(edges.map((e) => e.data.id))

  // Case node
  if (!nodeIds.has(caseId)) {
    nodes.push({ data: { id: caseId, label: caseTitle, type: 'case', risk: 70 } })
    nodeIds.add(caseId)
  }

  // Suspect node + edge
  if (suspectId && suspectName) {
    if (!nodeIds.has(suspectId)) {
      nodes.push({ data: { id: suspectId, label: suspectName, type: 'suspect', risk: 65 } })
      nodeIds.add(suspectId)
    }
    const edgeId = `${suspectId}--INVOLVED_IN--${caseId}`
    if (!edgeIds.has(edgeId)) {
      edges.push({ data: { id: edgeId, source: suspectId, target: caseId, label: 'INVOLVED_IN', confidence: 85 } })
      edgeIds.add(edgeId)
    }
  }

  // Gang node + edge to suspect
  if (gangName && gangName.trim()) {
    const gangId = `gang-${gangName.replace(/\s+/g, '-').toLowerCase()}`
    if (!nodeIds.has(gangId)) {
      nodes.push({ data: { id: gangId, label: gangName, type: 'gang', risk: 75 } })
      nodeIds.add(gangId)
    }
    if (suspectId) {
      const edgeId = `${gangId}--ASSOCIATED_WITH--${suspectId}`
      if (!edgeIds.has(edgeId)) {
        edges.push({ data: { id: edgeId, source: gangId, target: suspectId, label: 'ASSOCIATED_WITH', confidence: 80 } })
        edgeIds.add(edgeId)
      }
    }
  }

  // Domain node + edge to case
  if (domainName && domainName.trim()) {
    const domainId = `domain-${domainName.replace(/\s+/g, '-').toLowerCase()}`
    if (!nodeIds.has(domainId)) {
      nodes.push({ data: { id: domainId, label: domainName, type: 'location', risk: 50 } })
      nodeIds.add(domainId)
    }
    const edgeId = `${caseId}--BELONGS_TO--${domainId}`
    if (!edgeIds.has(edgeId)) {
      edges.push({ data: { id: edgeId, source: caseId, target: domainId, label: 'BELONGS_TO', confidence: 90 } })
      edgeIds.add(edgeId)
    }
  }

  localStorage.setItem(LOCAL_GRAPH_NODES_KEY, JSON.stringify(nodes))
  localStorage.setItem(LOCAL_GRAPH_EDGES_KEY, JSON.stringify(edges))
}

export const graphService = {
  async getGraph() {
    try {
      const response = await api.get('/graph/network')
      const normalized = normalizeGraph(response.data)
      return { ...mergeLocalGraph(normalized), isMock: false }
    } catch (error) {
      console.error('Graph fetch failed, using local data only:', error)
      return { ...mergeLocalGraph({ nodes: [], edges: [] }), isMock: true }
    }
  },

  async expandNode(id) {
    try {
      const response = await api.get(`/graph/${id}`)
      return response.data
    } catch (error) {
      console.error('Expand node failed:', error)
      return null
    }
  }
}
