'use client'

import React, { useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PatientProfileModal } from '@/components/patient/PatientProfileModal'
import { 
  Users, 
  Pill, 
  Bell, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  Search,
  Filter,
  Plus
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Patient, DrugResearch, Notification } from '@/types'
import { format } from 'date-fns'
import { useState } from 'react'

export function PhysicianDashboard() {
  const { state, dispatch } = useApp()
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const mockPatients: Patient[] = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-05-15'),
        gender: 'male',
        phone: '+1-555-0123',
        email: 'john.doe@email.com',
        address: '123 Main St, City, State',
        emergencyContact: {
          name: 'Jane Doe',
          phone: '+1-555-0124',
          relationship: 'Spouse'
        },
        medicalHistory: ['Diabetes Type 2', 'Hypertension'],
        allergies: ['Penicillin'],
        currentMedications: [],
        lastVisit: new Date('2024-01-15'),
        nextAppointment: new Date('2024-02-15'),
        severity: 'medium',
        physicianId: 'physician-1'
      },
      {
        id: '2',
        firstName: 'Sarah',
        lastName: 'Smith',
        dateOfBirth: new Date('1975-03-22'),
        gender: 'female',
        phone: '+1-555-0125',
        email: 'sarah.smith@email.com',
        address: '456 Oak Ave, City, State',
        emergencyContact: {
          name: 'Mike Smith',
          phone: '+1-555-0126',
          relationship: 'Brother'
        },
        medicalHistory: ['Asthma', 'Allergic Rhinitis'],
        allergies: ['Shellfish'],
        currentMedications: [],
        lastVisit: new Date('2024-01-10'),
        nextAppointment: new Date('2024-02-10'),
        severity: 'low',
        physicianId: 'physician-1'
      }
    ]

    const mockDrugResearch: DrugResearch[] = [
      {
        id: '1',
        title: 'New FDA Approval: DrugX for Type 2 Diabetes',
        content: 'FDA approves DrugX, a once-daily medication with fewer GI side effects than metformin.',
        type: 'fda_approval',
        source: 'FDA News',
        publishedDate: new Date('2024-01-20'),
        relevanceScore: 9.5,
        tags: ['diabetes', 'fda', 'new-drug']
      },
      {
        id: '2',
        title: 'Clinical Trial Results: Improved Hypertension Management',
        content: 'Phase III trial shows 40% better blood pressure control with new combination therapy.',
        type: 'trial_result',
        source: 'Journal of Cardiology',
        publishedDate: new Date('2024-01-18'),
        relevanceScore: 8.2,
        tags: ['hypertension', 'clinical-trial', 'cardiovascular']
      }
    ]

    const mockNotifications: Notification[] = [
      {
        id: '1',
        userId: 'physician-1',
        type: 'lab_result',
        title: 'New Lab Results',
        message: 'John Doe - HbA1c results available',
        isRead: false,
        createdAt: new Date('2024-01-25'),
        priority: 'medium'
      },
      {
        id: '2',
        userId: 'physician-1',
        type: 'follow_up',
        title: 'Follow-up Required',
        message: 'Sarah Smith - 2-week follow-up due',
        isRead: false,
        createdAt: new Date('2024-01-24'),
        priority: 'high'
      }
    ]

    dispatch({ type: 'SET_PATIENTS', payload: mockPatients })
    dispatch({ type: 'SET_DRUG_RESEARCH', payload: mockDrugResearch })
    dispatch({ type: 'SET_NOTIFICATIONS', payload: mockNotifications })
  }, [dispatch])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'default'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'default'
    }
  }

  const handleViewProfile = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsProfileModalOpen(true)
  }

  const handleCloseProfile = () => {
    setIsProfileModalOpen(false)
    setSelectedPatient(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Physician Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex space-x-2">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Patient
          </Button>
          <Button variant="outline">
            <Pill className="w-4 h-4 mr-2" />
            New Prescription
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.patients.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.prescriptions.length}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {state.notifications.filter(n => !n.isRead).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Unread notifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Research Updates</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.drugResearch.length}</div>
            <p className="text-xs text-muted-foreground">
              New this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="patients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patients">Patient List</TabsTrigger>
          <TabsTrigger value="research">Drug Research</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Patient List</CardTitle>
                  <CardDescription>
                    Manage your patients and their care
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search patients..." className="pl-8 w-64" />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.patients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src="" />
                        <AvatarFallback>
                          {patient.firstName[0]}{patient.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Last visit: {format(patient.lastVisit, 'MMM dd, yyyy')}
                        </p>
                        <div className="flex space-x-2 mt-1">
                          <Badge variant={getSeverityColor(patient.severity)}>
                            {patient.severity}
                          </Badge>
                          {patient.nextAppointment && (
                            <Badge variant="outline">
                              <Clock className="w-3 h-3 mr-1" />
                              {format(patient.nextAppointment, 'MMM dd')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewProfile(patient)}
                      >
                        View Profile
                      </Button>
                      <Button size="sm">
                        New Prescription
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="research" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Drug Research Feed</CardTitle>
              <CardDescription>
                Latest updates in pharmaceutical research and approvals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.drugResearch.map((research) => (
                  <div
                    key={research.id}
                    className="p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{research.title}</h3>
                        <p className="text-gray-600 mt-1">{research.content}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Source: {research.source}</span>
                          <span>{format(research.publishedDate, 'MMM dd, yyyy')}</span>
                          <Badge variant="outline">
                            Relevance: {research.relevanceScore}/10
                          </Badge>
                        </div>
                        <div className="flex space-x-2 mt-2">
                          {research.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Important updates and reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg ${
                      !notification.isRead ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{notification.title}</h3>
                          <Badge variant={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                          {!notification.isRead && (
                            <Badge variant="default">New</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {format(notification.createdAt, 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => 
                          dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notification.id })
                        }
                      >
                        Mark as Read
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Patient Profile Modal */}
      <PatientProfileModal
        patient={selectedPatient}
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfile}
      />
    </div>
  )
}
