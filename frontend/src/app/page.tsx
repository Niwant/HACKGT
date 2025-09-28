'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Stethoscope, Heart, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && user) {
      router.push('/dashboard')
    }
  }, [isLoaded, user, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Please wait while we load the application</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            RXHealth
          </h1>
          <p className="text-2xl text-gray-700 mb-4">
            The Future of Healthcare Management
          </p>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            A comprehensive, AI-powered platform that connects physicians and patients through intelligent care management, real-time drug research, and personalized health tracking.
          </p>
        </div>

        {/* Main Platform Card */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Stethoscope className="w-10 h-10 text-blue-600" />
              </div>
              <CardTitle className="text-3xl mb-4">Unified Healthcare Platform</CardTitle>
              <CardDescription className="text-lg">
                Seamlessly connecting healthcare providers and patients through intelligent technology
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-xl mb-4 text-blue-600 flex items-center">
                    <Stethoscope className="w-6 h-6 mr-2" />
                    For Healthcare Providers
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span className="text-gray-700"><strong>Smart Patient Management:</strong> Comprehensive EMR integration with AI-powered patient summaries</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span className="text-gray-700"><strong>Intelligent Prescription Workflow:</strong> Multi-step safety checks, drug interactions, and cost optimization</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span className="text-gray-700"><strong>Real-time Research Updates:</strong> Latest FDA approvals, clinical trials, and pharmaceutical bulletins</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span className="text-gray-700"><strong>Advanced Analytics:</strong> Patient insights, treatment outcomes, and predictive health modeling</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-xl mb-4 text-green-600 flex items-center">
                    <Heart className="w-6 h-6 mr-2" />
                    For Patients
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span className="text-gray-700"><strong>Personalized Health Dashboard:</strong> Track medications, appointments, and health milestones</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span className="text-gray-700"><strong>Recovery Companion:</strong> Interactive timeline, daily checklists, and progress tracking</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span className="text-gray-700"><strong>Cost Transparency:</strong> Medication pricing, insurance coverage, and affordable alternatives</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span className="text-gray-700"><strong>Health Education:</strong> Plain-language explanations, side effect guides, and lifestyle tips</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="pt-6 border-t">
                <Link href="/sign-up">
                  <Button className="w-full" size="lg" className="h-14 text-lg">
                    Start Your Healthcare Journey
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Features Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose RXHealth?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered Intelligence</h3>
              <p className="text-gray-600">
                Advanced AI algorithms provide patient summaries, drug interaction alerts, and personalized treatment recommendations.
              </p>
            </Card>
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-time Updates</h3>
              <p className="text-gray-600">
                Stay current with the latest medical research, FDA approvals, and pharmaceutical developments as they happen.
              </p>
            </Card>
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Seamless Integration</h3>
              <p className="text-gray-600">
                Connect with existing EMR systems and healthcare workflows for a smooth, integrated experience.
              </p>
            </Card>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Sign Up & Choose Role</h3>
              <p className="text-gray-600">
                Create your account and select whether you're a healthcare provider or patient.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Access Your Dashboard</h3>
              <p className="text-gray-600">
                Get your personalized dashboard with role-specific features and tools.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Start Managing Care</h3>
              <p className="text-gray-600">
                Begin managing patients, prescriptions, or tracking your health journey.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Healthcare?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of healthcare professionals and patients who are already using RXHealth to improve care delivery and health outcomes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="h-12 px-8">
                Get Started Free
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" size="lg" className="h-12 px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
