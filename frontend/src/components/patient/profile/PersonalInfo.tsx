'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Edit,
  Save,
  X
} from 'lucide-react'
import { format } from 'date-fns'

interface PersonalInfoProps {
  data: {
    firstName: string
    lastName: string
    dateOfBirth: Date
    gender: 'male' | 'female' | 'other'
    phone: string
    email: string
    address: string
  }
  isEditing: boolean
  onSave: (data: Partial<any>) => void
}

export function PersonalInfo({ data, isEditing, onSave }: PersonalInfoProps) {
  const [formData, setFormData] = useState({
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: format(data.dateOfBirth, 'yyyy-MM-dd'),
    gender: data.gender,
    phone: data.phone,
    email: data.email,
    address: data.address
  })

  const [isLocalEditing, setIsLocalEditing] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onSave({
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: new Date(formData.dateOfBirth),
      gender: formData.gender as 'male' | 'female' | 'other',
      phone: formData.phone,
      email: formData.email,
      address: formData.address
    })
    setIsLocalEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: format(data.dateOfBirth, 'yyyy-MM-dd'),
      gender: data.gender,
      phone: data.phone,
      email: data.email,
      address: data.address
    })
    setIsLocalEditing(false)
  }

  const isCurrentlyEditing = isEditing || isLocalEditing

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Personal Information</span>
              </CardTitle>
              <CardDescription>
                Your basic personal details and contact information
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
          {/* Name and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              {isCurrentlyEditing ? (
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md">
                  <span className="font-medium">{data.firstName}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              {isCurrentlyEditing ? (
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md">
                  <span className="font-medium">{data.lastName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              {isCurrentlyEditing ? (
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md">
                  <span className="font-medium">{format(data.dateOfBirth, 'MMMM dd, yyyy')}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              {isCurrentlyEditing ? (
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 bg-gray-50 rounded-md">
                  <Badge variant="outline" className="capitalize">
                    {data.gender}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <span className="font-medium">{data.phone}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email Address</span>
                </Label>
                {isCurrentlyEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john.doe@example.com"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <span className="font-medium">{data.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Address</span>
              </Label>
              {isCurrentlyEditing ? (
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main Street, City, State, ZIP"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md">
                  <span className="font-medium">{data.address}</span>
                </div>
              )}
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
