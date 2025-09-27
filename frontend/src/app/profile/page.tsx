'use client'

import React from 'react'
import { useUser } from '@clerk/nextjs'
import { MainLayout } from '@/components/layout/MainLayout'
import { PatientProfile } from '@/components/patient/PatientProfile'

export default function ProfilePage() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    )
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
            <p className="text-gray-600">You need to be signed in to view your profile.</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  const userRole = user.unsafeMetadata?.role as 'physician' | 'patient'

  if (userRole !== 'patient') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">This page is only available for patients.</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <PatientProfile />
    </MainLayout>
  )
}
