import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for development (avoids file system conflicts with Turbopack)
let mockDataStore: any = null

// Initialize mock data store
async function initializeMockData() {
  if (!mockDataStore) {
    try {
      // Import the mock data dynamically to avoid HMR conflicts
      const { default: mockData } = await import('@/data/patientMockData.json')
      mockDataStore = JSON.parse(JSON.stringify(mockData)) // Deep clone
    } catch (error) {
      console.error('Error loading mock data:', error)
      mockDataStore = {
        prescriptions: [],
        medications: [],
        emrRecords: []
      }
    }
  }
  return mockDataStore
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, dataType, data } = body

    if (!patientId || !dataType || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: patientId, dataType, and data' },
        { status: 400 }
      )
    }

    // Initialize mock data store
    const mockData = await initializeMockData()
    
    if (dataType === 'prescription') {
      // Handle prescription data
      const newPrescriptionId = (mockData.prescriptions.length + 1).toString()
      
      const newPrescription = {
        id: newPrescriptionId,
        patientId: patientId,
        physicianId: "physician-1",
        diagnosis: data.diagnosis,
        icdCode: data.icdCode,
        startDate: data.startDate,
        status: data.status,
        createdAt: new Date().toISOString().split('T')[0],
        medications: data.medications.map((med: any, index: number) => ({
          id: `med-${Date.now()}-${index}`,
          medicationId: `${med.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${index}`,
          name: med.name,
          genericName: med.genericName,
          dosage: med.name.includes('mg') ? med.name : `${med.name} 500mg`,
          frequency: med.frequency,
          instructions: med.instructions,
          refills: 3,
          duration: med.duration,
          cost: med.cost,
          insuranceCovered: med.insuranceCovered,
          rxcui: med.rxcui || undefined
        })),
        safetyChecks: data.safetyChecks,
        notes: data.notes || undefined
      }
      
      mockData.prescriptions.push(newPrescription)
      
      // Add medications to the medications array (if they don't already exist)
      data.medications.forEach((med: any) => {
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
            startDate: data.startDate,
            instructions: med.instructions,
            sideEffects: [],
            cost: med.cost,
            insuranceCovered: med.insuranceCovered,
            drugInteractions: []
          }
          mockData.medications.push(newMedication)
        }
      })
      
      console.log('Prescription added to in-memory store:', newPrescription)
      
      return NextResponse.json({ 
        success: true, 
        prescription: newPrescription,
        message: 'Prescription added successfully (stored in memory for development)'
      })
      
    } else if (dataType === 'emr') {
      // Handle EMR data
      const newEMRId = (mockData.emrRecords.length + 1).toString()
      
      const newEMREntry = {
        id: newEMRId,
        patientId: patientId,
        physicianId: "physician-1",
        type: data.type,
        title: data.title,
        content: data.content,
        value: data.value || undefined,
        unit: data.unit || undefined,
        date: data.date,
        isUrgent: data.isUrgent || false,
        attachments: data.attachments || undefined
      }
      
      mockData.emrRecords.push(newEMREntry)
      
      console.log('EMR entry added to in-memory store:', newEMREntry)
      
      return NextResponse.json({ 
        success: true, 
        emrEntry: newEMREntry,
        message: 'EMR entry added successfully (stored in memory for development)'
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid dataType. Must be "prescription" or "emr"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error updating mock data:', error)
    return NextResponse.json(
      { error: 'Failed to update mock data' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve current patient data
export async function GET() {
  try {
    const mockData = await initializeMockData()
    return NextResponse.json({ 
      success: true, 
      prescriptions: mockData.prescriptions,
      medications: mockData.medications,
      emrRecords: mockData.emrRecords
    })
  } catch (error) {
    console.error('Error retrieving mock data:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve mock data' },
      { status: 500 }
    )
  }
}
