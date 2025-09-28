'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, X, CheckCircle, AlertTriangle } from 'lucide-react'
import { Prescription, PrescriptionMedication, CoverageInfo } from '@/types'
import { fetchCoverageInfo, fetchEvidence } from '@/lib/api'
import PriorAuthPdfFiller, { exampleFieldMap } from './PriorAuthPdfFiller'

interface NewPrescriptionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (prescription: Omit<Prescription, 'id' | 'patientId' | 'physicianId' | 'createdAt'>) => void
  patientId: string
}

export function NewPrescriptionModal({ isOpen, onClose, onSave, patientId }: NewPrescriptionModalProps) {
  const [formData, setFormData] = useState({
    diagnosis: '',
    icdCode: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'active' as Prescription['status'],
    medications: [] as Omit<PrescriptionMedication, 'id' | 'medicationId'>[],
    safetyChecks: {
      allergies: false,
      interactions: false,
      renalAdjustment: false
    },
    notes: ''
  })

  const [newMedication, setNewMedication] = useState({
    name: '',
    genericName: '',
    frequency: '',
    instructions: '',
    duration: '30 days',
    cost: 0,
    insuranceCovered: true
  })

  const [rxcuiLookup, setRxcuiLookup] = useState({
    isLoading: false,
    rxcui: '',
    error: ''
  })

  const [coverageInfo, setCoverageInfo] = useState<CoverageInfo | null>(null)
  const [coverageLoading, setCoverageLoading] = useState(false)
  const [costInfo, setCostInfo] = useState<any>(null)
  const [costLoading, setCostLoading] = useState(false)
  const [evidenceInfo, setEvidenceInfo] = useState<any>(null)
  const [evidenceLoading, setEvidenceLoading] = useState(false)
  const [showPriorAuth, setShowPriorAuth] = useState(false)
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [alternativesInfo, setAlternativesInfo] = useState<any>(null)

  // Cost lookup function
  const fetchCost = async (rxcui: string, daysSupply: number = 2) => {
    console.log('fetchCost called with:', { rxcui, daysSupply })
    
    setCostLoading(true)
    setCostInfo(null)
    
    try {
      // Import mock data for cost information
      const { getCostData } = await import('@/lib/mockData')
      const costData = await getCostData()
      const hardcodedPatientId = costData.hardcodedPatientId
      
      const url = `http://localhost:8000/api/cost?patientId=${encodeURIComponent(hardcodedPatientId)}&rxcui=${encodeURIComponent(rxcui)}&daysSupply=1&coverageLevel=1&channel=RETAIL&preferred=1`
      console.log('Making cost API call to:', url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Cost API response:', data)
      setCostInfo(data)
      
      // Update cost in the medication form
      if (data.found && data.estimatedOutOfPocket !== undefined) {
        console.log('Using real cost data:', data.estimatedOutOfPocket)
        setNewMedication(prev => ({ ...prev, cost: parseFloat(data.estimatedOutOfPocket) }))
      } else if (!data.found) {
        console.log('Using mock cost data because found is false')
        // Use mock data when found is false
        setCostInfo(costData.mockCost)
        setNewMedication(prev => ({ ...prev, cost: parseFloat(costData.mockCost.estimatedOutOfPocket) }))
      }
    } catch (error) {
      console.error('Error fetching cost:', error)
      // Fallback to mock data on error
      const { getCostData } = await import('@/lib/mockData')
      const costData = await getCostData()
      setCostInfo(costData.mockCost)
      setNewMedication(prev => ({ ...prev, cost: parseFloat(costData.mockCost.estimatedOutOfPocket) }))
    } finally {
      setCostLoading(false)
    }
  }

  // Evidence digest lookup function
  const fetchEvidenceData = async (rxcui: string) => {
    console.log('fetchEvidence called with:', { rxcui })
    const { getCostData } = await import('@/lib/mockData')
    const costData = await getCostData()
    const hardcodedPatientId = costData.hardcodedPatientId
    
    setEvidenceLoading(true)
    setEvidenceInfo(null)
    
    try {
      console.log('Making evidence API call with POST method')
      const result = await fetchEvidence(hardcodedPatientId, rxcui)
      
      if (result.success && result.data) {
        console.log('Evidence API response:', result.data)
        setEvidenceInfo(result.data)
      } else {
        console.error('Evidence API error:', result.error)
      }
    } catch (error) {
      console.error('Error fetching evidence:', error)
    } finally {
      setEvidenceLoading(false)
    }
  }

  // Coverage lookup function
  const fetchCoverage = async (rxcui: string) => {
    const { getCostData } = await import('@/lib/mockData')
    const costData = await getCostData()
    const hardcodedPatientId = costData.hardcodedPatientId
    
    setCoverageLoading(true)
    setCoverageInfo(null)
    
    try {
      const result = await fetchCoverageInfo(hardcodedPatientId, rxcui)
      if (result.success && result.data) {
        setCoverageInfo(result.data)
        
        // Update insurance coverage based on API response
        const isCovered = result.data.covered === true || result.data.covered === "true"
        setNewMedication(prev => ({ ...prev, insuranceCovered: isCovered }))
        
        // Check if prior authorization is required
        if (isCovered && (result.data.priorAuthorization === false || result.data.priorAuthorization === "false")) {
          setShowPriorAuth(true)
        }
      }
    } catch (error) {
      console.error('Error fetching coverage:', error)
    } finally {
      setCoverageLoading(false)
    }
  }

  // RxCUI lookup function
  const fetchRxCUI = async (medicationName: string) => {
    if (!medicationName.trim()) {
      setRxcuiLookup({ isLoading: false, rxcui: '', error: '' })
      return
    }

    setRxcuiLookup(prev => ({ ...prev, isLoading: true, error: '' }))

    try {
      const response = await fetch(
        `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(medicationName)}&search=1`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.idGroup && data.idGroup.rxnormId && data.idGroup.rxnormId.length > 0) {
        const rxcui = data.idGroup.rxnormId[0]
        console.log('RxCUI found:', rxcui)
        setRxcuiLookup({ isLoading: false, rxcui, error: '' })
        setNewMedication(prev => ({ ...prev, genericName: rxcui }))
        
        // Automatically fetch coverage, cost, and evidence information
        console.log('Calling fetchCoverage with RxCUI:', rxcui)
        fetchCoverage(rxcui)
        console.log('Calling fetchCost with RxCUI:', rxcui)
        fetchCost(rxcui, 30) // Default 30 days supply
        console.log('Calling fetchEvidenceData with RxCUI:', rxcui)
        fetchEvidenceData(rxcui)
      } else {
        console.log('No RxCUI found in response:', data)
        setRxcuiLookup({ isLoading: false, rxcui: '', error: 'No RxCUI found for this medication' })
      }
    } catch (error) {
      console.error('Error fetching RxCUI:', error)
      setRxcuiLookup({ 
        isLoading: false, 
        rxcui: '', 
        error: error instanceof Error ? error.message : 'Failed to fetch RxCUI' 
      })
    }
  }

  // Debounced RxCUI lookup effect
  useEffect(() => {
    console.log('useEffect triggered for medication name:', newMedication.name)
    const timeoutId = setTimeout(() => {
      if (newMedication.name.trim()) {
        console.log('Calling fetchRxCUI for:', newMedication.name)
        fetchRxCUI(newMedication.name)
      } else {
        console.log('Clearing RxCUI lookup - empty medication name')
        setRxcuiLookup({ isLoading: false, rxcui: '', error: '' })
      }
    }, 3000) // 3 second debounce

    return () => clearTimeout(timeoutId)
  }, [newMedication.name])

  // Fetch alternatives data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAlternativesData()
    }
  }, [isOpen])

  // Fetch alternatives data function
  const fetchAlternativesData = async () => {
    setAlternativesInfo(null)
    
    try {
      const response = await fetch('http://localhost:8000/api/alternative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rxcui: "2553603"
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setAlternativesInfo(data)
    } catch (error) {
      console.error('Error fetching alternatives data:', error)
    } finally {
      
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.medications.length === 0) {
      alert('Please add at least one medication')
      return
    }

    const prescription: Omit<Prescription, 'id' | 'patientId' | 'physicianId' | 'createdAt'> = {
      diagnosis: formData.diagnosis || 'Prescription',
      icdCode: formData.icdCode || 'Z00.00',
      startDate: new Date(formData.startDate),
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      status: formData.status,
      medications: formData.medications.map((med, index) => ({
        ...med,
        id: `med-${Date.now()}-${index}`,
        medicationId: `medication-${Date.now()}-${index}`
      })),
      safetyChecks: formData.safetyChecks,
      notes: formData.notes || undefined
    }

    try {
      // Call API to add prescription to mock data
      const response = await fetch('/api/patient-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: patientId,
          dataType: 'prescription',
          data: {
            ...prescription,
            startDate: prescription.startDate.toISOString().split('T')[0],
            endDate: prescription.endDate?.toISOString().split('T')[0]
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Prescription added to mock data:', result.prescription)
        
        // Also call the original onSave for any additional handling
        onSave(prescription)
        
        // Show success message
        alert(`Prescription created successfully! Added ${prescription.medications.length} medication(s) to patient data.`)
        onClose()
        resetForm()
      } else {
        throw new Error('Failed to save prescription')
      }
    } catch (error) {
      console.error('Error saving prescription:', error)
      alert('Failed to save prescription. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      diagnosis: '',
      icdCode: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'active',
      medications: [],
      safetyChecks: {
        allergies: false,
        interactions: false,
        renalAdjustment: false
      },
      notes: ''
    })
    setNewMedication({
      name: '',
      genericName: '',
      frequency: '',
      instructions: '',
      duration: '30 days',
      cost: 0,
      insuranceCovered: true
    })
    setRxcuiLookup({ isLoading: false, rxcui: '', error: '' })
    setCoverageInfo(null)
    setCostInfo(null)
    setEvidenceInfo(null)
    setShowPriorAuth(false)
  }

  const addMedication = () => {
    if (newMedication.name && newMedication.frequency) {
      setFormData(prev => ({
        ...prev,
        medications: [...prev.medications, { 
          ...newMedication, 
          genericName: rxcuiLookup.rxcui || newMedication.genericName,
          rxcui: rxcuiLookup.rxcui || undefined 
        }]
      }))
      setNewMedication({
        name: '',
        genericName: '',
        frequency: '',
        instructions: '',
        duration: '30 days',
        cost: 0,
        insuranceCovered: true
      })
      setRxcuiLookup({ isLoading: false, rxcui: '', error: '' })
      setCoverageInfo(null)
      setCostInfo(null)
      setEvidenceInfo(null)
      setShowPriorAuth(false)
    }
  }

  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }))
  }

  const updateMedication = (index: number, field: keyof PrescriptionMedication, value: any) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-h-[90vh] overflow-y-auto"
        style={{ width: '50vw', maxWidth: 'none' }}
      >
        <DialogHeader>
          <DialogTitle>Create New Prescription</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Prescription Details */}
          <Card>
            <CardHeader>
              <CardTitle>Prescription Details</CardTitle>
              <CardDescription>Basic information about this prescription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Diagnosis</Label>
                  <Input
                    value={formData.diagnosis}
                    onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                    placeholder="e.g., Type 2 Diabetes"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ICD Code</Label>
                  <Input
                    value={formData.icdCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, icdCode: e.target.value }))}
                    placeholder="e.g., E11.9"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'active' | 'completed' | 'cancelled' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Prescription['status'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Add Medications */}
          <Card>
            <CardHeader>
              <CardTitle>Medications</CardTitle>
              <CardDescription>Add medications to this prescription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* New Medication Form */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold mb-4">Add New Medication</h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Medication Name</Label>
                    <Input
                      value={newMedication.name}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Metformin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>RxCUI</Label>
                    <div className="space-y-2">
                      <Input
                        value={rxcuiLookup.rxcui}
                        onChange={(e) => setRxcuiLookup(prev => ({ ...prev, rxcui: e.target.value }))}
                        placeholder="Auto-populated from medication name"
                        readOnly={rxcuiLookup.rxcui !== ''}
                        className={rxcuiLookup.rxcui ? 'bg-gray-100' : ''}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Input
                      value={newMedication.frequency}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))}
                      placeholder="e.g., Twice daily"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input
                      value={newMedication.duration}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g., 30 days"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Post Insurance Cost ($)</Label>
                    <div className="space-y-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={newMedication.cost}
                        onChange={(e) => setNewMedication(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                        className={costInfo ? 'bg-blue-50 border-blue-200' : ''}
                      />
                      {costLoading && (
                        <p className="text-xs text-blue-600">💰 Fetching post insurance cost...</p>
                      )}
                      {costInfo && (
                        <div className="text-xs space-y-1">
                          <p className="text-blue-600">
                            💰 Auto-updated from post insurance cost API
                            {costInfo.found === false && (
                              <span className="ml-1 text-orange-600">(using default data)</span>
                            )}
                          </p>
                          {costInfo.tier && (
                            <p className="text-gray-600">Tier: {costInfo.tier}</p>
                          )}
                          {costInfo.deductibleApplies !== undefined && (
                            <p className="text-gray-600">
                              Deductible: {costInfo.deductibleApplies ? 'Applies' : 'Does not apply'}
                            </p>
                          )}
                          {costInfo.specialtyTier && (
                            <p className="text-orange-600">⚠️ Specialty Tier</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Insurance Coverage</Label>
                    <div className="space-y-1">
                      <Select
                        value={newMedication.insuranceCovered ? 'covered' : 'not-covered'}
                        onValueChange={(value) => setNewMedication(prev => ({ ...prev, insuranceCovered: value === 'covered' }))}
                      >
                        <SelectTrigger className={coverageInfo ? 'bg-blue-50 border-blue-200' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="covered">Covered</SelectItem>
                          <SelectItem value="not-covered">Not Covered</SelectItem>
                        </SelectContent>
                      </Select>
                      {coverageInfo && (
                        <p className="text-xs text-blue-600">
                          📋 Auto-updated from coverage API
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Instructions */}
                <div className="space-y-2 mb-4">
                  <Label>Instructions</Label>
                  <Textarea
                    value={newMedication.instructions}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="e.g., Take with meals to reduce stomach upset"
                    rows={2}
                  />
                </div>
                
                {/* Evidence Flags */}
                {(evidenceLoading || evidenceInfo) && (
                  <div className="space-y-2">
                    <Label>Evidence Flags</Label>
                    <div className="space-y-2">
                      {evidenceLoading && (
                        <p className="text-xs text-blue-600">🔍 Checking evidence...</p>
                      )}
                      {evidenceInfo?.result?.flags && (
                        <div className="flex flex-wrap gap-2">
                          {/* High Priority Flags */}
                          {evidenceInfo.result.flags.high && evidenceInfo.result.flags.high.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {evidenceInfo.result.flags.high.map((flag: any, index: number) => (
                                <Badge key={`high-${index}`} variant="destructive" className="text-xs">
                                  🔴 High: {flag.type}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {/* Medium Priority Flags */}
                          {evidenceInfo.result.flags.medium && evidenceInfo.result.flags.medium.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {evidenceInfo.result.flags.medium.map((flag: any, index: number) => (
                                <Badge key={`medium-${index}`} variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                                  🟡 Medium: {flag.type}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {/* Info Flags */}
                          {evidenceInfo.result.flags.info && evidenceInfo.result.flags.info.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {evidenceInfo.result.flags.info.map((flag: any, index: number) => (
                                <Badge key={`info-${index}`} variant="outline" className="text-xs">
                                  ℹ️ Info: {flag.type}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {/* Show message if no flags */}
                          {(!evidenceInfo.result.flags.high || evidenceInfo.result.flags.high.length === 0) &&
                           (!evidenceInfo.result.flags.medium || evidenceInfo.result.flags.medium.length === 0) &&
                           (!evidenceInfo.result.flags.info || evidenceInfo.result.flags.info.length === 0) && (
                            <Badge variant="outline" className="text-xs text-green-600">
                              ✅ No flags detected
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {/* HCP Summary */}
                      {evidenceInfo?.result?.hcp_summary && (
                        <div className="p-2 bg-gray-50 border rounded text-xs">
                          <p className="font-medium text-gray-700 mb-1">HCP Summary:</p>
                          <strong><p className="text-gray-600">{evidenceInfo.result.hcp_summary}</p></strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Prior Authorization Button */}
                {showPriorAuth && coverageInfo && (
                  <div className="mt-4">
                    <PriorAuthPdfFiller
                      src="/HiLab-Prior-Authorization-Request-Form_1-28-22.pdf"
                      data={{
                        'patient.first_name': 'Lisa',
                        'patient.last_name': 'Baker',
                        'patient.phone': '(555) 123-4567',
                        'patient.address': '123 Main St',
                        'patient.city': '',
                        'patient.state': 'NC',
                        'patient.zip': '28223',
                        'patient.dob': '1990-01-01',
                        'patient.sex_female': true,
                        'insurance.primary': 'Blue Cross',
                        'insurance.primary_id': 'ABC12345',
                        'med.name': newMedication.name,
                        'p2.patient_name': 'Lisa Baker',
                        'p2.id': 'ABC12345',
                        'p2.trials': [
                          { drug: 'DrugA 20mg', duration: '01/2024–03/2024', response: 'Ineffective' },
                          { drug: 'DrugB 10mg', duration: '03/2024–05/2024', response: 'Allergy (rash)' },
                        ],
                        'p2.icd10': formData.icdCode || 'E11.9; I10',
                      }}
                      fieldMap={exampleFieldMap}
                      fileName={`prior-auth-${newMedication.name.toLowerCase().replace(/\s+/g, '-')}.pdf`}
                      buttonLabel="📄 Download Prior Authorization Form"
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      pageOffsets={{ 1: { y: -42 } }}
                    />
                  </div>
                )}
                <Button type="button" onClick={addMedication} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medication
                </Button>
                
                {/* Alternatives Button - Show when evidence data is available */}
                {(evidenceLoading || evidenceInfo) && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAlternatives(true)}
                    className="w-full mt-2"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Alternatives
                  </Button>
                )}
              </div>

              {/* Added Medications List */}
              {formData.medications.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Added Medications ({formData.medications.length})</h4>
                  {formData.medications.map((medication, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{medication.name}</span>
                          <Badge variant="outline">{medication.frequency}</Badge>
                          {medication.rxcui && <Badge variant="outline">RxCUI: {medication.rxcui}</Badge>}
                        </div>
                        <p className="text-sm text-gray-600">{medication.instructions}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMedication(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Safety Checks */}
          <Card>
            <CardHeader>
              <CardTitle>Safety Checks</CardTitle>
              <CardDescription>Verify safety requirements before prescribing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allergies"
                    checked={formData.safetyChecks.allergies}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      safetyChecks: { ...prev.safetyChecks, allergies: !!checked }
                    }))}
                  />
                  <Label htmlFor="allergies" className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Allergies checked</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="interactions"
                    checked={formData.safetyChecks.interactions}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      safetyChecks: { ...prev.safetyChecks, interactions: !!checked }
                    }))}
                  />
                  <Label htmlFor="interactions" className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Drug interactions checked</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="renal"
                    checked={formData.safetyChecks.renalAdjustment}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      safetyChecks: { ...prev.safetyChecks, renalAdjustment: !!checked }
                    }))}
                  />
                  <Label htmlFor="renal" className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Renal adjustment</span>
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Physician Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this prescription..."
              rows={3}
            />
          </div>


          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={formData.medications.length === 0}>
              Create Prescription
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      
      {/* Alternatives Dialog */}
      <Dialog open={showAlternatives} onOpenChange={setShowAlternatives}>
        <DialogContent 
          className="overflow-y-auto"
          style={{ width: '65vw', height: '60vh', maxWidth: 'none', maxHeight: 'none' }}
        >
          <DialogHeader>
            <DialogTitle>Alternative Medications</DialogTitle>
            <DialogDescription>
              Alternative medications based on evidence analysis for {newMedication.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {alternativesInfo && alternativesInfo.report_json && alternativesInfo.report_json.comparisons ? (
              <div className="space-y-4">
                {/* Input RxCUI */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">Input Medication</h3>
                  <p className="text-sm">
                    <span className="font-bold">RxCUI:</span> {alternativesInfo.input_rxcui}
                  </p>
                  {alternativesInfo.disease && (
                    <p className="text-sm mt-1">
                      <span className="font-bold">Disease:</span> {alternativesInfo.disease}
                    </p>
                  )}
                </div>

                {/* Comparisons Table */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Alternative Medications Comparison</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px] font-bold">Property</TableHead>
                          {alternativesInfo.report_json.comparisons.map((comparison: any, index: number) => (
                            <TableHead key={index} className="w-[150px] text-center font-bold">
                              {comparison.drug_name}
                              <div className="text-xs font-normal text-gray-500 mt-1">
                                RxCUI: {comparison.rxcui}
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Active Ingredients Row */}
                        <TableRow>
                          <TableCell className="font-medium">Active Ingredients</TableCell>
                          {alternativesInfo.report_json.comparisons.map((comparison: any, index: number) => (
                            <TableCell key={index} className="text-center">
                              <Badge variant={comparison.similarity.active_ingredients === "100%" ? "default" : "secondary"}>
                                {comparison.similarity.active_ingredients}
                              </Badge>
                            </TableCell>
                          ))}
                        </TableRow>
                        
                        {/* Indications Row */}
                        <TableRow>
                          <TableCell className="font-medium">Indications</TableCell>
                          {alternativesInfo.report_json.comparisons.map((comparison: any, index: number) => (
                            <TableCell key={index} className="text-center">
                              <Badge variant={parseInt(comparison.similarity.indications) >= 90 ? "default" : "secondary"}>
                                {comparison.similarity.indications}
                              </Badge>
                            </TableCell>
                          ))}
                        </TableRow>
                        
                        {/* Contraindications Row */}
                        <TableRow>
                          <TableCell className="font-medium">Contraindications</TableCell>
                          {alternativesInfo.report_json.comparisons.map((comparison: any, index: number) => (
                            <TableCell key={index} className="text-center">
                              <Badge variant={comparison.similarity.contraindications === "100%" ? "default" : "secondary"}>
                                {comparison.similarity.contraindications}
                              </Badge>
                            </TableCell>
                          ))}
                        </TableRow>
                        
                        {/* Warnings Row */}
                        <TableRow>
                          <TableCell className="font-medium">Warnings & Precautions</TableCell>
                          {alternativesInfo.report_json.comparisons.map((comparison: any, index: number) => (
                            <TableCell key={index} className="text-center">
                              <Badge variant={parseInt(comparison.similarity.warnings_precautions) >= 90 ? "default" : "secondary"}>
                                {comparison.similarity.warnings_precautions}
                              </Badge>
                            </TableCell>
                          ))}
                        </TableRow>
                        
                        {/* Adverse Reactions Row */}
                        <TableRow>
                          <TableCell className="font-medium">Adverse Reactions</TableCell>
                          {alternativesInfo.report_json.comparisons.map((comparison: any, index: number) => (
                            <TableCell key={index} className="text-center">
                              <Badge variant={parseInt(comparison.similarity.adverse_reactions) >= 90 ? "default" : "secondary"}>
                                {comparison.similarity.adverse_reactions}
                              </Badge>
                            </TableCell>
                          ))}
                        </TableRow>
                        
                        {/* Drug Interactions Row */}
                        <TableRow>
                          <TableCell className="font-medium">Drug Interactions</TableCell>
                          {alternativesInfo.report_json.comparisons.map((comparison: any, index: number) => (
                            <TableCell key={index} className="text-center">
                              <Badge variant={comparison.similarity.drug_interactions === "100%" ? "default" : "secondary"}>
                                {comparison.similarity.drug_interactions}
                              </Badge>
                            </TableCell>
                          ))}
                        </TableRow>
                        
                        {/* Dosage Row */}
                        <TableRow>
                          <TableCell className="font-medium">Dosage & Administration</TableCell>
                          {alternativesInfo.report_json.comparisons.map((comparison: any, index: number) => (
                            <TableCell key={index} className="text-center">
                              <Badge variant={parseInt(comparison.similarity.dosage_administration) >= 90 ? "default" : "secondary"}>
                                {comparison.similarity.dosage_administration}
                              </Badge>
                            </TableCell>
                          ))}
                        </TableRow>
                        
                        {/* Populations Row */}
                        <TableRow>
                          <TableCell className="font-medium">Use in Specific Populations</TableCell>
                          {alternativesInfo.report_json.comparisons.map((comparison: any, index: number) => (
                            <TableCell key={index} className="text-center">
                              <Badge variant={parseInt(comparison.similarity.use_in_specific_populations) >= 90 ? "default" : "secondary"}>
                                {comparison.similarity.use_in_specific_populations}
                              </Badge>
                            </TableCell>
                          ))}
                        </TableRow>
                        
                        {/* Mechanism Row */}
                        <TableRow>
                          <TableCell className="font-medium">Mechanism of Action</TableCell>
                          {alternativesInfo.report_json.comparisons.map((comparison: any, index: number) => (
                            <TableCell key={index} className="text-center">
                              <Badge variant={parseInt(comparison.similarity.mechanism_of_action) >= 95 ? "default" : "secondary"}>
                                {comparison.similarity.mechanism_of_action}
                              </Badge>
                            </TableCell>
                          ))}
                        </TableRow>
                        
                        {/* Doctor Notes Row */}
                        <TableRow>
                          <TableCell className="font-medium">Doctor Note</TableCell>
                          {alternativesInfo.report_json.comparisons.map((comparison: any, index: number) => (
                            <TableCell key={index} className="text-sm text-center">
                              {comparison.doctor_note}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No alternative medications found.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Evidence data is still being analyzed or no alternatives are available.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAlternatives(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
