'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Heart, 
  Shield, 
  FileText, 
  AlertTriangle, 
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit,
  Save,
  X
} from 'lucide-react'
import { PersonalInfo } from './profile/PersonalInfo'
import { HealthInfo } from './profile/HealthInfo'
import { InsuranceInfo } from './profile/InsuranceInfo'
import { EmergencyContact } from './profile/EmergencyContact'
import { MedicalHistory } from './profile/MedicalHistory'

interface PatientData {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: 'male' | 'female' | 'other'
  phone: string
  email: string
  address: string
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
  medicalHistory: string[]
  allergies: string[]
  currentConditions: string[]
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
  physician: {
    name: string
    specialty: string
    phone: string
    email: string
  }
}

export function PatientProfile() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState('personal')
  const [isEditing, setIsEditing] = useState(false)
  const [patientData, setPatientData] = useState<PatientData | null>(null)

  // Load mock data from centralized source
  useEffect(() => {
    const loadPatientData = async () => {
      const { fetchPatientData } = await import('@/lib/mockData')
      const data = await fetchPatientData('1')
      
      if (data) {
        // Update email with user's email if available
        const patientData: PatientData = {
          ...data,
          email: user?.emailAddresses[0]?.emailAddress || data.email
        }
        setPatientData(patientData)
      }
    }
    
    loadPatientData()
  }, [user])

  const handleSave = (updatedData: Partial<PatientData>) => {
    if (patientData) {
      setPatientData({ ...patientData, ...updatedData })
      setIsEditing(false)
      // In a real app, this would save to the backend
      console.log('Saving patient data:', updatedData)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    // In a real app, this would revert to the last saved state
  }

  if (!patientData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">
            Manage your personal information, health data, and insurance details
          </p>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button onClick={handleCancel} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={() => setIsEditing(false)}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Age</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Date().getFullYear() - patientData.dateOfBirth.getFullYear()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Conditions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patientData.currentConditions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Allergies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patientData.allergies.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Insurance</p>
                <p className="text-lg font-bold text-gray-900">
                  {patientData.insurance.provider}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="health">Health Info</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="emergency">Emergency Contact</TabsTrigger>
          <TabsTrigger value="history">Medical History</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <PersonalInfo
            data={patientData}
            isEditing={isEditing}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <HealthInfo
            data={patientData}
            isEditing={isEditing}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="insurance" className="space-y-4">
          <InsuranceInfo
            data={patientData}
            isEditing={isEditing}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4">
          <EmergencyContact
            data={patientData}
            isEditing={isEditing}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <MedicalHistory
            data={patientData}
            isEditing={isEditing}
            onSave={handleSave}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
