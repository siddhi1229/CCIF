import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Cases from './pages/Cases.jsx'
import AddCase from './pages/AddCase.jsx'
import CaseDetail from './pages/CaseDetail.jsx'
import Suspects from './pages/Suspects.jsx'
import SuspectProfile from './pages/SuspectProfile.jsx'
import Alerts from './pages/Alerts.jsx'
import AlertDetail from './pages/AlertDetail.jsx'
import IntelligenceGraph from './pages/IntelligenceGraph.jsx'
import CrimeDomains from './pages/CrimeDomains.jsx'
import CrimeDomainDetail from './pages/CrimeDomainDetail.jsx'
import Login from './pages/Login.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/new" element={<AddCase />} />
          <Route path="/cases/:caseId" element={<CaseDetail />} />
          <Route path="/suspects" element={<Suspects />} />
          <Route path="/suspects/:suspectId" element={<SuspectProfile />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/alerts/:alertId" element={<AlertDetail />} />
          <Route path="/graph" element={<IntelligenceGraph />} />
          <Route path="/crime-domains" element={<CrimeDomains />} />
          <Route path="/crime-domains/:domainId" element={<CrimeDomainDetail />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
