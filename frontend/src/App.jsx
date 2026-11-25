
import { useEffect, useState } from 'react'
import {
  ShieldCheck, Activity, Database, Globe, RefreshCw, Search,
  Server, ShieldAlert, ArrowLeft, Clock3, Fingerprint, Filter, X
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

  // IOC filtering states
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [riskFilter, setRiskFilter] = useState('ALL')
  const [sourceFilter, setSourceFilter] = useState('ALL')

  const [scores, setScores] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState('')

  const [selectedIocId, setSelectedIocId] = useState(null)
  const [selectedIoc, setSelectedIoc] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Fetch IOC data and statistics
  const fetchData = async () => {
    try {
      setRefreshing(true)
      setError('')

      const [iocData, statsData] = await Promise.all([
        getIocs(),
        getIocStats(),
      ])

      setIocs(Array.isArray(iocData) ? iocData : [])
      setStats(statsData || {})

    } catch (err) {
      console.error('DASHBOARD LOAD ERROR:', err)

      setError(
        'Unable to connect to backend. Check whether Spring Boot is running on port 8080.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Get available IOC types dynamically
  const availableTypes = [
    ...new Set(iocs.map(ioc => ioc.type).filter(Boolean))
  ].sort()

  // Get available intelligence sources dynamically
  const availableSources = [
    ...new Set(iocs.map(ioc => ioc.source).filter(Boolean))
  ].sort()

  // Check active filters
  const hasActiveFilters =
    search.trim() !== '' ||
    typeFilter !== 'ALL' ||
    riskFilter !== 'ALL' ||
    sourceFilter !== 'ALL'

  // Reset all filters
  const resetFilters = () => {
    setSearch('')
    setTypeFilter('ALL')
    setRiskFilter('ALL')
    setSourceFilter('ALL')
  }

  // Update IOC risk score
  const handleUpdate = async (id) => {
    const score = Number(scores[id])

    if (
      scores[id] === undefined ||
      scores[id] === '' ||
      !Number.isInteger(score) ||
      score < 0 ||
      score > 100
    ) {
      alert('Enter a valid risk score between 0 and 100.')
      return
    }

    try {
      setUpdatingId(id)
      setError('')

      await updateRiskScore(id, score)

      const [updatedIocs, updatedStats] = await Promise.all([
        getIocs(),
        getIocStats(),
      ])

      setIocs(Array.isArray(updatedIocs) ? updatedIocs : [])
      setStats(updatedStats || {})

      setScores(prev => ({
        ...prev,
        [id]: '',
      }))

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

  // View individual IOC details
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

  // Return to dashboard
  const handleBackToDashboard = () => {
    setSelectedIocId(null)
    setSelectedIoc(null)
    setError('')
  }

  // Advanced IOC filtering
  const filteredIocs = iocs.filter(ioc => {
    const searchText = search.trim().toLowerCase()

    const matchesSearch =
      !searchText ||
      [
        ioc.value,
        ioc.type,
        ioc.source,
        ioc.riskLevel,
        ioc.id,
      ].some(value =>
        String(value ?? '').toLowerCase().includes(searchText)
      )

    const matchesType =
      typeFilter === 'ALL' ||
      String(ioc.type || '').toUpperCase() === typeFilter.toUpperCase()

    const matchesRisk =
      riskFilter === 'ALL' ||
      String(ioc.riskLevel || 'UNASSESSED').toUpperCase() === riskFilter

    const matchesSource =
      sourceFilter === 'ALL' ||
      String(ioc.source || '').toLowerCase() === sourceFilter.toLowerCase()

    return matchesSearch && matchesType && matchesRisk && matchesSource
  })

  // Dynamic risk distribution
  const riskCounts = [
    'CRITICAL',
    'HIGH',
    'MEDIUM',
    'LOW',
    'UNASSESSED'
  ].map(level => ({
    name: level,
    value: iocs.filter(
      ioc => (ioc.riskLevel || 'UNASSESSED').toUpperCase() === level
    ).length,
  })).filter(item => item.value > 0)

  // Dashboard statistics
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
    {
      title: 'Total URLs',
      value: stats.totalURLs ?? 0,
      icon: Activity,
      color: 'blue',
    },
    {
      title: 'Total Hashes',
      value: stats.totalHashes ?? 0,
      icon: Fingerprint,
      color: 'purple',
    },
  ]

  return (
    <div className="app">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={27} />
          </div>

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
          <Activity size={19} />
          Dashboard
        </button>

        <button
          className={`nav-item ${selectedIocId !== null ? 'active' : ''}`}
          onClick={() => {
            if (iocs.length > 0) {
              handleViewDetails(iocs[0].id)
            }
          }}
          disabled={iocs.length === 0}
        >
          <ShieldAlert size={19} />
          Threat Analysis
        </button>

        <div className="sidebar-bottom">

          <div className="system-status">
            <span className="online-dot"></span>

            <div>
              <strong>System Status</strong>
              <p>Monitoring Active</p>
            </div>
          </div>

          <p className="version">
            CLOUD THREAT INTEL · v1.0
          </p>

        </div>

      </aside>

      {/* Main Content */}
      <main className="main">

        {selectedIocId !== null ? (

          /* IOC Threat Analysis */
          <section className="panel threat-detail">

            <button
              className="refresh-btn back-btn"
              onClick={handleBackToDashboard}
            >
              <ArrowLeft size={16} />
              Back to Dashboard
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
                    <p className="breadcrumb">
                      THREAT INTELLIGENCE / ANALYSIS
                    </p>

                    <h1>Threat Analysis</h1>
                    <h2>{selectedIoc.value}</h2>
                    <p>Indicator ID: #{selectedIoc.id}</p>
                  </div>

                  <span className={`risk-badge ${(selectedIoc.riskLevel || 'UNASSESSED').toLowerCase()}`}>
                    {selectedIoc.riskLevel || 'UNASSESSED'}
                  </span>

                </div>

                {error && (
                  <div className="error-message">{error}</div>
                )}

                <div className="detail-grid">

                  <div className="detail-card">
                    <div className="detail-card-label">
                      <ShieldAlert size={17} />
                      Risk Score
                    </div>

                    <h2>
                      {selectedIoc.riskScore == null
                        ? 'Not assessed'
                        : `${selectedIoc.riskScore}/100`}
                    </h2>
                  </div>

                  <div className="detail-card">
                    <div className="detail-card-label">
                      <Fingerprint size={17} />
                      Indicator Type
                    </div>
                    <h2>{selectedIoc.type || 'Unknown'}</h2>
                  </div>

                  <div className="detail-card">
                    <div className="detail-card-label">
                      <Database size={17} />
                      Intelligence Source
                    </div>
                    <h2>{selectedIoc.source || 'Unknown'}</h2>
                  </div>

                  <div className="detail-card">
                    <div className="detail-card-label">
                      <Activity size={17} />
                      Risk Level
                    </div>
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

          /* Main Dashboard */
          <>

            {/* Header */}
            <header className="topbar">

              <div>
                <p className="breadcrumb">OVERVIEW / DASHBOARD</p>
                <h1>Security Dashboard</h1>
              </div>

              <button
                className="refresh-btn"
                onClick={fetchData}
                disabled={refreshing}
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? 'loading-icon' : ''}
                />
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </button>

            </header>

            {error && (
              <div className="error-message">{error}</div>
            )}

            {/* Welcome Section */}
            <section className="welcome">

              <div>
                <span className="welcome-tag">
                  THREAT MONITORING CENTER
                </span>

                <h2>Threat Intelligence Overview</h2>

                <p>
                  Monitor, analyze and manage your cyber threat indicators.
                </p>
              </div>

              <div className="welcome-icon">
                <ShieldCheck size={65} />
              </div>

            </section>

            {/* Statistics Cards */}
            <section className="stats-grid">

              {statCards.map(card => {
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

            {/* Charts and Summary */}
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
                              <Cell
                                key={item.name}
                                fill={COLORS[item.name]}
                              />
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
                  <div className="empty-chart">
                    No IOC data available
                  </div>
                )}

              </div>

              {/* Threat Summary */}
              <div className="panel summary-panel">

                <div className="panel-heading">
                  <div>
                    <h3>Threat Summary</h3>
                    <p>Current monitoring statistics</p>
                  </div>
                  <ShieldCheck size={19} />
                </div>

                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(level => (

                  <div className="summary-item" key={level}>
                    <span>
                      {level.charAt(0) + level.slice(1).toLowerCase()} Threats
                    </span>

                    <strong className={`${level.toLowerCase()}-text`}>
                      {iocs.filter(
                        i => (i.riskLevel || '').toUpperCase() === level
                      ).length}
                    </strong>
                  </div>

                ))}

                <div className="summary-footer">
                  <span className="online-dot"></span>
                  Live backend data
                </div>

              </div>

            </section>

            {/* IOC Table and Advanced Filters */}
            <section className="panel table-panel">

              <div className="table-heading">

                <div>
                  <h3>Threat Intelligence Indicators</h3>
                  <p>
                    Manage, search and filter collected indicators of compromise
                  </p>
                </div>

                <div className="search-box">
                  <Search size={17} />

                  <input
                    type="text"
                    placeholder="Search IP, domain, hash..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

              </div>

              {/* Advanced Filters */}
              <div className="ioc-filter-toolbar">

                <div className="filter-title">
                  <Filter size={17} />
                  <span>Filter IOCs</span>
                </div>

                <div className="filter-controls">

                  <select
                    className="filter-select"
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    aria-label="Filter by IOC type"
                  >
                    <option value="ALL">All Types</option>

                    {availableTypes.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <select
                    className="filter-select"
                    value={riskFilter}
                    onChange={e => setRiskFilter(e.target.value)}
                    aria-label="Filter by risk level"
                  >
                    <option value="ALL">All Risk Levels</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                    <option value="UNASSESSED">Unassessed</option>
                  </select>

                  <select
                    className="filter-select"
                    value={sourceFilter}
                    onChange={e => setSourceFilter(e.target.value)}
                    aria-label="Filter by intelligence source"
                  >
                    <option value="ALL">All Sources</option>

                    {availableSources.map(source => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>

                  <button
                    className="reset-filter-btn"
                    onClick={resetFilters}
                    disabled={!hasActiveFilters}
                  >
                    <X size={15} />
                    Reset Filters
                  </button>

                </div>

              </div>

              {/* Filter Results */}
              <div className="filter-result-info">

                <span>
                  Showing <strong>{filteredIocs.length}</strong> of{' '}
                  <strong>{iocs.length}</strong> indicators
                </span>

                {hasActiveFilters && (
                  <span className="active-filter-label">
                    Filters applied
                  </span>
                )}

              </div>

              {/* IOC Table */}
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

                        <td>{ioc.type || 'Unknown'}</td>
                        <td>{ioc.source || 'Unknown'}</td>
                        <td>{ioc.riskScore ?? '—'}</td>

                        <td>
                          <span className={`risk-badge ${(ioc.riskLevel || 'UNASSESSED').toLowerCase()}`}>
                            {ioc.riskLevel || 'UNASSESSED'}
                          </span>
                        </td>

                        <td>
                          <div className="update-control">

                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              placeholder="0-100"
                              value={scores[ioc.id] ?? ''}
                              onChange={e =>
                                setScores(prev => ({
                                  ...prev,
                                  [ioc.id]: e.target.value,
                                }))
                              }
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
                          No indicators match your search or filters.
                        </td>
                      </tr>
                    )}

                  </tbody>

                </table>

              </div>

              {/* Table Footer */}
              <div className="table-footer">

                <span>
                  {filteredIocs.length} indicators displayed
                </span>

                <span>
                  <span className="online-dot"></span>
                  Connected to API
                </span>

              </div>

            </section>

            {/* Footer */}
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
