'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  FileText, 
  Pill, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { Patient, EMR, Prescription } from '@/types'
import { format } from 'date-fns'

interface PatientProfileModalProps {
  patient: Patient | null
  isOpen: boolean
  onClose: () => void
}

export function PatientProfileModal({ patient, isOpen, onClose }: PatientProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'emr' | 'prescriptions'>('summary')

  if (!patient) return null

  // Mock EMR data - in real app, this would come from API
  const mockEMR: EMR[] = [
    {
      id: '1',
      patientId: patient.id,
      physicianId: 'physician-1',
      type: 'vitals',
      title: 'Blood Pressure Reading',
      content: 'Blood pressure measured during routine check-up',
      value: '120/80',
      unit: 'mmHg',
      date: new Date('2024-01-15'),
      isUrgent: false
    },
    {
      id: '2',
      patientId: patient.id,
      physicianId: 'physician-1',
      type: 'diagnosis',
      title: 'Type 2 Diabetes',
      content: 'Patient diagnosed with Type 2 Diabetes based on HbA1c levels',
      date: new Date('2024-01-10'),
      isUrgent: false
    },
    {
      id: '3',
      patientId: patient.id,
      physicianId: 'physician-1',
      type: 'lab',
      title: 'HbA1c Test Results',
      content: 'Latest HbA1c test results',
      value: '7.1',
      unit: '%',
      date: new Date('2024-01-12'),
      isUrgent: false
    }
  ]

  // Mock prescriptions data
  const mockPrescriptions: Prescription[] = [
    {
      id: '1',
      patientId: patient.id,
      physicianId: 'physician-1',
      medicationId: 'med-1',
      diagnosis: 'Type 2 Diabetes',
      icdCode: 'E11.9',
      dosage: '500mg',
      frequency: 'Twice daily',
      instructions: 'Take with meals to reduce stomach upset',
      startDate: new Date('2024-01-01'),
      refills: 3,
      status: 'active',
      createdAt: new Date('2024-01-01'),
      safetyChecks: {
        allergies: true,
        interactions: true,
        renalAdjustment: false
      }
    }
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'default'
    }
  }

  const getEMRTypeIcon = (type: string) => {
    switch (type) {
      case 'vitals': return <CheckCircle className="w-4 h-4" />
      case 'diagnosis': return <AlertTriangle className="w-4 h-4" />
      case 'lab': return <FileText className="w-4 h-4" />
      case 'imaging': return <FileText className="w-4 h-4" />
      case 'note': return <FileText className="w-4 h-4" />
      case 'medication': return <Pill className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getEMRTypeColor = (type: string) => {
    switch (type) {
      case 'vitals': return 'text-green-600'
      case 'diagnosis': return 'text-red-600'
      case 'lab': return 'text-blue-600'
      case 'imaging': return 'text-purple-600'
      case 'note': return 'text-gray-600'
      case 'medication': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[80vw] max-w-[90vw] max-h-[95vh] overflow-hidden !w-[90vw] !h-[95vh] sm:!max-w-[90vw] sm:!max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src="" />
              <AvatarFallback>
                {patient.firstName[0]}{patient.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">
                {patient.firstName} {patient.lastName}
              </h2>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={getSeverityColor(patient.severity)}>
                  {patient.severity} priority
                </Badge>
                <span className="text-sm text-gray-500">
                  Last visit: {format(patient.lastVisit, 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[calc(95vh-120px)]">
          {/* Sidebar Navigation */}
          <div className="w-80 border-r pr-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} orientation="vertical">
              <TabsList className="grid w-full grid-cols-1 h-auto space-y-2">
                <TabsTrigger value="summary" className="justify-start h-12 text-base">
                  <User className="w-5 h-5 mr-3" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="emr" className="justify-start h-12 text-base">
                  <FileText className="w-5 h-5 mr-3" />
                  EMR Records
                </TabsTrigger>
                <TabsTrigger value="prescriptions" className="justify-start h-12 text-base">
                  <Pill className="w-5 h-5 mr-3" />
                  Prescriptions
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Main Content */}
          <div className="flex-1 pl-8 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              {/* Summary Tab */}
              <TabsContent value="summary" className="space-y-8">
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Patient Demographics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Demographics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                          <strong>DOB:</strong> {format(patient.dateOfBirth, 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                          <strong>Gender:</strong> {patient.gender}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{patient.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{patient.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{patient.address}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Emergency Contact */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Emergency Contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <strong>{patient.emergencyContact.name}</strong>
                        <p className="text-sm text-gray-600">{patient.emergencyContact.relationship}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{patient.emergencyContact.phone}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Medical History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Medical History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {patient.medicalHistory.map((condition, index) => (
                        <Badge key={index} variant="outline" className="mr-2">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Allergies */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Allergies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {patient.allergies.map((allergy, index) => (
                        <Badge key={index} variant="destructive" className="mr-2">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Summary */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-900">AI Patient Summary</CardTitle>
                    <CardDescription className="text-blue-700">
                      AI-generated 30-second patient overview
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-blue-800">
                      <strong>{patient.firstName} {patient.lastName}</strong> is a {patient.gender} patient with Type 2 Diabetes and Hypertension. 
                      Current HbA1c is 7.1%, indicating moderate control. Patient is stable on metformin with no recent complications. 
                      Last visit showed good medication adherence. Next follow-up recommended in 3 months.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* EMR Tab */}
              <TabsContent value="emr" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">Electronic Medical Records</h3>
                  <Button size="lg">
                    Add New Entry
                  </Button>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-6">
                  {mockEMR.map((record) => (
                    <Card key={record.id} className={record.isUrgent ? 'border-red-200 bg-red-50' : ''}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className={`mt-1 ${getEMRTypeColor(record.type)}`}>
                              {getEMRTypeIcon(record.type)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{record.title}</h4>
                              <p className="text-gray-600 mt-2">{record.content}</p>
                              {record.value && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-lg font-bold text-gray-800">
                                    {record.value} <span className="text-sm font-normal text-gray-600">{record.unit}</span>
                                  </p>
                                </div>
                              )}
                              <div className="flex items-center space-x-3 mt-4">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-500">
                                  {format(record.date, 'MMM dd, yyyy HH:mm')}
                                </span>
                                {record.isUrgent && (
                                  <Badge variant="destructive" className="text-sm">
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Prescriptions Tab */}
              <TabsContent value="prescriptions" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">Current Prescriptions</h3>
                  <Button size="lg">
                    New Prescription
                  </Button>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-6">
                  {mockPrescriptions.map((prescription) => (
                    <Card key={prescription.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-xl">Metformin</h4>
                            <div className="mt-4 space-y-3">
                              <div className="p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm font-medium text-blue-800">
                                  <strong>Diagnosis:</strong> {prescription.diagnosis} ({prescription.icdCode})
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Dosage</p>
                                  <p className="text-lg font-semibold">{prescription.dosage}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Frequency</p>
                                  <p className="text-lg font-semibold">{prescription.frequency}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Instructions</p>
                                <p className="text-gray-600">{prescription.instructions}</p>
                              </div>
                              <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                                <span>Started: {format(prescription.startDate, 'MMM dd, yyyy')}</span>
                                <span>Refills: {prescription.refills}</span>
                                <Badge variant={prescription.status === 'active' ? 'default' : 'secondary'} className="text-sm">
                                  {prescription.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-6">
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>Allergies checked</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>Interactions checked</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span>Renal adjustment</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
