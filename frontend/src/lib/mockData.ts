// In-memory cache for mock data to avoid HMR conflicts
let mockDataCache: any = null

// Helper function to convert date strings back to Date objects
const convertDates = (obj: any): any => {
  if (obj === null || obj === undefined) return obj
  
  if (Array.isArray(obj)) {
    return obj.map(convertDates)
  }
  
  if (typeof obj === 'object') {
    const converted: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && 
          (key.includes('Date') || key.includes('date')) && 
          value.match(/^\d{4}-\d{2}-\d{2}/)) {
        converted[key] = new Date(value)
      } else {
        converted[key] = convertDates(value)
      }
    }
    return converted
  }
  
  return obj
}

// Load mock data from API endpoint to avoid HMR conflicts
async function loadMockData() {
  if (!mockDataCache) {
    try {
      const response = await fetch('/api/patient-data')
      if (response.ok) {
        const apiData = await response.json()
        // For now, we'll use the original static data and merge with API data
        // In a real app, the API would return the complete dataset
        const { default: staticData } = await import('@/data/patientMockData.json')
        mockDataCache = convertDates({
          ...staticData,
          prescriptions: apiData.prescriptions || staticData.prescriptions,
          medications: apiData.medications || staticData.medications,
          emrRecords: apiData.emrRecords || staticData.emrRecords
        })
      } else {
        // Fallback to static data if API fails
        const { default: staticData } = await import('@/data/patientMockData.json')
        mockDataCache = convertDates(staticData)
      }
    } catch (error) {
      console.error('Error loading mock data:', error)
      // Fallback to static data
      const { default: staticData } = await import('@/data/patientMockData.json')
      mockDataCache = convertDates(staticData)
    }
  }
  return mockDataCache
}

// Export async function to get mock data
export const getMockData = async () => {
  return await loadMockData()
}

// Helper functions for common operations
export const getPatientById = async (id: string) => {
  const mockData = await getMockData()
  return mockData.patientProfile.id === id ? mockData.patientProfile : null
}

export const getPrescriptionsByPatientId = async (patientId: string) => {
  const mockData = await getMockData()
  return mockData.prescriptions.filter((p: any) => p.patientId === patientId)
}

export const getMedicationsByPatientId = async (patientId: string) => {
  const mockData = await getMockData()
  return mockData.medications // For now, all medications belong to the main patient
}

export const getEMRByPatientId = async (patientId: string) => {
  const mockData = await getMockData()
  return mockData.emrRecords.filter((record: any) => record.patientId === patientId)
}

export const getMilestonesByPatientId = async (patientId: string) => {
  const mockData = await getMockData()
  return mockData.recoveryMilestones.filter((milestone: any) => milestone.patientId === patientId)
}

export const getChecklistByPatientId = async (patientId: string) => {
  const mockData = await getMockData()
  return mockData.rehabChecklist.filter((item: any) => item.patientId === patientId)
}

export const getAppointmentsByPatientId = async (patientId: string) => {
  const mockData = await getMockData()
  return mockData.appointments // For now, all appointments belong to the main patient
}

// Mock API functions that simulate real API calls
export const fetchPatientData = async (patientId: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))
  return await getPatientById(patientId)
}

export const fetchPrescriptions = async (patientId: string) => {
  await new Promise(resolve => setTimeout(resolve, 100))
  return await getPrescriptionsByPatientId(patientId)
}

export const fetchMedications = async (patientId: string) => {
  await new Promise(resolve => setTimeout(resolve, 100))
  return await getMedicationsByPatientId(patientId)
}

export const fetchEMRRecords = async (patientId: string) => {
  await new Promise(resolve => setTimeout(resolve, 100))
  return await getEMRByPatientId(patientId)
}

export const fetchRecoveryMilestones = async (patientId: string) => {
  await new Promise(resolve => setTimeout(resolve, 100))
  return await getMilestonesByPatientId(patientId)
}

export const fetchRehabChecklist = async (patientId: string) => {
  await new Promise(resolve => setTimeout(resolve, 100))
  return await getChecklistByPatientId(patientId)
}

export const fetchAppointments = async (patientId: string) => {
  await new Promise(resolve => setTimeout(resolve, 100))
  return await getAppointmentsByPatientId(patientId)
}

// Export individual data sections for easier access (async versions)
export const getPatientProfile = async () => {
  const mockData = await getMockData()
  return mockData.patientProfile
}

export const getPrescriptions = async () => {
  const mockData = await getMockData()
  return mockData.prescriptions
}

export const getMedications = async () => {
  const mockData = await getMockData()
  return mockData.medications
}

export const getEMRRecords = async () => {
  const mockData = await getMockData()
  return mockData.emrRecords
}

export const getRecoveryMilestones = async () => {
  const mockData = await getMockData()
  return mockData.recoveryMilestones
}

export const getRehabChecklist = async () => {
  const mockData = await getMockData()
  return mockData.rehabChecklist
}

export const getAppointments = async () => {
  const mockData = await getMockData()
  return mockData.appointments
}

export const getEducationContent = async () => {
  const mockData = await getMockData()
  return mockData.educationContent
}

export const getLifestyleTips = async () => {
  const mockData = await getMockData()
  return mockData.lifestyleTips
}

export const getCostData = async () => {
  const mockData = await getMockData()
  return mockData.costData
}

export const getHealthSummary = async () => {
  const mockData = await getMockData()
  return mockData.healthSummary
}
