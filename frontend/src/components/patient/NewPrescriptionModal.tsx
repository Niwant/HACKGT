'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, X, CheckCircle, AlertTriangle } from 'lucide-react'
import { Prescription, PrescriptionMedication, CoverageInfo } from '@/types'
import { fetchCoverageInfo, fetchEvidence } from '@/lib/api'

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

  // Cost lookup function
  const fetchCost = async (rxcui: string, daysSupply: number = 2) => {
    console.log('fetchCost called with:', { rxcui, daysSupply })
    
    setCostLoading(true)
    setCostInfo(null)
    
    try {
      // Import mock data for cost information
      const { costData } = await import('@/lib/mockData')
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
      const { costData } = await import('@/lib/mockData')
      setCostInfo(costData.mockCost)
      setNewMedication(prev => ({ ...prev, cost: parseFloat(costData.mockCost.estimatedOutOfPocket) }))
    } finally {
      setCostLoading(false)
    }
  }

  // Evidence digest lookup function
  const fetchEvidenceData = async (rxcui: string) => {
    console.log('fetchEvidence called with:', { rxcui })
    const { costData } = await import('@/lib/mockData')
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
    const hardcodedPatientId = '015786ad-e05e-2812-b3e8-11713aa05988'
    
    setCoverageLoading(true)
    setCoverageInfo(null)
    
    try {
      const result = await fetchCoverageInfo(hardcodedPatientId, rxcui)
      if (result.success && result.data) {
        setCoverageInfo(result.data)
        
        // Update insurance coverage based on API response
        const isCovered = result.data.coverageStatus === 'covered'
        setNewMedication(prev => ({ ...prev, insuranceCovered: isCovered }))
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

  const handleSubmit = (e: React.FormEvent) => {
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

    // Add to mock data instead of just calling onSave
    console.log('Adding prescription to mock data:', prescription)
    
    // For now, we'll still call onSave but also log the data
    // In a real app, this would be saved to a database or state management
    onSave(prescription)
    
    // Show success message
    alert('Prescription created successfully!')
    onClose()
    resetForm()
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Prescription</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                <div className="grid grid-cols-2 gap-4 mb-4">
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
                      
                      {/* Coverage Status */}
                      {coverageLoading && (
                        <p className="text-xs text-blue-600">🔍 Checking coverage...</p>
                      )}
                      {coverageInfo && (
                        <div className="text-xs space-y-1">
                          <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            coverageInfo.coverageStatus === 'covered' 
                              ? 'bg-green-100 text-green-800' 
                              : coverageInfo.coverageStatus === 'not_covered'
                              ? 'bg-red-100 text-red-800'
                              : coverageInfo.coverageStatus === 'prior_auth_required'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {coverageInfo.coverageStatus === 'covered' && '✅ Covered'}
                            {coverageInfo.coverageStatus === 'not_covered' && '❌ Not Covered'}
                            {coverageInfo.coverageStatus === 'prior_auth_required' && '⚠️ Prior Auth Required'}
                            {coverageInfo.coverageStatus === 'unknown' && '❓ Unknown'}
                          </div>
                          {coverageInfo.copay && (
                            <p className="text-gray-600">Copay: ${coverageInfo.copay}</p>
                          )}
                          {coverageInfo.coveragePercentage && (
                            <p className="text-gray-600">Coverage: {coverageInfo.coveragePercentage}%</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
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
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Cost ($)</Label>
                    <div className="space-y-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={newMedication.cost}
                        onChange={(e) => setNewMedication(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                        className={costInfo ? 'bg-blue-50 border-blue-200' : ''}
                      />
                      {costLoading && (
                        <p className="text-xs text-blue-600">💰 Fetching cost...</p>
                      )}
                      {costInfo && (
                        <div className="text-xs space-y-1">
                          <p className="text-blue-600">
                            💰 Auto-updated from cost API
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
                          <p className="text-gray-600">{evidenceInfo.result.hcp_summary}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="space-y-2 mb-4">
                  <Label>Instructions</Label>
                  <Textarea
                    value={newMedication.instructions}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="e.g., Take with meals to reduce stomach upset"
                    rows={2}
                  />
                </div>
                <Button type="button" onClick={addMedication} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medication
                </Button>
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
    </Dialog>
  )
}
