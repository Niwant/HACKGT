'use client'

import { useUser } from '@clerk/nextjs'
import { MainLayout } from '@/components/layout/MainLayout'
import { PhysicianDashboard } from '@/components/dashboard/PhysicianDashboard'
import { PatientDashboard } from '@/components/dashboard/PatientDashboard'
import { RoleSelection } from '@/components/auth/RoleSelection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Please wait while we load your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please sign in to access your dashboard</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const userRole = user.unsafeMetadata?.role as 'physician' | 'patient'

  // If user doesn't have a role assigned, show role selection
  if (!userRole) {
    return <RoleSelection />
  }

  return (
    <MainLayout>
      {userRole === 'physician' ? <PhysicianDashboard /> : <PatientDashboard />}
    </MainLayout>
  )
}
