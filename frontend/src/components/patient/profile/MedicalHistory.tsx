'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  FileText, 
  Calendar,
  Plus,
  Trash2,
  Edit,
  Save,
  X
} from 'lucide-react'
import { format } from 'date-fns'

interface MedicalHistoryProps {
  data: {
    medicalHistory: string[]
  }
  isEditing: boolean
  onSave: (data: Partial<any>) => void
}

interface HistoryEntry {
  id: string
  condition: string
  date: string
  notes: string
  status: 'active' | 'resolved' | 'chronic'
}

export function MedicalHistory({ data, isEditing, onSave }: MedicalHistoryProps) {
  const [formData, setFormData] = useState({
    medicalHistory: [...data.medicalHistory]
  })

  const [isLocalEditing, setIsLocalEditing] = useState(false)
  const [newEntry, setNewEntry] = useState({
    condition: '',
    date: '',
    notes: '',
    status: 'active' as 'active' | 'resolved' | 'chronic'
  })

  // Convert simple string array to more detailed entries for display
  const historyEntries: HistoryEntry[] = data.medicalHistory.map((entry, index) => {
    const parts = entry.split(' (')
    return {
      id: `entry-${index}`,
      condition: parts[0],
      date: parts[1] ? parts[1].replace(')', '') : 'Unknown',
      notes: '',
      status: 'active' as const
    }
  })

  const handleSave = () => {
    onSave({
      medicalHistory: formData.medicalHistory
    })
    setIsLocalEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      medicalHistory: [...data.medicalHistory]
    })
    setNewEntry({
      condition: '',
      date: '',
      notes: '',
      status: 'active'
    })
    setIsLocalEditing(false)
  }

  const addEntry = () => {
    if (newEntry.condition.trim()) {
      const entry = `${newEntry.condition} (${newEntry.date || 'Unknown'})`
      if (!formData.medicalHistory.includes(entry)) {
        setFormData(prev => ({
          ...prev,
          medicalHistory: [...prev.medicalHistory, entry]
        }))
        setNewEntry({
          condition: '',
          date: '',
          notes: '',
          status: 'active'
        })
      }
    }
  }

  const removeEntry = (entry: string) => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: prev.medicalHistory.filter(e => e !== entry)
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800 border-red-200'
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200'
      case 'chronic': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const isCurrentlyEditing = isEditing || isLocalEditing

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Medical History</span>
              </CardTitle>
              <CardDescription>
                Your past and current medical conditions and treatments
              </CardDescription>
            </div>
            {!isCurrentlyEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLocalEditing(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Entry */}
          {isCurrentlyEditing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-4">Add New Medical History Entry</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition/Diagnosis</Label>
                    <Input
                      id="condition"
                      value={newEntry.condition}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, condition: e.target.value }))}
                      placeholder="e.g., Type 2 Diabetes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date Diagnosed</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEntry.date}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={newEntry.notes}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional details about this condition..."
                    rows={2}
                  />
                </div>

                <Button onClick={addEntry} disabled={!newEntry.condition.trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </Button>
              </div>
            </div>
          )}

          {/* Current Entries */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Medical History Entries</h3>
            
            {isCurrentlyEditing ? (
              <div className="space-y-3">
                {formData.medicalHistory.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium">{entry}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEntry(entry)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {formData.medicalHistory.length === 0 && (
                  <p className="text-gray-500 italic text-center py-4">
                    No medical history entries yet
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {historyEntries.length > 0 ? (
                  historyEntries.map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-lg">{entry.condition}</h4>
                            <Badge className={getStatusColor(entry.status)}>
                              {entry.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Diagnosed: {entry.date}</span>
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-gray-700 mt-2">{entry.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No medical history recorded</p>
                    <p className="text-sm">Add your medical conditions to get started</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{historyEntries.length}</div>
              <div className="text-sm text-blue-800">Total Conditions</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">
                {historyEntries.filter(e => e.status === 'active').length}
              </div>
              <div className="text-sm text-red-800">Active Conditions</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {historyEntries.filter(e => e.status === 'resolved').length}
              </div>
              <div className="text-sm text-green-800">Resolved Conditions</div>
            </div>
          </div>

          {/* Action Buttons */}
          {isCurrentlyEditing && (
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
