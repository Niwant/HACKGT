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
            CuraRx
          </h1>
          <p className="text-2xl text-gray-700 mb-4">
            Care, made clear
          </p>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Healthcare is drowning in noise. We bridge the gap by engaging providers and patients with the right information at the right time. When physicians prescribe smarter and faster, insurance processes get easier, and patients walk away with clarity, confidence, and actionable next steps.
          </p>
        </div>

        {/* Main Platform Card */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Stethoscope className="w-10 h-10 text-blue-600" />
              </div>
              <CardTitle className="text-3xl mb-4">Smart Prescription & Patient Care Platform</CardTitle>
              <CardDescription className="text-lg">
                Automatically checking insurance coverage, providing drug alternatives, and delivering plain-language summaries to patients
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
                      <span className="text-gray-700"><strong>Automatic Insurance Coverage Check:</strong> Real-time formulary tier verification and coverage analysis</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span className="text-gray-700"><strong>AI-Powered Prior Authorization:</strong> Automatically fills out PA forms to reduce tedious paperwork</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span className="text-gray-700"><strong>Smart Drug Alternatives:</strong> Compare constituents using CMS and RxNorm data when coverage isn't available</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span className="text-gray-700"><strong>Faster Prescription Workflow:</strong> Streamlined process from prescription to patient delivery</span>
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
                      <span className="text-gray-700"><strong>Plain Language Summaries:</strong> No medical jargon - clear explanations of what's happening and why</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span className="text-gray-700"><strong>Drug Explainer:</strong> Answers "why this drug, how to take it, how frequently" in simple terms</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span className="text-gray-700"><strong>Lifestyle Recommendations:</strong> Simple dietary and habit suggestions to support recovery</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span className="text-gray-700"><strong>Clarity & Confidence:</strong> Walk away with clear understanding and actionable next steps</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="pt-6 border-t">
                <Link href="/sign-up">
                  <Button className="w-full h-14 text-lg" size="lg">
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
            Why Choose CuraRx?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered Prior Authorization</h3>
              <p className="text-gray-600">
                Automatically fills out PA forms using AI to reduce tedious work and speed up the prescription process.
              </p>
            </Card>
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Insurance Coverage Intelligence</h3>
              <p className="text-gray-600">
                Automatically checks insurance coverage and formulary tiers, showing which drugs are readily available and affordable.
              </p>
            </Card>
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Plain Language Communication</h3>
              <p className="text-gray-600">
                Patients get clear, jargon-free explanations of their medications and treatment plans with actionable next steps.
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
              <h3 className="text-xl font-semibold mb-3">Physician Prescribes</h3>
              <p className="text-gray-600">
                When a physician creates a prescription, the system automatically checks insurance coverage and formulary tiers.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Processes & Fills PA</h3>
              <p className="text-gray-600">
                If prior authorization is needed, AI automatically fills out the PA form and suggests smart drug alternatives.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Patient Gets Clarity</h3>
              <p className="text-gray-600">
                Patients receive plain-language summaries explaining their medication, how to take it, and lifestyle recommendations.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Make Care Clear?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join healthcare providers and patients who are already using CuraRx to bridge the gap between complex medical information and clear, actionable care.
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
