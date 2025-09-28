'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, Shield } from 'lucide-react'
import { Medication, EMR, Prescription } from '@/types'

interface MedicationSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  medications: Medication[]
  prescriptions: Prescription[]
  emrRecords: EMR[]
  patientName: string
}

export function MedicationSummaryModal({ 
  isOpen, 
  onClose, 
  medications, 
  prescriptions, 
  emrRecords, 
  patientName 
}: MedicationSummaryModalProps) {
  const [summary, setSummary] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // Auto-generate summary when modal opens
  React.useEffect(() => {
    if (isOpen && !summary && !isLoading && !error) {
      generateSummary()
    }
  }, [isOpen])

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSummary('')
      setError('')
      setIsLoading(false)
    }
  }, [isOpen])

  const generateSummary = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // Prepare the data for OpenAI
      const patientData = {
        patientName,
        medications: medications.map(med => ({
          name: med.name,
          genericName: med.genericName,
          dosage: med.dosage,
          frequency: med.frequency,
          instructions: med.instructions,
          sideEffects: med.sideEffects,
          drugInteractions: med.drugInteractions
        })),
        prescriptions: prescriptions.map(pres => ({
          diagnosis: pres.diagnosis,
          icdCode: pres.icdCode,
          medications: pres.medications.map(med => ({
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            instructions: med.instructions
          }))
        })),
        emrRecords: emrRecords.map(record => ({
          type: record.type,
          title: record.title,
          content: record.content,
          value: record.value,
          unit: record.unit,
          date: record.date
        }))
      }

      const response = await fetch('/api/ai/medication-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData)
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const data = await response.json()
      setSummary(data.summary)
    } catch (error) {
      console.error('Error generating summary:', error)
      setError('Failed to generate medication summary. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            <span>Your Personalized Medication Summary</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* AI Summary Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <span>Your Health Journey</span>
              </CardTitle>
              <CardDescription>
                AI-powered insights about how your medications are supporting your wellness
              </CardDescription>
            </CardHeader>
            <CardContent>

              {isLoading && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
                  <p className="text-gray-600">AI is analyzing your health data and creating a personalized summary...</p>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-4">
                    <Shield className="w-12 h-12 mx-auto mb-2" />
                    <p>{error}</p>
                  </div>
                  <Button onClick={generateSummary} variant="outline">
                    Try Again
                  </Button>
                </div>
              )}

              {summary && (
                <div className="prose prose-sm max-w-none">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {summary}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {summary && (
            <Button onClick={generateSummary} variant="outline">
              <Sparkles className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
