'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Pill, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  DollarSign,
  Shield,
  Info,
  TrendingUp,
  Bell,
  Sparkles
} from 'lucide-react'
import { Medication, EMR, Prescription } from '@/types'
import { format, isAfter, isBefore, differenceInDays } from 'date-fns'
import { MedicationSummaryModal } from './MedicationSummaryModal'

interface MedicationTrackerProps {
  medications: Medication[]
  onMedicationTaken: (medicationId: string, time: Date) => void
  onMedicationSkipped: (medicationId: string, reason: string) => void
  prescriptions?: Prescription[]
  emrRecords?: EMR[]
  patientName?: string
}

interface MedicationLog {
  medicationId: string
  taken: boolean
  time: Date
  reason?: string
}

export function MedicationTracker({ medications, onMedicationTaken, onMedicationSkipped, prescriptions = [], emrRecords = [], patientName = 'Patient' }: MedicationTrackerProps) {
  const [activeTab, setActiveTab] = useState<'today' | 'schedule' | 'history' | 'costs'>('today')
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([])
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false)

  const today = new Date()
  const todayLogs = medicationLogs.filter(log => 
    format(log.time, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  )

  const getMedicationStatus = (medication: Medication) => {
    const todayLog = todayLogs.find(log => log.medicationId === medication.id)
    if (todayLog) return todayLog.taken ? 'taken' : 'skipped'
    return 'pending'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken': return 'text-green-600 bg-green-50 border-green-200'
      case 'skipped': return 'text-red-600 bg-red-50 border-red-200'
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'skipped': return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'pending': return <Clock className="w-5 h-5 text-yellow-600" />
      default: return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const handleTakeMedication = (medicationId: string) => {
    const log: MedicationLog = {
      medicationId,
      taken: true,
      time: new Date()
    }
    setMedicationLogs(prev => [...prev, log])
    onMedicationTaken(medicationId, new Date())
  }

  const handleSkipMedication = (medicationId: string, reason: string) => {
    const log: MedicationLog = {
      medicationId,
      taken: false,
      time: new Date(),
      reason
    }
    setMedicationLogs(prev => [...prev, log])
    onMedicationSkipped(medicationId, reason)
  }

  const getNextDoseTime = (medication: Medication) => {
    // Simple logic - in real app, this would be more sophisticated
    const frequency = medication.frequency.toLowerCase()
    if (frequency.includes('twice')) return 'Next dose in 12 hours'
    if (frequency.includes('once')) return 'Next dose tomorrow'
    if (frequency.includes('three')) return 'Next dose in 8 hours'
    return 'Check with your doctor'
  }

  const calculateAdherence = () => {
    const totalDoses = medications.length * 2 // Assuming 2 doses per day
    const takenDoses = todayLogs.filter(log => log.taken).length
    return totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0
  }

  const totalMonthlyCost = medications.reduce((sum, med) => sum + med.cost, 0)
  const insuranceSavings = medications
    .filter(med => med.insuranceCovered)
    .reduce((sum, med) => sum + (med.cost * 0.8), 0) // Assuming 80% coverage

  return (
    <div className="space-y-6">
      {/* Adherence Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Adherence</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateAdherence()}%</div>
            <Progress value={calculateAdherence()} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {todayLogs.filter(log => log.taken).length} of {medications.length * 2} doses taken
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medications</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medications.length}</div>
            <p className="text-xs text-muted-foreground">
              Active prescriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMonthlyCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Before insurance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insurance Savings</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${insuranceSavings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Today's Doses</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="costs">Costs & Coverage</TabsTrigger>
        </TabsList>

        {/* Today's Doses Tab */}
        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Today's Medication Schedule</CardTitle>
                  <CardDescription>
                    Track your daily medication intake
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setIsSummaryModalOpen(true)}
                  variant="outline"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 border-0"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Summarize Medications
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {medications.map((medication) => {
                  const status = getMedicationStatus(medication)
                  
                  return (
                    <div
                      key={medication.id}
                      className={`p-4 border rounded-lg ${getStatusColor(status)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="mt-1">
                            {getStatusIcon(status)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{medication.name}</h3>
                            <p className="text-sm text-gray-600">{medication.genericName}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm">
                                <strong>Dosage:</strong> {medication.dosage}
                              </p>
                              <p className="text-sm">
                                <strong>Frequency:</strong> {medication.frequency}
                              </p>
                              <p className="text-sm">
                                <strong>Instructions:</strong> {medication.instructions}
                              </p>
                            </div>
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                {status === 'taken' ? 'Taken' : status === 'skipped' ? 'Skipped' : 'Pending'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {status === 'pending' && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleTakeMedication(medication.id)}
                            >
                              Mark Taken
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSkipMedication(medication.id, 'Forgot to take')}
                            >
                              Skip
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medication Schedule</CardTitle>
              <CardDescription>
                Your complete medication schedule and timing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {medications.map((medication) => (
                  <div key={medication.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{medication.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{medication.genericName}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Dosage</p>
                            <p className="text-lg font-semibold">{medication.dosage}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Frequency</p>
                            <p className="text-lg font-semibold">{medication.frequency}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-blue-50 rounded-lg mb-3">
                          <p className="text-sm text-blue-800">
                            <strong>Next Dose:</strong> {getNextDoseTime(medication)}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Instructions</p>
                          <p className="text-sm text-gray-600">{medication.instructions}</p>
                        </div>

                        {medication.sideEffects.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Possible Side Effects</p>
                            <div className="flex flex-wrap gap-1">
                              {medication.sideEffects.map((effect, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {effect}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medication History</CardTitle>
              <CardDescription>
                Track your medication adherence over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {medicationLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Pill className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No medication history yet</p>
                    <p className="text-sm">Start taking your medications to see your history here</p>
                  </div>
                ) : (
                  medicationLogs
                    .sort((a, b) => b.time.getTime() - a.time.getTime())
                    .map((log, index) => {
                      const medication = medications.find(med => med.id === log.medicationId)
                      return (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {log.taken ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                            )}
                            <div>
                              <p className="font-medium">{medication?.name || 'Unknown Medication'}</p>
                              <p className="text-sm text-gray-600">
                                {format(log.time, 'MMM dd, yyyy HH:mm')}
                              </p>
                              {log.reason && (
                                <p className="text-sm text-red-600">Reason: {log.reason}</p>
                              )}
                            </div>
                          </div>
                          <Badge variant={log.taken ? 'default' : 'destructive'}>
                            {log.taken ? 'Taken' : 'Skipped'}
                          </Badge>
                        </div>
                      )
                    })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Costs & Insurance Coverage</CardTitle>
              <CardDescription>
                Understand your medication costs and insurance benefits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {medications.map((medication) => (
                  <div key={medication.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{medication.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{medication.genericName}</p>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Monthly Cost</p>
                            <p className="text-2xl font-bold">${medication.cost}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Insurance Coverage</p>
                            <div className="flex items-center space-x-2">
                              {medication.insuranceCovered ? (
                                <>
                                  <Shield className="w-5 h-5 text-green-600" />
                                  <span className="text-green-600 font-semibold">Covered</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-5 h-5 text-red-600" />
                                  <span className="text-red-600 font-semibold">Not Covered</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {medication.insuranceCovered && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-800">
                              <strong>Estimated Savings:</strong> ${(medication.cost * 0.8).toFixed(2)}/month
                            </p>
                            <p className="text-xs text-green-700">
                              Based on typical 80% insurance coverage
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Cost Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700">Total Monthly Cost:</p>
                      <p className="font-semibold">${totalMonthlyCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-blue-700">Estimated Insurance Savings:</p>
                      <p className="font-semibold">${insuranceSavings.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Medication Summary Modal */}
      <MedicationSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        medications={medications}
        prescriptions={prescriptions}
        emrRecords={emrRecords}
        patientName={patientName}
      />
    </div>
  )
}
