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
import { EMR } from '@/types'

interface NewEMREntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (entry: Omit<EMR, 'id' | 'patientId' | 'physicianId'>) => void
  patientId: string
}

export function NewEMREntryModal({ isOpen, onClose, onSave, patientId }: NewEMREntryModalProps) {
  const [formData, setFormData] = useState({
    type: 'note' as EMR['type'],
    title: '',
    content: '',
    value: '',
    unit: '',
    isUrgent: false,
    attachments: [] as string[]
  })

  const [newAttachment, setNewAttachment] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const entry: Omit<EMR, 'id' | 'patientId' | 'physicianId'> = {
      type: formData.type,
      title: formData.title,
      content: formData.content,
      value: formData.value || undefined,
      unit: formData.unit || undefined,
      date: new Date(),
      isUrgent: formData.isUrgent,
      attachments: formData.attachments.length > 0 ? formData.attachments : undefined
    }

    try {
      // Call API to add EMR entry to mock data
      const response = await fetch('/api/patient-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: patientId,
          dataType: 'emr',
          data: {
            ...entry,
            date: entry.date.toISOString().split('T')[0]
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('EMR entry added to mock data:', result.emrEntry)
        
        // Also call the original onSave for any additional handling
        onSave(entry)
        
        // Show success message
        alert(`EMR entry created successfully! Added ${formData.type} entry to patient data.`)
        onClose()
        resetForm()
      } else {
        throw new Error('Failed to save EMR entry')
      }
    } catch (error) {
      console.error('Error saving EMR entry:', error)
      alert('Failed to save EMR entry. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      type: 'note',
      title: '',
      content: '',
      value: '',
      unit: '',
      isUrgent: false,
      attachments: []
    })
    setNewAttachment('')
  }

  const addAttachment = () => {
    if (newAttachment.trim()) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, newAttachment.trim()]
      }))
      setNewAttachment('')
    }
  }

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const getTypeDescription = (type: EMR['type']) => {
    switch (type) {
      case 'vitals': return 'Blood pressure, heart rate, temperature, etc.'
      case 'diagnosis': return 'Medical conditions, diseases, disorders'
      case 'lab': return 'Lab results, blood tests, urine tests'
      case 'imaging': return 'X-rays, MRIs, CT scans, ultrasounds'
      case 'note': return 'General notes, observations, comments'
      case 'medication': return 'Medication changes, adjustments'
      default: return ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New EMR Entry</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Entry Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: EMR['type']) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vitals">Vitals</SelectItem>
                  <SelectItem value="diagnosis">Diagnosis</SelectItem>
                  <SelectItem value="lab">Lab Results</SelectItem>
                  <SelectItem value="imaging">Imaging</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="medication">Medication</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">{getTypeDescription(formData.type)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter entry title"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Description</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter detailed description"
              rows={4}
              required
            />
          </div>

          {(formData.type === 'vitals' || formData.type === 'lab') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="e.g., 120/80, 98.6, 7.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="e.g., mmHg, °F, %"
                />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Label>Attachments</Label>
            <div className="flex space-x-2">
              <Input
                value={newAttachment}
                onChange={(e) => setNewAttachment(e.target.value)}
                placeholder="Enter attachment name or URL"
              />
              <Button type="button" onClick={addAttachment} variant="outline">
                Add
              </Button>
            </div>
            {formData.attachments.length > 0 && (
              <div className="space-y-2">
                {formData.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{attachment}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="urgent"
              checked={formData.isUrgent}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isUrgent: !!checked }))}
            />
            <Label htmlFor="urgent" className="text-sm">
              Mark as urgent
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
