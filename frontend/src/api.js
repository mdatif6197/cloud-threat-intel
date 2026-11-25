
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

export const getIocs = async () => {
  const response = await api.get('/iocs')
  return response.data
}

export const getIocStats = async () => {
  const response = await api.get('/iocs/stats')
  return response.data
}

export const updateRiskScore = async (id, score) => {
  const response = await api.patch(
    `/iocs/${id}/risk-score`,
    null,
    { params: { score } }
  )
  return response.data
}

// Get IOC details by ID
export const getIocById = async (id) => {
  const response = await api.get(`/iocs/${id}`)
  return response.data
}
