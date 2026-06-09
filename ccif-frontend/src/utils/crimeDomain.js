const typeAliases = {
  PT: ['cargo theft', 'port theft', 'container theft'],
  FT: ['cyber fraud', 'financial crime', 'financial fraud', 'card skimming', 'identity fraud'],
  BG: ['burglary', 'serial theft'],
  VT: ['auto theft', 'vehicle theft'],
  SM: ['smuggling', 'trafficking', 'weapons'],
  OC: ['organized crime', 'extortion', 'corruption', 'assault', 'arson']
}

export function findDomainForCase(caseItem, domains = []) {
  const caseType = caseItem?.type?.toLowerCase() || ''
  const caseTitle = caseItem?.title?.toLowerCase() || ''
  const searchable = `${caseType} ${caseTitle}`

  return domains.find((domain) => {
    const code = domain.crimeCode
    const aliases = typeAliases[code] || []
    return aliases.some((alias) => searchable.includes(alias))
  }) || domains.find((domain) => searchable.includes(domain.name?.toLowerCase())) || null
}

export function getCaseDomainName(caseItem, domains = []) {
  return findDomainForCase(caseItem, domains)?.name || caseItem?.type || 'Unclassified'
}

export function getCasesForDomain(cases = [], domain, domains = []) {
  if (!domain) return []
  return cases.filter((caseItem) => {
    const matchedDomain = findDomainForCase(caseItem, domains)
    return matchedDomain?.id === domain.id || matchedDomain?.crimeCode === domain.crimeCode
  })
}

export function findDomainForAlert(alert, cases = [], domains = []) {
  const relatedCase = cases.find((caseItem) => {
    return alert?.location && caseItem.location?.toLowerCase() === alert.location.toLowerCase()
  })

  if (relatedCase) return findDomainForCase(relatedCase, domains)

  const title = alert?.title?.toLowerCase() || ''
  return domains.find((domain) => {
    const aliases = typeAliases[domain.crimeCode] || []
    return aliases.some((alias) => title.includes(alias))
  }) || null
}
