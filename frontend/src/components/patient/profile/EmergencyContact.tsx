'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  Phone, 
  User,
  Edit,
  Save,
  X
} from 'lucide-react'

interface EmergencyContactProps {
  data: {
    emergencyContact: {
      name: string
      phone: string
      relationship: string
    }
  }
  isEditing: boolean
  onSave: (data: Partial<any>) => void
}

export function EmergencyContact({ data, isEditing, onSave }: EmergencyContactProps) {
  const [formData, setFormData] = useState({
    name: data.emergencyContact.name,
    phone: data.emergencyContact.phone,
    relationship: data.emergencyContact.relationship
  })

  const [isLocalEditing, setIsLocalEditing] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onSave({
      emergencyContact: {
        name: formData.name,
        phone: formData.phone,
        relationship: formData.relationship
      }
    })
    setIsLocalEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      name: data.emergencyContact.name,
      phone: data.emergencyContact.phone,
      relationship: data.emergencyContact.relationship
    })
    setIsLocalEditing(false)
  }

  const isCurrentlyEditing = isEditing || isLocalEditing

  const relationshipOptions = [
    'Spouse',
    'Parent',
    'Child',
    'Sibling',
    'Grandparent',
    'Grandchild',
    'Friend',
    'Neighbor',
    'Other'
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span>Emergency Contact</span>
              </CardTitle>
              <CardDescription>
                Person to contact in case of emergency
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
          {/* Contact Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Full Name</span>
                </Label>
                {isCurrentlyEditing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter full name"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <span className="font-medium">{data.emergencyContact.name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Phone Number</span>
                </Label>
                {isCurrentlyEditing ? (
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <span className="font-medium">{data.emergencyContact.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship</Label>
              {isCurrentlyEditing ? (
                <Select
                  value={formData.relationship}
                  onValueChange={(value) => handleInputChange('relationship', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 bg-gray-50 rounded-md">
                  <Badge variant="outline">
                    {data.emergencyContact.relationship}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Contact Card */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-2">Emergency Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-red-600" />
                    <span className="text-red-800 font-medium">{data.emergencyContact.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-red-600" />
                    <span className="text-red-800">{data.emergencyContact.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600 font-medium">Relationship:</span>
                    <span className="text-red-800">{data.emergencyContact.relationship}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">Important Notes</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Make sure your emergency contact is aware they are listed</li>
              <li>• Keep this information up to date</li>
              <li>• Ensure the phone number is current and accessible</li>
              <li>• Consider having a backup emergency contact</li>
            </ul>
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
