'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
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
  Clock,
  Shield,
  DollarSign
} from 'lucide-react'
import { Patient, EMR, Prescription, CoverageInfo } from '@/types'
import { format } from 'date-fns'
import PriorAuthPdfFiller, { exampleFieldMap } from "./PriorAuthPdfFiller"
import { NewEMREntryModal } from './NewEMREntryModal'
import { NewPrescriptionModal } from './NewPrescriptionModal'
import { fetchCoverageInfo } from '@/lib/api'

interface PatientProfileModalProps {
  patient: Patient | null
  isOpen: boolean
  onClose: () => void
}

export function PatientProfileModal({ patient, isOpen, onClose }: PatientProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'emr' | 'prescriptions'>('summary')
  const [isEMRModalOpen, setIsEMRModalOpen] = useState(false)
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false)
  const [coverageInfo, setCoverageInfo] = useState<Record<string, CoverageInfo>>({})
  const [loadingCoverage, setLoadingCoverage] = useState<Record<string, boolean>>({})

  // Load prescriptions from centralized mock data
  const [mockPrescriptions, setMockPrescriptions] = useState<Prescription[]>([])
  
  // Load EMR data from centralized mock data
  const [mockEMR, setMockEMR] = useState<EMR[]>([])
  
  useEffect(() => {
    const loadPrescriptions = async () => {
      const { fetchPrescriptions } = await import('@/lib/mockData')
      const prescriptions = await fetchPrescriptions(patient?.id || '1')
      setMockPrescriptions(prescriptions)
    }
    
    if (patient?.id) {
      loadPrescriptions()
    }
  }, [patient?.id])

  useEffect(() => {
    const loadEMRData = async () => {
      const { fetchEMRRecords } = await import('@/lib/mockData')
      const emrData = await fetchEMRRecords(patient?.id || '1')
      setMockEMR(emrData)
    }
    
    if (patient?.id) {
      loadEMRData()
    }
  }, [patient?.id])

  if (!patient) return null


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

  const handleSaveEMREntry = (entry: Omit<EMR, 'id' | 'patientId' | 'physicianId'>) => {
    // In a real app, this would save to the backend
    console.log('Saving EMR entry:', entry)
    // You could dispatch to context or call an API here
  }

  const handleSavePrescription = (prescription: Omit<Prescription, 'id' | 'patientId' | 'physicianId' | 'createdAt'>) => {
    // Create a complete prescription object with required fields
    const completePrescription: Prescription = {
      ...prescription,
      id: `prescription-${Date.now()}`,
      patientId: patient?.id || '',
      physicianId: 'physician-1',
      createdAt: new Date()
    }
    
    // Add to mock prescriptions array using state setter
    setMockPrescriptions(prev => [...prev, completePrescription])
    console.log('Prescription added to mock data:', completePrescription)
    console.log('Total prescriptions now:', mockPrescriptions.length + 1)
    
    // In a real app, this would save to the backend
    // You could dispatch to context or call an API here
  }

  const handleCheckCoverage = async (medicationId: string, rxcui: string) => {
    if (!patient) return
    
    const key = `${medicationId}-${rxcui}`
    setLoadingCoverage(prev => ({ ...prev, [key]: true }))
    
    try {
      const result = await fetchCoverageInfo(patient.id, rxcui)
      if (result.success && result.data) {
        setCoverageInfo(prev => ({ ...prev, [key]: result.data! }))
      } else {
        console.error('Failed to fetch coverage info:', result.error)
      }
    } catch (error) {
      console.error('Error checking coverage:', error)
    } finally {
      setLoadingCoverage(prev => ({ ...prev, [key]: false }))
    }
  }

  const getCoverageStatusBadge = (coverage: CoverageInfo) => {
    switch (coverage.coverageStatus) {
      case 'covered':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Covered</Badge>
      case 'not_covered':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Not Covered</Badge>
      case 'prior_auth_required':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Shield className="w-3 h-3 mr-1" />Prior Auth Required</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
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
                  <Button size="lg" onClick={() => setIsEMRModalOpen(true)}>
                    Add New Entry
                  </Button>
                </div>
                
                {mockEMR.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No EMR records found</p>
                    <p className="text-sm">EMR records will appear here when available</p>
                  </div>
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {mockEMR.map((record) => (
                    <AccordionItem key={record.id} value={record.id} className={record.isUrgent ? 'border-red-200 bg-red-50' : ''}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center space-x-4 w-full">
                          <div className={`${getEMRTypeColor(record.type)}`}>
                            {getEMRTypeIcon(record.type)}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-lg">{record.title}</h4>
                              <div className="flex items-center space-x-3">
                                <span className="text-sm text-gray-500">
                                  {format(record.date, 'MMM dd, yyyy')}
                                </span>
                                {record.isUrgent && (
                                  <Badge variant="destructive" className="text-sm">
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm mt-1 truncate">
                              {record.content}
                            </p>
                            {record.value && (
                              <div className="mt-2 inline-block">
                                <span className="text-sm font-medium text-gray-700">
                                  {record.value} {record.unit}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <div className="pl-12 space-y-4">
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2">Details</h5>
                            <p className="text-gray-600">{record.content}</p>
                          </div>
                          
                          {record.value && (
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <h5 className="font-medium text-gray-800 mb-2">Measurement</h5>
                              <p className="text-2xl font-bold text-gray-800">
                                {record.value} <span className="text-lg font-normal text-gray-600">{record.unit}</span>
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-medium text-gray-800 mb-1">Record Type</h5>
                              <Badge variant="outline" className="capitalize">
                                {record.type}
                              </Badge>
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-800 mb-1">Date & Time</h5>
                              <p className="text-sm text-gray-600">
                                {format(record.date, 'MMM dd, yyyy HH:mm')}
                              </p>
                            </div>
                          </div>

                          {record.attachments && record.attachments.length > 0 && (
                            <div>
                              <h5 className="font-medium text-gray-800 mb-2">Attachments</h5>
                              <div className="space-y-2">
                                {record.attachments.map((attachment, index) => (
                                  <div key={index} className="flex items-center space-x-2 text-sm text-blue-600">
                                    <FileText className="w-4 h-4" />
                                    <span>{attachment}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex space-x-2 pt-2">
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              Add Note
                            </Button>
                            {record.isUrgent && (
                              <Button variant="destructive" size="sm">
                                Mark Resolved
                              </Button>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                  </Accordion>
                )}
              </TabsContent>

              {/* Prescriptions Tab */}
              <TabsContent value="prescriptions" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">Current Prescriptions</h3>
                  <Button size="lg" onClick={() => setIsPrescriptionModalOpen(true)}>
                    New Prescription
                  </Button>
                </div>
                <PriorAuthPdfFiller
  src="/HiLab-Prior-Authorization-Request-Form_1-28-22.pdf"
  data={
    {
            'patient.first_name': 'Jane',
            'patient.last_name': 'Doe',
            'patient.phone': '(555) 123-4567',
            'patient.address': '123 Main St',
            'patient.city': 'Charlotte',
            'patient.state': 'NC',
            'patient.zip': '28223',
            'patient.dob': '1990-01-01',
            'patient.sex_female': true,
            'insurance.primary': 'Blue Cross',
            'insurance.primary_id': 'ABC12345',
            'med.name': 'MedExample 40 mg',
            'p2.patient_name': 'Jane Doe',
            'p2.id': 'ABC12345',
            'p2.trials': [
              { drug: 'DrugA 20mg', duration: '01/2024–03/2024', response: 'Ineffective' },
              { drug: 'DrugB 10mg', duration: '03/2024–05/2024', response: 'Allergy (rash)' },
            ],
            'p2.icd10': 'E11.9; I10',
          }
  }
  fieldMap={exampleFieldMap}
  fileName="HiLab-Prior-Authorization-Request-Form_FILLED.pdf"
  debugGrid
  showCrosshairs
 // main fix: drop everything down ~0.5"
//  yOffset={-36}
 // page 2 usually needs a hair more:
 pageOffsets={{ 1: { y: -42 } }}
/>

                <Accordion type="multiple" className="w-full">
                  {mockPrescriptions.map((prescription) => (
                    <AccordionItem key={prescription.id} value={prescription.id} className="border-l-4 border-l-blue-500">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center space-x-4 w-full">
                          <div className="text-blue-600">
                            <Pill className="w-6 h-6" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-xl text-blue-900">
                                {prescription.diagnosis}
                              </h4>
                              <div className="flex items-center space-x-4">
                                <Badge variant={prescription.status === 'active' ? 'default' : 'secondary'} className="text-sm">
                                  {prescription.status}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {format(prescription.startDate, 'MMM dd, yyyy')}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-blue-700 mt-1">
                              <strong>ICD:</strong> {prescription.icdCode}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm text-gray-600">
                                {prescription.medications.length} medication{prescription.medications.length !== 1 ? 's' : ''}
                              </span>
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-xs text-gray-500">Safety checked</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <div className="pl-12 space-y-6">
                          {/* Safety Checks */}
                          <div className="p-4 bg-green-50 rounded-lg">
                            <h5 className="font-semibold text-green-800 mb-3">Safety Checks</h5>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm">Allergies checked</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm">Interactions checked</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {prescription.safetyChecks.renalAdjustment ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Clock className="w-4 h-4 text-gray-400" />
                                )}
                                <span className="text-sm">Renal adjustment</span>
                              </div>
                            </div>
                          </div>

                          {/* Medications List */}
                          <div>
                            <h5 className="font-semibold text-lg text-gray-800 mb-4">
                              Medications ({prescription.medications.length})
                            </h5>
                            <div className="space-y-4">
                              {prescription.medications.map((medication) => (
                                <div key={medication.id} className="p-4 border rounded-lg bg-gray-50">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h6 className="font-semibold text-lg text-gray-800">
                                        {medication.name}
                                      </h6>
                                      <p className="text-sm text-gray-600 mb-3">
                                        {medication.genericName}
                                      </p>
                                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                                        <div>
                                          <p className="text-xs font-medium text-gray-700">Dosage</p>
                                          <p className="text-sm font-semibold">{medication.dosage}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs font-medium text-gray-700">Frequency</p>
                                          <p className="text-sm font-semibold">{medication.frequency}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs font-medium text-gray-700">Duration</p>
                                          <p className="text-sm font-semibold">{medication.duration}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs font-medium text-gray-700">Refills</p>
                                          <p className="text-sm font-semibold">{medication.refills}</p>
                                        </div>
                                      </div>
                                      <div className="mb-3">
                                        <p className="text-xs font-medium text-gray-700 mb-1">Instructions</p>
                                        <p className="text-sm text-gray-600">{medication.instructions}</p>
                                      </div>
                                      <div className="flex items-center space-x-4 text-sm">
                                        <span className="text-gray-600">
                                          <strong>Cost:</strong> ${medication.cost}
                                        </span>
                                        <span className="text-gray-600">
                                          <strong>Insurance:</strong> {medication.insuranceCovered ? 'Covered' : 'Not Covered'}
                                        </span>
                                      </div>
                                      
                                      {/* Coverage Information */}
                                      {medication.rxcui && (
                                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                          <div className="flex items-center justify-between mb-2">
                                            <h6 className="font-medium text-blue-900 flex items-center">
                                              <Shield className="w-4 h-4 mr-2" />
                                              Insurance Coverage Status
                                            </h6>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleCheckCoverage(medication.id, medication.rxcui!)}
                                              disabled={loadingCoverage[`${medication.id}-${medication.rxcui}`]}
                                              className="text-xs"
                                            >
                                              {loadingCoverage[`${medication.id}-${medication.rxcui}`] ? 'Checking...' : 'Check Coverage'}
                                            </Button>
                                          </div>
                                          
                                          {coverageInfo[`${medication.id}-${medication.rxcui}`] && (
                                            <div className="space-y-2">
                                              {getCoverageStatusBadge(coverageInfo[`${medication.id}-${medication.rxcui}`])}
                                              
                                              {coverageInfo[`${medication.id}-${medication.rxcui}`].copay && (
                                                <div className="flex items-center text-sm text-blue-800">
                                                  <DollarSign className="w-3 h-3 mr-1" />
                                                  <span>Copay: ${coverageInfo[`${medication.id}-${medication.rxcui}`].copay}</span>
                                                </div>
                                              )}
                                              
                                              {coverageInfo[`${medication.id}-${medication.rxcui}`].coveragePercentage && (
                                                <div className="text-sm text-blue-800">
                                                  <span>Coverage: {coverageInfo[`${medication.id}-${medication.rxcui}`].coveragePercentage}%</span>
                                                </div>
                                              )}
                                              
                                              {coverageInfo[`${medication.id}-${medication.rxcui}`].formularyTier && (
                                                <div className="text-sm text-blue-800">
                                                  <span>Formulary Tier: {coverageInfo[`${medication.id}-${medication.rxcui}`].formularyTier}</span>
                                                </div>
                                              )}
                                              
                                              {coverageInfo[`${medication.id}-${medication.rxcui}`].restrictions && 
                                               coverageInfo[`${medication.id}-${medication.rxcui}`].restrictions!.length > 0 && (
                                                <div className="text-sm text-blue-800">
                                                  <span className="font-medium">Restrictions: </span>
                                                  {coverageInfo[`${medication.id}-${medication.rxcui}`].restrictions!.join(', ')}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Prescription Notes */}
                          {prescription.notes && (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <h6 className="font-semibold text-sm text-yellow-800 mb-2">Physician Notes</h6>
                              <p className="text-sm text-yellow-700">{prescription.notes}</p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex space-x-2 pt-2">
                            <Button variant="outline" size="sm">
                              Edit Prescription
                            </Button>
                            <Button variant="outline" size="sm">
                              Add Medication
                            </Button>
                            <Button variant="outline" size="sm">
                              Print Prescription
                            </Button>
                            {prescription.status === 'active' && (
                              <Button variant="destructive" size="sm">
                                Cancel Prescription
                              </Button>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* EMR Entry Modal */}
        <NewEMREntryModal
          isOpen={isEMRModalOpen}
          onClose={() => setIsEMRModalOpen(false)}
          onSave={handleSaveEMREntry}
          patientId={patient.id}
        />

        {/* New Prescription Modal */}
        <NewPrescriptionModal
          isOpen={isPrescriptionModalOpen}
          onClose={() => setIsPrescriptionModalOpen(false)}
          onSave={handleSavePrescription}
          patientId={patient.id}
        />
      </DialogContent>
    </Dialog>
  )
}
