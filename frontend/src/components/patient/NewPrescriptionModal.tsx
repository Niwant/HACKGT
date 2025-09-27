'use client'

import React, { useState } from 'react'
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
import { Prescription, PrescriptionMedication } from '@/types'

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
    dosage: '',
    frequency: '',
    instructions: '',
    refills: 1,
    duration: '30 days',
    cost: 0,
    insuranceCovered: true
  })

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

    onSave(prescription)
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
      dosage: '',
      frequency: '',
      instructions: '',
      refills: 1,
      duration: '30 days',
      cost: 0,
      insuranceCovered: true
    })
  }

  const addMedication = () => {
    if (newMedication.name && newMedication.dosage && newMedication.frequency) {
      setFormData(prev => ({
        ...prev,
        medications: [...prev.medications, { ...newMedication }]
      }))
      setNewMedication({
        name: '',
        genericName: '',
        dosage: '',
        frequency: '',
        instructions: '',
        refills: 1,
        duration: '30 days',
        cost: 0,
        insuranceCovered: true
      })
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
                    <Label>Generic Name</Label>
                    <Input
                      value={newMedication.genericName}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, genericName: e.target.value }))}
                      placeholder="e.g., Metformin HCl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Dosage</Label>
                    <Input
                      value={newMedication.dosage}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                      placeholder="e.g., 500mg"
                    />
                  </div>
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
                    <Label>Refills</Label>
                    <Input
                      type="number"
                      value={newMedication.refills}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, refills: parseInt(e.target.value) || 0 }))}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newMedication.cost}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Insurance Coverage</Label>
                    <Select
                      value={newMedication.insuranceCovered ? 'covered' : 'not-covered'}
                      onValueChange={(value) => setNewMedication(prev => ({ ...prev, insuranceCovered: value === 'covered' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="covered">Covered</SelectItem>
                        <SelectItem value="not-covered">Not Covered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                          <Badge variant="outline">{medication.dosage}</Badge>
                          <Badge variant="outline">{medication.frequency}</Badge>
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
