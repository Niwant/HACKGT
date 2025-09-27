'use client'

import React, { useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Stethoscope, Heart, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function RoleSelection() {
  const { user } = useUser()
  const { user: clerkUser } = useClerk()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'physician' | 'patient' | null>(null)

  const handleRoleSelection = async (role: 'physician' | 'patient') => {
    if (!clerkUser) return

    setIsLoading(true)
    setSelectedRole(role)

    try {
      // Update user metadata with the selected role using the correct API
      await clerkUser.update({
        unsafeMetadata: {
          role: role
        }
      })

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error updating user role:', error)
      setIsLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Choose Your Role</CardTitle>
          <CardDescription>
            Please select your role to continue to your personalized dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Physician Option */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedRole === 'physician' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => !isLoading && handleRoleSelection('physician')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Stethoscope className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Physician</CardTitle>
                <CardDescription>
                  Manage patients, prescriptions, and medical records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Patient management and EMR</li>
                  <li>• Prescription workflow</li>
                  <li>• Drug research updates</li>
                  <li>• AI-powered summaries</li>
                </ul>
              </CardContent>
            </Card>

            {/* Patient Option */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedRole === 'patient' ? 'ring-2 ring-green-500 bg-green-50' : ''
              }`}
              onClick={() => !isLoading && handleRoleSelection('patient')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Patient</CardTitle>
                <CardDescription>
                  Track your health journey and manage care
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Medication management</li>
                  <li>• Recovery timeline</li>
                  <li>• Daily health checklist</li>
                  <li>• Appointment tracking</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {isLoading && (
            <div className="mt-6 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Setting up your dashboard...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
