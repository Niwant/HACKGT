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

    dispatch({ type: 'SET_PRESCRIPTIONS', payload: mockMedications })
    dispatch({ type: 'SET_RECOVERY_MILESTONES', payload: mockMilestones })
    dispatch({ type: 'SET_REHAB_CHECKLIST', payload: mockChecklist })
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
      type: 'Follow-up',
      physician: 'Dr. Smith'
    }
  ]

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
          <TabsTrigger value="recovery">Recovery Timeline</TabsTrigger>
          <TabsTrigger value="checklist">Daily Checklist</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="medications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Medications</CardTitle>
              <CardDescription>
                Your prescribed medications with detailed information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.prescriptions.map((medication) => (
                  <div
                    key={medication.id}
                    className="p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-lg">{medication.name}</h3>
                          <Badge variant="outline">{medication.dosage}</Badge>
                          {medication.insuranceCovered && (
                            <Badge variant="secondary">Covered</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1">
                          <strong>Generic:</strong> {medication.genericName}
                        </p>
                        <p className="text-gray-600">
                          <strong>Instructions:</strong> {medication.instructions}
                        </p>
                        <p className="text-gray-600">
                          <strong>Frequency:</strong> {medication.frequency}
                        </p>
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Side Effects:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {medication.sideEffects.map((effect) => (
                              <Badge key={effect} variant="outline" className="text-xs">
                                {effect}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Cost: ${medication.cost}/month</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recovery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recovery Timeline</CardTitle>
              <CardDescription>
                Track your health milestones and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.recoveryMilestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className={`p-4 border rounded-lg ${
                      milestone.isCompleted ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{milestone.title}</h3>
                          {milestone.isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                          <Badge variant="outline">{milestone.category}</Badge>
                        </div>
                        <p className="text-gray-600 mt-1">{milestone.description}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Target: {format(milestone.targetDate, 'MMM dd, yyyy')}
                          {milestone.completedDate && (
                            <span className="ml-2 text-green-600">
                              • Completed: {format(milestone.completedDate, 'MMM dd, yyyy')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Health Checklist</CardTitle>
              <CardDescription>
                Complete these tasks to stay on track with your health plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.rehabChecklist.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 border rounded-lg ${
                      item.isCompleted ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {item.isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="text-gray-600 text-sm">{item.description}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updatedItem = {
                            ...item,
                            isCompleted: !item.isCompleted,
                            completedDate: !item.isCompleted ? new Date() : undefined
                          }
                          dispatch({ type: 'UPDATE_CHECKLIST_ITEM', payload: updatedItem })
                        }}
                      >
                        {item.isCompleted ? 'Undo' : 'Complete'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>
                Your scheduled visits and check-ups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{appointment.type}</h3>
                        <p className="text-gray-600">with {appointment.physician}</p>
                        <p className="text-sm text-gray-500">
                          {format(appointment.date, 'EEEE, MMMM dd, yyyy')} at {appointment.time}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
