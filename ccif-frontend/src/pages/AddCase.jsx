import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Fingerprint,
  Gauge,
  MapPin,
  Save,
  ShieldCheck,
  UserRound,
  Users
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import HoloPanel from '../components/HoloPanel.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { createCase } from '../services/caseService.js'
import { findSuspectByName, createLocalSuspect, generateSuspectId } from '../services/suspectService.js'
import { addLocalGraphRelationships } from '../services/graphService.js'
import { getCrimeCategories } from '../services/crimeService.js'
import { getOfficers } from '../services/officerService.js'

const statuses = ['Active', 'Critical', 'Review', 'Closed', 'Cold']

function generateCaseId() {
  const bytes = new Uint16Array(1)
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes)
    return `C-${String(1000 + (bytes[0] % 9000)).padStart(4, '0')}`
  }
  return `C-${Math.floor(1000 + Math.random() * 9000)}`
}

const today = new Date().toISOString().slice(0, 10)

export default function AddCase() {
  const navigate = useNavigate()
  const generatedId = useMemo(() => generateCaseId(), [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [crimeTypes, setCrimeTypes] = useState(['Cargo Theft', 'Cyber Fraud', 'Assault', 'Smuggling', 'Burglary', 'Extortion', 'Arson', 'Financial Crime', 'Corruption', 'Weapons', 'Auto Theft'])
  const [officers, setOfficers] = useState([])

  const [form, setForm] = useState({
    id: generatedId,
    title: '',
    type: 'Cargo Theft',
    location: '',
    officer: '',
    status: 'Active',
    date: today,
    trust: 75,
    summary: '',
    primarySuspect: '',
    gang: '',
    description: ''
  })

  useEffect(() => {
    async function loadOptions() {
      const [domainsData, officersData] = await Promise.all([getCrimeCategories(), getOfficers()])
      if (domainsData.length) setCrimeTypes(domainsData.map((d) => d.name))
      setOfficers(officersData)
    }
    loadOptions()
  }, [])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const payload = {
      id: form.id,
      title: form.title.trim(),
      type: form.type,
      location: form.location.trim(),
      officer: form.officer.trim(),
      status: form.status,
      date: form.date,
      trust: Number(form.trust),
      summary: (form.description.trim() || form.summary.trim())
    }

    if (!payload.title || !payload.location || !payload.officer || !payload.summary) {
      setError('Please fill in Case Title, Location, Assigned Officer, and Description.')
      return
    }

    setSaving(true)

    try {
      // 1. Create the case
      const created = await createCase(payload)

      // 2. Handle suspect (create new or find existing)
      let suspect = null
      if (form.primarySuspect.trim()) {
        suspect = await findSuspectByName(form.primarySuspect.trim())
        if (!suspect) {
          suspect = createLocalSuspect({
            id: generateSuspectId(),
            name: form.primarySuspect.trim(),
            age: null,
            risk: 65,
            gang: form.gang.trim() || 'Unknown',
            location: form.location.trim(),
            photo: form.primarySuspect.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2),
            associations: [],
            crimes: [created.id]
          })
        }
      }

      // 3. Update intelligence graph
      addLocalGraphRelationships({
        caseId: created.id,
        caseTitle: created.title,
        suspectId: suspect?.id || null,
        suspectName: suspect?.name || null,
        gangName: form.gang.trim() || null,
        domainName: form.type
      })

      navigate(`/cases/${created.id}`)
    } catch (err) {
      console.error(err)
      setError('Failed to save the case. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 pb-20 lg:pb-6">
      <PageHeader eyebrow="Case Intake" title="Add Investigation" summary="Register a new case with the operational details needed by the intelligence fabric.">
        <Link to="/cases" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200 transition hover:border-cyan-300/30 hover:text-cyan-100">
          <ArrowLeft size={17} />
          Back
        </Link>
      </PageHeader>

      <form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <HoloPanel as="div" className="p-6">
          <div className="grid gap-5 md:grid-cols-2">

            <Field icon={Fingerprint} label="Case ID">
              <input className="field-input font-mono text-cyan-100" value={form.id} readOnly />
            </Field>

            <Field icon={BadgeCheck} label="Status">
              <select className="field-input" value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>

            <Field icon={ShieldCheck} label="Case Title" className="md:col-span-2">
              <input
                className="field-input"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Harbor Container Theft"
                required
              />
            </Field>

            <Field icon={Gauge} label="Crime Domain">
              <select className="field-input" value={form.type} onChange={(e) => updateField('type', e.target.value)}>
                {crimeTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>

            <Field icon={MapPin} label="Location">
              <input
                className="field-input"
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="Chennai Port"
                required
              />
            </Field>

            <Field icon={UserRound} label="Assigned Officer">
              {officers.length > 0 ? (
                <select className="field-input" value={form.officer} onChange={(e) => updateField('officer', e.target.value)}>
                  <option value="">Select officer…</option>
                  {officers.map((o) => (
                    <option key={o.id || o.name} value={o.name}>{o.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="field-input"
                  value={form.officer}
                  onChange={(e) => updateField('officer', e.target.value)}
                  placeholder="ACP R. Iyer"
                  required
                />
              )}
            </Field>

            <Field icon={CalendarDays} label="Date Opened">
              <input
                className="field-input"
                type="date"
                value={form.date}
                onChange={(e) => updateField('date', e.target.value)}
                required
              />
            </Field>

            {/* Separator */}
            <div className="md:col-span-2">
              <p className="mb-3 text-xs uppercase tracking-[0.14em] text-cyan-300/70">Suspect Information</p>
              <div className="grid gap-5 md:grid-cols-2">
                <Field icon={UserRound} label="Primary Suspect">
                  <input
                    className="field-input"
                    value={form.primarySuspect}
                    onChange={(e) => updateField('primarySuspect', e.target.value)}
                    placeholder="Ravi Kumar"
                  />
                  <p className="mt-1 text-xs text-zinc-500">Automatically linked or created in suspect registry</p>
                </Field>

                <Field icon={Users} label="Gang / Criminal Group">
                  <input
                    className="field-input"
                    value={form.gang}
                    onChange={(e) => updateField('gang', e.target.value)}
                    placeholder="Marina Syndicate"
                  />
                </Field>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <label className="text-sm text-zinc-300">Trust Score</label>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-1 text-sm text-cyan-100">{form.trust}%</span>
              </div>
              <input
                className="mt-4 w-full accent-cyan-300"
                type="range"
                min="0"
                max="100"
                value={form.trust}
                onChange={(e) => updateField('trust', e.target.value)}
              />
            </div>

            <Field icon={ShieldCheck} label="Description" className="md:col-span-2">
              <textarea
                className="field-input min-h-36 resize-y leading-7"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe the incident pattern, key indicators, and current intelligence posture."
                required
              />
            </Field>
          </div>

          {error && (
            <p className="mt-5 rounded-2xl border border-red-300/20 bg-red-300/[0.08] px-4 py-3 text-sm text-red-100">{error}</p>
          )}

          <div className="mt-7 flex justify-end">
            <motion.button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              whileTap={{ scale: 0.97 }}
            >
              <Save size={17} />
              {saving ? 'Saving…' : 'Save Case'}
            </motion.button>
          </div>
        </HoloPanel>

        <HoloPanel as="aside" className="p-6">
          <p className="text-sm text-cyan-200">Case Packet</p>
          <div className="mt-6 space-y-4">
            <PreviewItem label="Identifier" value={form.id} />
            <PreviewItem label="Crime Domain" value={form.type} />
            <PreviewItem label="Lead Officer" value={form.officer || 'Unassigned'} />
            <PreviewItem label="Location" value={form.location || 'Pending'} />
            <PreviewItem label="Opened" value={form.date} />
            {form.primarySuspect && <PreviewItem label="Primary Suspect" value={form.primarySuspect} />}
            {form.gang && <PreviewItem label="Gang" value={form.gang} />}
          </div>
          <div className="mt-7 rounded-[1.4rem] border border-cyan-300/15 bg-cyan-300/[0.06] p-5 text-center">
            <p className="text-5xl font-semibold text-white">{form.trust}%</p>
            <p className="mt-2 text-sm text-zinc-400">initial trust score</p>
          </div>
          {form.primarySuspect && (
            <div className="mt-4 rounded-[1.4rem] border border-violet-300/15 bg-violet-300/[0.06] p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-violet-300/80">Graph</p>
              <p className="mt-2 text-xs text-zinc-300 leading-5">
                {form.primarySuspect} → {form.id}<br />
                {form.gang && `${form.gang} → ${form.primarySuspect}`}
              </p>
            </div>
          )}
        </HoloPanel>
      </form>
    </div>
  )
}

function Field({ icon: Icon, label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 flex items-center gap-2 text-sm text-zinc-300">
        <Icon size={16} className="text-cyan-200" />
        {label}
      </span>
      {children}
    </label>
  )
}

function PreviewItem({ label, value }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs uppercase text-zinc-500">{label}</p>
      <p className="mt-2 text-sm text-zinc-100">{value}</p>
    </div>
  )
}
