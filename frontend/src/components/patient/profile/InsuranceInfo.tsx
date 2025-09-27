'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  CreditCard, 
  Calendar,
  DollarSign,
  Edit,
  Save,
  X
} from 'lucide-react'
import { format } from 'date-fns'

interface InsuranceInfoProps {
  data: {
    insurance: {
      provider: string
      policyNumber: string
      groupNumber: string
      effectiveDate: Date
      expirationDate: Date
      copay: number
      deductible: number
      coverageType: 'primary' | 'secondary'
    }
  }
  isEditing: boolean
  onSave: (data: Partial<any>) => void
}

export function InsuranceInfo({ data, isEditing, onSave }: InsuranceInfoProps) {
  const [formData, setFormData] = useState({
    provider: data.insurance.provider,
    policyNumber: data.insurance.policyNumber,
    groupNumber: data.insurance.groupNumber,
    effectiveDate: format(data.insurance.effectiveDate, 'yyyy-MM-dd'),
    expirationDate: format(data.insurance.expirationDate, 'yyyy-MM-dd'),
    copay: data.insurance.copay,
    deductible: data.insurance.deductible,
    coverageType: data.insurance.coverageType
  })

  const [isLocalEditing, setIsLocalEditing] = useState(false)

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onSave({
      insurance: {
        provider: formData.provider,
        policyNumber: formData.policyNumber,
        groupNumber: formData.groupNumber,
        effectiveDate: new Date(formData.effectiveDate),
        expirationDate: new Date(formData.expirationDate),
        copay: formData.copay,
        deductible: formData.deductible,
        coverageType: formData.coverageType as 'primary' | 'secondary'
      }
    })
    setIsLocalEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      provider: data.insurance.provider,
      policyNumber: data.insurance.policyNumber,
      groupNumber: data.insurance.groupNumber,
      effectiveDate: format(data.insurance.effectiveDate, 'yyyy-MM-dd'),
      expirationDate: format(data.insurance.expirationDate, 'yyyy-MM-dd'),
      copay: data.insurance.copay,
      deductible: data.insurance.deductible,
      coverageType: data.insurance.coverageType
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
                <Shield className="w-5 h-5" />
                <span>Insurance Information</span>
              </CardTitle>
              <CardDescription>
                Your health insurance coverage details and benefits
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
          {/* Insurance Provider */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Provider Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="provider">Insurance Provider</Label>
                {isCurrentlyEditing ? (
                  <Input
                    id="provider"
                    value={formData.provider}
                    onChange={(e) => handleInputChange('provider', e.target.value)}
                    placeholder="e.g., Blue Cross Blue Shield"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <span className="font-medium">{data.insurance.provider}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverageType">Coverage Type</Label>
                {isCurrentlyEditing ? (
                  <Select
                    value={formData.coverageType}
                    onValueChange={(value) => handleInputChange('coverageType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <Badge variant="outline" className="capitalize">
                      {data.insurance.coverageType}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="policyNumber">Policy Number</Label>
                {isCurrentlyEditing ? (
                  <Input
                    id="policyNumber"
                    value={formData.policyNumber}
                    onChange={(e) => handleInputChange('policyNumber', e.target.value)}
                    placeholder="e.g., BC123456789"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <span className="font-medium font-mono">{data.insurance.policyNumber}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupNumber">Group Number</Label>
                {isCurrentlyEditing ? (
                  <Input
                    id="groupNumber"
                    value={formData.groupNumber}
                    onChange={(e) => handleInputChange('groupNumber', e.target.value)}
                    placeholder="e.g., GRP001"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <span className="font-medium font-mono">{data.insurance.groupNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coverage Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Coverage Period</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="effectiveDate" className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Effective Date</span>
                </Label>
                {isCurrentlyEditing ? (
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <span className="font-medium">
                      {format(data.insurance.effectiveDate, 'MMMM dd, yyyy')}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expirationDate" className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Expiration Date</span>
                </Label>
                {isCurrentlyEditing ? (
                  <Input
                    id="expirationDate"
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => handleInputChange('expirationDate', e.target.value)}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <span className="font-medium">
                      {format(data.insurance.expirationDate, 'MMMM dd, yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Financial Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="copay" className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Copay Amount</span>
                </Label>
                {isCurrentlyEditing ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="copay"
                      type="number"
                      value={formData.copay}
                      onChange={(e) => handleInputChange('copay', parseFloat(e.target.value) || 0)}
                      className="pl-8"
                      placeholder="25.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <span className="font-medium">${data.insurance.copay.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deductible" className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Annual Deductible</span>
                </Label>
                {isCurrentlyEditing ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="deductible"
                      type="number"
                      value={formData.deductible}
                      onChange={(e) => handleInputChange('deductible', parseFloat(e.target.value) || 0)}
                      className="pl-8"
                      placeholder="1000.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <span className="font-medium">${data.insurance.deductible.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coverage Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Coverage Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Provider:</span>
                <p className="text-blue-800">{data.insurance.provider}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Copay:</span>
                <p className="text-blue-800">${data.insurance.copay.toFixed(2)} per visit</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Deductible:</span>
                <p className="text-blue-800">${data.insurance.deductible.toFixed(2)} annually</p>
              </div>
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
