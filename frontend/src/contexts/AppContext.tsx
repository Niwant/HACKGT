'use client'

import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { User, Patient, Prescription, EMR, Notification, DrugResearch, RecoveryMilestone, RehabChecklist } from '@/types'

interface AppState {
  user: User | null
  patients: Patient[]
  prescriptions: Prescription[]
  emrRecords: EMR[]
  notifications: Notification[]
  drugResearch: DrugResearch[]
  recoveryMilestones: RecoveryMilestone[]
  rehabChecklist: RehabChecklist[]
  selectedPatient: Patient | null
  isLoading: boolean
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_PATIENTS'; payload: Patient[] }
  | { type: 'ADD_PATIENT'; payload: Patient }
  | { type: 'UPDATE_PATIENT'; payload: Patient }
  | { type: 'SET_PRESCRIPTIONS'; payload: Prescription[] }
  | { type: 'ADD_PRESCRIPTION'; payload: Prescription }
  | { type: 'UPDATE_PRESCRIPTION'; payload: Prescription }
  | { type: 'SET_EMR_RECORDS'; payload: EMR[] }
  | { type: 'ADD_EMR_RECORD'; payload: EMR }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'SET_DRUG_RESEARCH'; payload: DrugResearch[] }
  | { type: 'SET_RECOVERY_MILESTONES'; payload: RecoveryMilestone[] }
  | { type: 'UPDATE_MILESTONE'; payload: RecoveryMilestone }
  | { type: 'SET_REHAB_CHECKLIST'; payload: RehabChecklist[] }
  | { type: 'UPDATE_CHECKLIST_ITEM'; payload: RehabChecklist }
  | { type: 'SET_SELECTED_PATIENT'; payload: Patient | null }
  | { type: 'SET_LOADING'; payload: boolean }

const initialState: AppState = {
  user: null,
  patients: [],
  prescriptions: [],
  emrRecords: [],
  notifications: [],
  drugResearch: [],
  recoveryMilestones: [],
  rehabChecklist: [],
  selectedPatient: null,
  isLoading: false,
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'SET_PATIENTS':
      return { ...state, patients: action.payload }
    case 'ADD_PATIENT':
      return { ...state, patients: [...state.patients, action.payload] }
    case 'UPDATE_PATIENT':
      return {
        ...state,
        patients: state.patients.map(p => p.id === action.payload.id ? action.payload : p)
      }
    case 'SET_PRESCRIPTIONS':
      return { ...state, prescriptions: action.payload }
    case 'ADD_PRESCRIPTION':
      return { ...state, prescriptions: [...state.prescriptions, action.payload] }
    case 'UPDATE_PRESCRIPTION':
      return {
        ...state,
        prescriptions: state.prescriptions.map(p => p.id === action.payload.id ? action.payload : p)
      }
    case 'SET_EMR_RECORDS':
      return { ...state, emrRecords: action.payload }
    case 'ADD_EMR_RECORD':
      return { ...state, emrRecords: [...state.emrRecords, action.payload] }
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload }
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => 
          n.id === action.payload ? { ...n, isRead: true } : n
        )
      }
    case 'SET_DRUG_RESEARCH':
      return { ...state, drugResearch: action.payload }
    case 'SET_RECOVERY_MILESTONES':
      return { ...state, recoveryMilestones: action.payload }
    case 'UPDATE_MILESTONE':
      return {
        ...state,
        recoveryMilestones: state.recoveryMilestones.map(m => 
          m.id === action.payload.id ? action.payload : m
        )
      }
    case 'SET_REHAB_CHECKLIST':
      return { ...state, rehabChecklist: action.payload }
    case 'UPDATE_CHECKLIST_ITEM':
      return {
        ...state,
        rehabChecklist: state.rehabChecklist.map(c => 
          c.id === action.payload.id ? action.payload : c
        )
      }
    case 'SET_SELECTED_PATIENT':
      return { ...state, selectedPatient: action.payload }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
