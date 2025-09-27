'use client'

import React, { useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Pill, 
  Calendar, 
  Heart, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react'
import { Medication, RecoveryMilestone, RehabChecklist } from '@/types'
import { RecoveryCompanion } from '@/components/patient/RecoveryCompanion'
import { MedicationTracker } from '@/components/patient/MedicationTracker'
import { AppointmentScheduler } from '@/components/patient/AppointmentScheduler'
import { format } from 'date-fns'

export function PatientDashboard() {
  const { state, dispatch } = useApp()

  // Mock data for patient dashboard
  useEffect(() => {
    const mockMedications: Medication[] = [
      {
        id: '1',
        name: 'Metformin',
        genericName: 'Metformin HCl',
        dosage: '500mg',
        frequency: 'Twice daily',
        startDate: new Date('2024-01-01'),
        instructions: 'Take with meals to reduce stomach upset',
        sideEffects: ['Nausea', 'Diarrhea', 'Stomach upset'],
        cost: 15.99,
        insuranceCovered: true,
        drugInteractions: ['Contrast dye', 'Alcohol']
      },
      {
        id: '2',
        name: 'Lisinopril',
        genericName: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        startDate: new Date('2024-01-15'),
        instructions: 'Take at the same time each day',
        sideEffects: ['Dry cough', 'Dizziness', 'Fatigue'],
        cost: 8.50,
        insuranceCovered: true,
        drugInteractions: ['Potassium supplements', 'NSAIDs']
      }
    ]

    const mockMilestones: RecoveryMilestone[] = [
      {
        id: '1',
        patientId: 'patient-1',
        title: 'First HbA1c Check',
        description: 'Complete your first HbA1c test to monitor blood sugar control',
        targetDate: new Date('2024-02-15'),
        isCompleted: false,
        category: 'lab'
      },
      {
        id: '2',
        patientId: 'patient-1',
        title: '30 Days Medication Adherence',
        description: 'Take all medications as prescribed for 30 consecutive days',
        targetDate: new Date('2024-02-01'),
        isCompleted: true,
        completedDate: new Date('2024-01-31'),
        category: 'medication'
      },
      {
        id: '3',
        patientId: 'patient-1',
        title: 'Start Exercise Routine',
        description: 'Begin 30 minutes of daily walking',
        targetDate: new Date('2024-02-10'),
        isCompleted: false,
        category: 'exercise'
      }
    ]

    const mockChecklist: RehabChecklist[] = [
      {
        id: '1',
        patientId: 'patient-1',
        title: 'Take morning medication',
        description: 'Metformin 500mg with breakfast',
        isCompleted: true,
        completedDate: new Date('2024-01-25'),
        category: 'medication'
      },
      {
        id: '2',
        patientId: 'patient-1',
        title: 'Check blood pressure',
        description: 'Record morning blood pressure reading',
        isCompleted: false,
        category: 'monitoring'
      },
      {
        id: '3',
        patientId: 'patient-1',
        title: 'Avoid grapefruit juice',
        description: 'Skip grapefruit juice with Lisinopril',
        isCompleted: true,
        completedDate: new Date('2024-01-25'),
        category: 'diet'
      },
      {
        id: '4',
        patientId: 'patient-1',
        title: '30-minute walk',
        description: 'Complete daily walking exercise',
        isCompleted: false,
        category: 'exercise'
      }
    ]

    dispatch({ type: 'SET_RECOVERY_MILESTONES', payload: mockMilestones })
    dispatch({ type: 'SET_REHAB_CHECKLIST', payload: mockChecklist })
    dispatch({ type: 'SET_MEDICATIONS', payload: mockMedications })
  }, [dispatch])

  const completedMilestones = state.recoveryMilestones.filter(m => m.isCompleted).length
  const totalMilestones = state.recoveryMilestones.length
  const completedChecklist = state.rehabChecklist.filter(c => c.isCompleted).length
  const totalChecklist = state.rehabChecklist.length

  const upcomingAppointments = [
    {
      id: '1',
      date: new Date('2024-02-15'),
      time: '10:00 AM',
      type: 'in-person' as const,
      physician: 'Dr. Smith',
      specialty: 'Cardiology',
      location: '123 Main St, City, State',
      status: 'scheduled' as const,
      notes: 'Follow-up appointment',
      duration: 30
    }
  ]

  const handleUpdateMilestone = (milestone: RecoveryMilestone) => {
    dispatch({ type: 'UPDATE_MILESTONE', payload: milestone })
  }

  const handleUpdateChecklist = (item: RehabChecklist) => {
    dispatch({ type: 'UPDATE_CHECKLIST_ITEM', payload: item })
  }

  const handleMedicationTaken = (medicationId: string, time: Date) => {
    console.log('Medication taken:', medicationId, time)
    // In a real app, this would save to the backend
  }

  const handleMedicationSkipped = (medicationId: string, reason: string) => {
    console.log('Medication skipped:', medicationId, reason)
    // In a real app, this would save to the backend
  }

  const handleScheduleAppointment = (appointment: any) => {
    console.log('Scheduling appointment:', appointment)
    // In a real app, this would save to the backend
  }

  const handleUpdateAppointment = (id: string, appointment: any) => {
    console.log('Updating appointment:', id, appointment)
    // In a real app, this would save to the backend
  }

  const handleCancelAppointment = (id: string) => {
    console.log('Cancelling appointment:', id)
    // In a real app, this would save to the backend
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Health Dashboard</h1>
        <p className="text-gray-600">Track your health journey and stay on top of your care plan.</p>
      </div>

      {/* Diagnosis Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Your Health Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800">
            You have <strong>Type 2 Diabetes</strong> (high blood sugar condition) and <strong>Hypertension</strong> (high blood pressure). 
            Your condition is well-managed with current medications and lifestyle changes.
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Medications</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.prescriptions.length}</div>
            <p className="text-xs text-muted-foreground">
              Active prescriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovery Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Milestones completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedChecklist}/{totalChecklist}
            </div>
            <p className="text-xs text-muted-foreground">
              Tasks completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Appointment</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {upcomingAppointments.length > 0 ? format(upcomingAppointments[0].date, 'MMM dd') : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              Upcoming visits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="medications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="recovery">Recovery Companion</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="medications" className="space-y-4">
          <MedicationTracker
            medications={state.medications}
            onMedicationTaken={handleMedicationTaken}
            onMedicationSkipped={handleMedicationSkipped}
          />
        </TabsContent>

        <TabsContent value="recovery" className="space-y-4">
          <RecoveryCompanion
            milestones={state.recoveryMilestones}
            checklist={state.rehabChecklist}
            onUpdateMilestone={handleUpdateMilestone}
            onUpdateChecklist={handleUpdateChecklist}
          />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Health Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="w-5 h-5" />
                  <span>Health Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Medications</span>
                    <span className="font-semibold">{state.medications.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Recovery Progress</span>
                    <span className="font-semibold">
                      {totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Daily Tasks</span>
                    <span className="font-semibold">
                      {completedChecklist}/{totalChecklist}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Pill className="w-4 h-4 mr-2" />
                    Log Medication
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Appointment
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Heart className="w-4 h-4 mr-2" />
                    Log Symptoms
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Completed daily checklist</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Pill className="w-4 h-4 text-blue-600" />
                    <span>Took morning medication</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span>Appointment scheduled</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <AppointmentScheduler
            appointments={upcomingAppointments}
            onScheduleAppointment={handleScheduleAppointment}
            onUpdateAppointment={handleUpdateAppointment}
            onCancelAppointment={handleCancelAppointment}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
