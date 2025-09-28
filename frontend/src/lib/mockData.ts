import patientMockData from '@/data/patientMockData.json'

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

// Export converted data with proper Date objects
export const mockData = convertDates(patientMockData)

// Export individual data sections for easier access
export const {
  patientProfile,
  prescriptions,
  medications,
  emrRecords,
  recoveryMilestones,
  rehabChecklist,
  appointments,
  educationContent,
  lifestyleTips,
  costData,
  healthSummary
} = mockData

// Helper functions for common operations
export const getPatientById = (id: string) => {
  return patientProfile.id === id ? patientProfile : null
}

export const getPrescriptionsByPatientId = (patientId: string) => {
  return prescriptions.filter(p => p.patientId === patientId)
}

export const getMedicationsByPatientId = (patientId: string) => {
  return medications // For now, all medications belong to the main patient
}

export const getEMRByPatientId = (patientId: string) => {
  return emrRecords.filter(record => record.patientId === patientId)
}

export const getMilestonesByPatientId = (patientId: string) => {
  return recoveryMilestones.filter(milestone => milestone.patientId === patientId)
}

export const getChecklistByPatientId = (patientId: string) => {
  return rehabChecklist.filter(item => item.patientId === patientId)
}

export const getAppointmentsByPatientId = (patientId: string) => {
  return appointments // For now, all appointments belong to the main patient
}

// Mock API functions that simulate real API calls
export const fetchPatientData = async (patientId: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))
  return getPatientById(patientId)
}

export const fetchPrescriptions = async (patientId: string) => {
  await new Promise(resolve => setTimeout(resolve, 100))
  return getPrescriptionsByPatientId(patientId)
}

export const fetchMedications = async (patientId: string) => {
  await new Promise(resolve => setTimeout(resolve, 100))
  return getMedicationsByPatientId(patientId)
}

export const fetchEMRRecords = async (patientId: string) => {
  await new Promise(resolve => setTimeout(resolve, 100))
  return getEMRByPatientId(patientId)
}

export const fetchRecoveryMilestones = async (patientId: string) => {
  await new Promise(resolve => setTimeout(resolve, 100))
  return getMilestonesByPatientId(patientId)
}

export const fetchRehabChecklist = async (patientId: string) => {
  await new Promise(resolve => setTimeout(resolve, 100))
  return getChecklistByPatientId(patientId)
}

export const fetchAppointments = async (patientId: string) => {
  await new Promise(resolve => setTimeout(resolve, 100))
  return getAppointmentsByPatientId(patientId)
}
