import fs from 'fs'
import path from 'path'

export interface PrescriptionData {
  diagnosis: string
  icdCode: string
  startDate: Date
  endDate?: Date
  status: 'active' | 'inactive' | 'completed'
  medications: Array<{
    name: string
    genericName: string
    frequency: string
    instructions: string
    duration: string
    cost: number
    insuranceCovered: boolean
    rxcui?: string
  }>
  safetyChecks: {
    allergies: boolean
    interactions: boolean
    renalAdjustment: boolean
  }
  notes?: string
}

export async function addPrescriptionToMockData(
  patientId: string,
  prescriptionData: PrescriptionData
): Promise<boolean> {
  try {
    const mockDataPath = path.join(process.cwd(), 'src', 'data', 'patientMockData.json')
    
    // Read the current mock data
    const mockDataContent = fs.readFileSync(mockDataPath, 'utf8')
    const mockData = JSON.parse(mockDataContent)
    
    // Generate new prescription ID
    const newPrescriptionId = (mockData.prescriptions.length + 1).toString()
    
    // Create the new prescription object
    const newPrescription = {
      id: newPrescriptionId,
      patientId: patientId,
      physicianId: "physician-1", // Default physician ID
      diagnosis: prescriptionData.diagnosis,
      icdCode: prescriptionData.icdCode,
      startDate: prescriptionData.startDate.toISOString().split('T')[0],
      status: prescriptionData.status,
      createdAt: new Date().toISOString().split('T')[0],
      medications: prescriptionData.medications.map((med, index) => ({
        id: `med-${Date.now()}-${index}`,
        medicationId: `${med.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${index}`,
        name: med.name,
        genericName: med.genericName,
        dosage: med.name.includes('mg') ? med.name : `${med.name} 500mg`, // Extract or default dosage
        frequency: med.frequency,
        instructions: med.instructions,
        refills: 3, // Default refills
        duration: med.duration,
        cost: med.cost,
        insuranceCovered: med.insuranceCovered,
        rxcui: med.rxcui || undefined
      })),
      safetyChecks: prescriptionData.safetyChecks,
      notes: prescriptionData.notes || undefined
    }
    
    // Add the new prescription to the prescriptions array
    mockData.prescriptions.push(newPrescription)
    
    // Add medications to the medications array (if they don't already exist)
    prescriptionData.medications.forEach(med => {
      const existingMed = mockData.medications.find((m: any) => 
        m.name.toLowerCase() === med.name.toLowerCase()
      )
      
      if (!existingMed) {
        const newMedication = {
          id: (mockData.medications.length + 1).toString(),
          name: med.name,
          genericName: med.genericName,
          dosage: med.name.includes('mg') ? med.name : `${med.name} 500mg`,
          frequency: med.frequency,
          startDate: prescriptionData.startDate.toISOString().split('T')[0],
          instructions: med.instructions,
          sideEffects: [], // Default empty array
          cost: med.cost,
          insuranceCovered: med.insuranceCovered,
          drugInteractions: [] // Default empty array
        }
        mockData.medications.push(newMedication)
      }
    })
    
    // Write the updated data back to the file
    fs.writeFileSync(mockDataPath, JSON.stringify(mockData, null, 2))
    
    console.log('Successfully added prescription to mock data:', newPrescription)
    return true
  } catch (error) {
    console.error('Error updating mock data:', error)
    return false
  }
}

// For client-side usage, we'll need a different approach
export async function addPrescriptionToMockDataClient(
  patientId: string,
  prescriptionData: PrescriptionData
): Promise<boolean> {
  try {
    // In a real application, this would make an API call to the backend
    // For now, we'll simulate this by updating the local state
    console.log('Adding prescription to mock data (client-side):', {
      patientId,
      prescriptionData
    })
    
    // This is a placeholder - in a real app, you'd make an API call here
    // The actual file update would happen on the server side
    return true
  } catch (error) {
    console.error('Error updating mock data (client-side):', error)
    return false
  }
}
