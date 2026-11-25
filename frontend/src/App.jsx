import { useEffect, useState } from 'react'
import {
  ShieldCheck, Activity, Database, Globe, RefreshCw, Search,
  Server, ShieldAlert, ArrowLeft, Clock3, Fingerprint
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  getIocs,
  getIocStats,
  updateRiskScore,
  getIocById
} from './api'
import './App.css'

const COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
  UNASSESSED: '#64748b',
}

function App() {
  const [iocs, setIocs] = useState([])
  const [stats, setStats] = useState({})
  const [search, setSearch] = useState('')
  const [scores, setScores] = useState({})
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState('')

  // State for the IOC Threat Analysis detail view
  const [selectedIocId, setSelectedIocId] = useState(null)
  const [selectedIoc, setSelectedIoc] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchData = async () => {
    try {
      setError('')
      const [iocData, statsData] = await Promise.all([
        getIocs(),
        getIocStats(),
      ])
      setIocs(iocData)
      setStats(statsData)
    } catch (err) {
      setError('Unable to connect to backend. Check whether Spring Boot is running on port 8080.')
      console.error('DASHBOARD LOAD ERROR:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleUpdate = async (id) => {
    const score = Number(scores[id])

    if (!Number.isInteger(score) || score < 0 || score > 100) {
      alert('Enter a valid risk score between 0 and 100.')
      return
    }

    try {
      setUpdatingId(id)
      const result = await updateRiskScore(id, score)
      console.log('PATCH SUCCESS:', result)

      const [updatedIocs, updatedStats] = await Promise.all([
        getIocs(),
        getIocStats(),
      ])

      setIocs(updatedIocs)
      setStats(updatedStats)
      setScores(prev => ({ ...prev, [id]: '' }))

      // If the detail view for this IOC is open, refresh it too.
      if (selectedIocId === id) {
        const updatedDetail = await getIocById(id)
        setSelectedIoc(updatedDetail)
      }
    } catch (err) {
      console.error('UPDATE ERROR:', err)
      alert(
        err.response?.data?.message ||
        err.message ||
        'Unable to update risk score.'
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const handleViewDetails = async (id) => {
    setSelectedIocId(id)
    setSelectedIoc(null)
    setDetailLoading(true)
    setError('')

    try {
      const data = await getIocById(id)
      setSelectedIoc(data)
    } catch (err) {
      console.error('IOC DETAILS ERROR:', err)
      setError('Unable to load IOC details. Please try again.')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleBackToDashboard = () => {
    setSelectedIocId(null)
    setSelectedIoc(null)
    setError('')
  }

  const filteredIocs = iocs.filter(ioc =>
    `${ioc.value} ${ioc.type} ${ioc.source} ${ioc.riskLevel}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const riskCounts = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNASSESSED']
    .map(level => ({
      name: level,
      value: iocs.filter(ioc => ioc.riskLevel === level).length,
    }))
    .filter(item => item.value > 0)

  const statCards = [
    {
      title: 'Total Indicators',
      value: stats.totalIocs ?? 0,
      icon: Database,
      color: 'blue',
    },
    {
      title: 'High Risk IOCs',
      value: stats.highRiskIocs ?? 0,
      icon: ShieldAlert,
      color: 'red',
    },
    {
      title: 'Total IP Addresses',
      value: stats.totalIPs ?? 0,
      icon: Server,
      color: 'purple',
    },
    {
      title: 'Total Domains',
      value: stats.totalDomains ?? 0,
      icon: Globe,
      color: 'green',
    },
  ]

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><ShieldCheck size={27} /></div>
          <div>
            <h2>THREAT<span>INTEL</span></h2>
            <p>SECURITY PLATFORM</p>
          </div>
        </div>

        <div className="nav-label">MAIN MENU</div>
        <button
          className={`nav-item ${selectedIocId === null ? 'active' : ''}`}
          onClick={handleBackToDashboard}
        >
          <Activity size={19} /> Dashboard
        </button>
        <button
          className={`nav-item ${selectedIocId !== null ? 'active' : ''}`}
          onClick={() => {
            if (iocs.length > 0) handleViewDetails(iocs[0].id)
          }}
          disabled={iocs.length === 0}
        >
          <ShieldAlert size={19} /> Threat Analysis
        </button>

        <div className="sidebar-bottom">
          <div className="system-status">
            <span className="online-dot"></span>
            <div>
              <strong>System Status</strong>
              <p>Monitoring Active</p>
            </div>
          </div>
          <p className="version">CLOUD THREAT INTEL · v1.0</p>
        </div>
      </aside>

      <main className="main">
        {selectedIocId !== null ? (
          <section className="panel threat-detail">
            <button className="refresh-btn back-btn" onClick={handleBackToDashboard}>
              <ArrowLeft size={16} /> Back to Dashboard
            </button>

            {detailLoading ? (
              <div className="detail-loading">
                <RefreshCw size={22} className="loading-icon" />
                <p>Loading IOC details...</p>
              </div>
            ) : selectedIoc ? (
              <>
                <div className="detail-header">
                  <div>
                    <p className="breadcrumb">THREAT INTELLIGENCE / ANALYSIS</p>
                    <h1>Threat Analysis</h1>
                    <h2>{selectedIoc.value}</h2>
                    <p>Indicator ID: #{selectedIoc.id}</p>
                  </div>
                  <span className={`risk-badge ${selectedIoc.riskLevel?.toLowerCase()}`}>
                    {selectedIoc.riskLevel || 'UNASSESSED'}
                  </span>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="detail-grid">
                  <div className="detail-card">
                    <div className="detail-card-label"><ShieldAlert size={17} /> Risk Score</div>
                    <h2>
                      {selectedIoc.riskScore == null
                        ? 'Not assessed'
                        : `${selectedIoc.riskScore}/100`}
                    </h2>
                  </div>
                  <div className="detail-card">
                    <div className="detail-card-label"><Fingerprint size={17} /> Indicator Type</div>
                    <h2>{selectedIoc.type || 'Unknown'}</h2>
                  </div>
                  <div className="detail-card">
                    <div className="detail-card-label"><Database size={17} /> Intelligence Source</div>
                    <h2>{selectedIoc.source || 'Unknown'}</h2>
                  </div>
                  <div className="detail-card">
                    <div className="detail-card-label"><Activity size={17} /> Risk Level</div>
                    <h2>{selectedIoc.riskLevel || 'UNASSESSED'}</h2>
                  </div>
                </div>

                <div className="detail-card timeline-card">
                  <div className="timeline-heading">
                    <Clock3 size={19} />
                    <h3>Indicator Timeline</h3>
                  </div>
                  <div className="timeline-row">
                    <span>First Seen</span>
                    <strong>
                      {selectedIoc.firstSeen
                        ? new Date(selectedIoc.firstSeen).toLocaleString()
                        : 'Unavailable'}
                    </strong>
                  </div>
                  <div className="timeline-row">
                    <span>Last Updated</span>
                    <strong>
                      {selectedIoc.lastUpdated
                        ? new Date(selectedIoc.lastUpdated).toLocaleString()
                        : 'Unavailable'}
                    </strong>
                  </div>
                </div>
              </>
            ) : (
              <div className="detail-loading">
                <p>{error || 'IOC details are not available.'}</p>
              </div>
            )}
          </section>
        ) : (
          <>
            <header className="topbar">
              <div>
                <p className="breadcrumb">OVERVIEW / DASHBOARD</p>
                <h1>Security Dashboard</h1>
              </div>
              <button className="refresh-btn" onClick={fetchData}>
                <RefreshCw size={16} /> Refresh Data
              </button>
            </header>

            {error && <div className="error-message">{error}</div>}

            <section className="welcome">
              <div>
                <span className="welcome-tag">THREAT MONITORING CENTER</span>
                <h2>Threat Intelligence Overview</h2>
                <p>Monitor, analyze and manage your cyber threat indicators.</p>
              </div>
              <div className="welcome-icon"><ShieldCheck size={65} /></div>
            </section>

            <section className="stats-grid">
              {statCards.map((card) => {
                const Icon = card.icon
                return (
                  <div className="stat-card" key={card.title}>
                    <div className={`stat-icon ${card.color}`}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <p>{card.title}</p>
                      <h2>{loading ? '...' : card.value}</h2>
                    </div>
                  </div>
                )
              })}
            </section>

            <section className="content-grid">
              <div className="panel chart-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Risk Distribution</h3>
                    <p>IOC severity breakdown</p>
                  </div>
                  <Activity size={19} />
                </div>

                {riskCounts.length > 0 ? (
                  <>
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={riskCounts}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={95}
                            paddingAngle={4}
                          >
                            {riskCounts.map(item => (
                              <Cell key={item.name} fill={COLORS[item.name]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: '#172033',
                              border: '1px solid #334155',
                              borderRadius: '8px',
                              color: '#fff',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="legend">
                      {riskCounts.map(item => (
                        <div className="legend-item" key={item.name}>
                          <span
                            className="legend-dot"
                            style={{ background: COLORS[item.name] }}
                          />
                          {item.name}
                          <strong>{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="empty-chart">No IOC data available</div>
                )}
              </div>

              <div className="panel summary-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Threat Summary</h3>
                    <p>Current monitoring statistics</p>
                  </div>
                  <ShieldCheck size={19} />
                </div>

                <div className="summary-item">
                  <span>Critical Threats</span>
                  <strong className="critical-text">
                    {iocs.filter(i => i.riskLevel === 'CRITICAL').length}
                  </strong>
                </div>
                <div className="summary-item">
                  <span>High Threats</span>
                  <strong className="high-text">
                    {iocs.filter(i => i.riskLevel === 'HIGH').length}
                  </strong>
                </div>
                <div className="summary-item">
                  <span>Medium Threats</span>
                  <strong className="medium-text">
                    {iocs.filter(i => i.riskLevel === 'MEDIUM').length}
                  </strong>
                </div>
                <div className="summary-item">
                  <span>Low Threats</span>
                  <strong className="low-text">
                    {iocs.filter(i => i.riskLevel === 'LOW').length}
                  </strong>
                </div>

                <div className="summary-footer">
                  <span className="online-dot"></span>
                  Live backend data
                </div>
              </div>
            </section>

            <section className="panel table-panel">
              <div className="table-heading">
                <div>
                  <h3>Threat Intelligence Indicators</h3>
                  <p>Manage and monitor collected indicators of compromise</p>
                </div>
                <div className="search-box">
                  <Search size={17} />
                  <input
                    type="text"
                    placeholder="Search indicators..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>INDICATOR</th>
                      <th>TYPE</th>
                      <th>SOURCE</th>
                      <th>RISK SCORE</th>
                      <th>RISK LEVEL</th>
                      <th>UPDATE SCORE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIocs.map(ioc => (
                      <tr key={ioc.id}>
                        <td>#{ioc.id}</td>
                        <td>
                          <button
                            type="button"
                            className="indicator-link"
                            onClick={() => handleViewDetails(ioc.id)}
                            title="View threat analysis"
                          >
                            {ioc.value}
                          </button>
                        </td>
                        <td>{ioc.type}</td>
                        <td>{ioc.source}</td>
                        <td>{ioc.riskScore ?? '—'}</td>
                        <td>
                          <span className={`risk-badge ${ioc.riskLevel?.toLowerCase()}`}>
                            {ioc.riskLevel}
                          </span>
                        </td>
                        <td>
                          <div className="update-control">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0-100"
                              value={scores[ioc.id] ?? ''}
                              onChange={e => setScores(prev => ({
                                ...prev,
                                [ioc.id]: e.target.value,
                              }))}
                            />
                            <button
                              disabled={updatingId === ioc.id}
                              onClick={() => handleUpdate(ioc.id)}
                            >
                              {updatingId === ioc.id ? '...' : 'Save'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!loading && filteredIocs.length === 0 && (
                      <tr>
                        <td colSpan="7" className="empty-table">
                          No indicators found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="table-footer">
                <span>Showing {filteredIocs.length} indicators</span>
                <span><span className="online-dot"></span> Connected to API</span>
              </div>
            </section>

            <footer>
              CLOUD THREAT INTELLIGENCE PLATFORM · BUILT WITH SPRING BOOT & REACT
            </footer>
          </>
        )}
      </main>
    </div>
  )
}

export default App
