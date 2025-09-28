export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'physician' | 'patient'
  avatar?: string
  createdAt: Date
}

export interface Patient {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: 'male' | 'female' | 'other'
  phone: string
  email: string
  address: string
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
  medicalHistory: string[]
  allergies: string[]
  currentMedications: Medication[]
  lastVisit: Date
  nextAppointment?: Date
  severity: 'low' | 'medium' | 'high'
  physicianId: string
}

export interface Medication {
  id: string
  name: string
  genericName: string
  dosage: string
  frequency: string
  startDate: Date
  endDate?: Date
  instructions: string
  sideEffects: string[]
  cost: number
  insuranceCovered: boolean
  isNewDrug?: boolean
  fdaApprovalDate?: Date
  drugInteractions: string[]
}

export interface Prescription {
  id: string
  patientId: string
  physicianId: string
  diagnosis: string
  icdCode: string
  startDate: Date
  endDate?: Date
  status: 'active' | 'completed' | 'cancelled'
  createdAt: Date
  medications: PrescriptionMedication[]
  safetyChecks: {
    allergies: boolean
    interactions: boolean
    renalAdjustment: boolean
  }
  notes?: string
}

export interface PrescriptionMedication {
  id: string
  medicationId: string
  name: string
  genericName: string
  dosage?: string
  frequency: string
  instructions: string
  refills?: number
  duration: string
  cost: number
  insuranceCovered: boolean
  rxcui?: string
}

export interface EMR {
  id: string
  patientId: string
  physicianId: string
  type: 'vitals' | 'diagnosis' | 'lab' | 'imaging' | 'note' | 'medication'
  title: string
  content: string
  value?: string
  unit?: string
  date: Date
  attachments?: string[]
  isUrgent: boolean
}

export interface Notification {
  id: string
  userId: string
  type: 'lab_result' | 'follow_up' | 'prescription' | 'appointment' | 'alert'
  title: string
  message: string
  isRead: boolean
  createdAt: Date
  priority: 'low' | 'medium' | 'high'
}

export interface DrugResearch {
  id: string
  title: string
  content: string
  type: 'fda_approval' | 'trial_result' | 'label_change' | 'pharma_bulletin'
  source: string
  publishedDate: Date
  relevanceScore: number
  tags: string[]
}

export interface RecoveryMilestone {
  id: string
  patientId: string
  title: string
  description: string
  targetDate: Date
  completedDate?: Date
  isCompleted: boolean
  category: 'lab' | 'exercise' | 'medication' | 'lifestyle'
}

export interface RehabChecklist {
  id: string
  patientId: string
  title: string
  description: string
  isCompleted: boolean
  completedDate?: Date
  category: 'diet' | 'exercise' | 'medication' | 'monitoring'
}

export interface CoverageInfo {
  covered: boolean | string
  tier: string
  priorAuthorization: boolean | string
  stepTherapy: boolean | string
  quantityLimit: boolean | string
  quantityLimitAmount: string
  quantityLimitDays: number
}
