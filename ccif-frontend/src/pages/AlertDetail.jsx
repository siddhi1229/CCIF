import { ArrowLeft } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAlerts } from '../services/alertService.js'
import { getCases } from '../services/caseService.js'
import { getCrimeCategories } from '../services/crimeService.js'
import { findDomainForAlert, findDomainForCase } from '../utils/crimeDomain.js'

export default function AlertDetail() {
  const { alertId } = useParams()
  const [alerts, setAlerts] = useState([])
  const [cases, setCases] = useState([])
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAlert() {
      const [alertData, caseData, domainData] = await Promise.all([
        getAlerts(),
        getCases(),
        getCrimeCategories()
      ])
      setAlerts(alertData)
      setCases(caseData)
      setDomains(domainData)
      setLoading(false)
    }

    loadAlert()
  }, [])

  const alert = alerts.find((item) => item.id === alertId)
  const linkedDomain = alert ? findDomainForAlert(alert, cases, domains) : null
  const linkedCases = useMemo(() => {
    if (!alert) return []
    return cases.filter((caseItem) => {
      const sameLocation = alert.location && caseItem.location?.toLowerCase() === alert.location.toLowerCase()
      const sameDomain = linkedDomain && findDomainForCase(caseItem, domains)?.id === linkedDomain.id
      return sameLocation || sameDomain
    }).slice(0, 6)
  }, [alert, cases, domains, linkedDomain])

  if (loading) {
    return <div className="text-zinc-300">Loading alert...</div>
  }

  if (!alert) {
    return (
      <div className="space-y-4">
        <Link to="/alerts" className="inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-cyan-100">
          <ArrowLeft size={17} />
          Alerts
        </Link>
        <p className="text-zinc-200">Alert not found.</p>
      </div>
    )
  }

  const recommendedAction = linkedDomain
    ? `Dispatch ${linkedDomain.assignedUnit}`
    : 'Review alert and assign an investigative unit'

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <section className="rounded-lg border border-white/[0.08] bg-zinc-950/55 p-5 shadow-[0_16px_48px_rgba(0,0,0,.26)] backdrop-blur-xl">
        <Link to="/alerts" className="inline-flex items-center gap-2 text-sm text-cyan-200 transition hover:text-cyan-100">
          <ArrowLeft size={17} />
          Alerts
        </Link>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-cyan-300">{alert.id}</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">{alert.title}</h1>
          </div>
          <SeverityBadge value={alert.severity} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="rounded-lg border border-white/[0.08] bg-zinc-950/55 p-5 shadow-[0_16px_48px_rgba(0,0,0,.26)] backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Alert Details</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <DetailItem label="Alert ID" value={alert.id} />
            <DetailItem label="Alert Type" value={alert.title} />
            <DetailItem label="Severity" value={alert.severity} />
            <DetailItem label="Location" value={alert.location} />
            <DetailItem label="Timestamp" value={alert.time} />
            <DetailItem label="Linked Crime Domain" value={linkedDomain?.name || 'Unclassified'} />
          </div>
          <div className="mt-5 rounded-lg border border-white/[0.07] bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Description</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              {alert.title} reported at {alert.location}. Signal confidence: {alert.signal ?? 'N/A'}.
            </p>
          </div>
          <div className="mt-4 rounded-lg border border-cyan-300/15 bg-cyan-300/[0.07] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-300/80">Recommended Action</p>
            <p className="mt-2 text-sm font-medium text-cyan-50">{recommendedAction}</p>
          </div>
        </div>

        <aside className="rounded-lg border border-white/[0.08] bg-zinc-950/55 p-5 shadow-[0_16px_48px_rgba(0,0,0,.26)] backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Linked Cases</h2>
          <div className="mt-4 space-y-3">
            {linkedCases.length ? linkedCases.map((caseItem) => (
              <Link key={caseItem.id} to={`/cases/${caseItem.id}`} className="block rounded-lg border border-white/[0.07] bg-black/20 p-4 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.05]">
                <p className="font-mono text-sm text-cyan-100">{caseItem.id}</p>
                <p className="mt-2 text-sm font-medium text-white">{caseItem.title}</p>
                <p className="mt-1 text-xs text-zinc-500">{caseItem.status} / {caseItem.location}</p>
              </Link>
            )) : (
              <p className="text-sm text-zinc-400">No linked cases identified.</p>
            )}
          </div>
        </aside>
      </section>
    </div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-2 text-sm text-zinc-100">{value}</p>
    </div>
  )
}

function SeverityBadge({ value }) {
  const normalized = value?.toLowerCase()
  const className = normalized === 'critical'
    ? 'border-red-300/20 bg-red-300/[0.08] text-red-100'
    : normalized === 'high'
      ? 'border-amber-300/20 bg-amber-300/[0.08] text-amber-100'
      : 'border-cyan-300/18 bg-cyan-300/[0.07] text-cyan-100'

  return <span className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-sm font-medium ${className}`}>{value} Severity</span>
}
