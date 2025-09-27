'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Heart, 
  AlertTriangle, 
  Activity,
  Edit,
  Save,
  X,
  Plus,
  Trash2
} from 'lucide-react'

interface HealthInfoProps {
  data: {
    currentConditions: string[]
    allergies: string[]
  }
  isEditing: boolean
  onSave: (data: Partial<any>) => void
}

export function HealthInfo({ data, isEditing, onSave }: HealthInfoProps) {
  const [formData, setFormData] = useState({
    currentConditions: [...data.currentConditions],
    allergies: [...data.allergies]
  })

  const [isLocalEditing, setIsLocalEditing] = useState(false)
  const [newCondition, setNewCondition] = useState('')
  const [newAllergy, setNewAllergy] = useState('')

  const handleSave = () => {
    onSave({
      currentConditions: formData.currentConditions,
      allergies: formData.allergies
    })
    setIsLocalEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      currentConditions: [...data.currentConditions],
      allergies: [...data.allergies]
    })
    setNewCondition('')
    setNewAllergy('')
    setIsLocalEditing(false)
  }

  const addCondition = () => {
    if (newCondition.trim() && !formData.currentConditions.includes(newCondition.trim())) {
      setFormData(prev => ({
        ...prev,
        currentConditions: [...prev.currentConditions, newCondition.trim()]
      }))
      setNewCondition('')
    }
  }

  const removeCondition = (condition: string) => {
    setFormData(prev => ({
      ...prev,
      currentConditions: prev.currentConditions.filter(c => c !== condition)
    }))
  }

  const addAllergy = () => {
    if (newAllergy.trim() && !formData.allergies.includes(newAllergy.trim())) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }))
      setNewAllergy('')
    }
  }

  const removeAllergy = (allergy: string) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== allergy)
    }))
  }

  const isCurrentlyEditing = isEditing || isLocalEditing

  return (
    <div className="space-y-6">
      {/* Current Conditions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="w-5 h-5" />
                <span>Current Health Conditions</span>
              </CardTitle>
              <CardDescription>
                Medical conditions you are currently being treated for
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
        <CardContent className="space-y-4">
          {isCurrentlyEditing ? (
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  placeholder="Add a new condition..."
                  onKeyPress={(e) => e.key === 'Enter' && addCondition()}
                />
                <Button onClick={addCondition} disabled={!newCondition.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.currentConditions.map((condition, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                    <span className="text-sm font-medium text-blue-800">{condition}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(condition)}
                      className="h-6 w-6 p-0 hover:bg-blue-200"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.currentConditions.length > 0 ? (
                data.currentConditions.map((condition, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {condition}
                  </Badge>
                ))
              ) : (
                <p className="text-gray-500 italic">No current conditions recorded</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Allergies */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span>Allergies & Sensitivities</span>
              </CardTitle>
              <CardDescription>
                Substances you are allergic or sensitive to
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
        <CardContent className="space-y-4">
          {isCurrentlyEditing ? (
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Add a new allergy..."
                  onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                />
                <Button onClick={addAllergy} disabled={!newAllergy.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.allergies.map((allergy, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-red-50 px-3 py-1 rounded-full">
                    <span className="text-sm font-medium text-red-800">{allergy}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAllergy(allergy)}
                      className="h-6 w-6 p-0 hover:bg-red-200"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.allergies.length > 0 ? (
                data.allergies.map((allergy, index) => (
                  <Badge key={index} variant="destructive" className="text-sm">
                    {allergy}
                  </Badge>
                ))
              ) : (
                <p className="text-gray-500 italic">No allergies recorded</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Health Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Additional Health Information</span>
          </CardTitle>
          <CardDescription>
            Any other relevant health information you'd like to share
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any additional health information, special considerations, or notes..."
            className="min-h-[100px]"
            disabled={!isCurrentlyEditing}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {isCurrentlyEditing && (
        <div className="flex justify-end space-x-2">
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
    </div>
  )
}
