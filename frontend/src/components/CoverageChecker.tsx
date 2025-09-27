'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, CheckCircle, AlertTriangle, Clock, DollarSign } from 'lucide-react'
import { fetchCoverageInfo } from '@/lib/api'
import { CoverageInfo } from '@/types'

export function CoverageChecker() {
  const [patientId, setPatientId] = useState('015786ad-e05e-2812-b3e8-11713aa05988')
  const [rxcui, setRxcui] = useState('1551300')
  const [coverage, setCoverage] = useState<CoverageInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckCoverage = async () => {
    if (!patientId || !rxcui) {
      setError('Please enter both Patient ID and RxCUI')
      return
    }

    setLoading(true)
    setError(null)
    setCoverage(null)

    try {
      const result = await fetchCoverageInfo(patientId, rxcui)
      if (result.success && result.data) {
        setCoverage(result.data)
      } else {
        setError(result.error || 'Failed to fetch coverage information')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getCoverageStatusBadge = (status: string) => {
    switch (status) {
      case 'covered':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Covered</Badge>
      case 'not_covered':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Not Covered</Badge>
      case 'prior_auth_required':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Shield className="w-3 h-3 mr-1" />Prior Auth Required</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Insurance Coverage Checker
        </CardTitle>
        <CardDescription>
          Check insurance coverage for medications using Patient ID and RxCUI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="patientId">Patient ID</Label>
            <Input
              id="patientId"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="Enter Patient ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rxcui">RxCUI</Label>
            <Input
              id="rxcui"
              value={rxcui}
              onChange={(e) => setRxcui(e.target.value)}
              placeholder="Enter RxCUI"
            />
          </div>
        </div>

        <Button 
          onClick={handleCheckCoverage} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Checking Coverage...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Check Coverage
            </>
          )}
        </Button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {coverage && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-blue-900">Coverage Information</h3>
              {getCoverageStatusBadge(coverage.coverageStatus)}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800">Patient ID:</span>
                <p className="text-blue-700">{coverage.patientId}</p>
              </div>
              <div>
                <span className="font-medium text-blue-800">RxCUI:</span>
                <p className="text-blue-700">{coverage.rxcui}</p>
              </div>
            </div>

            {coverage.copay && (
              <div className="flex items-center text-blue-800">
                <DollarSign className="w-4 h-4 mr-2" />
                <span className="font-medium">Copay:</span>
                <span className="ml-2">${coverage.copay}</span>
              </div>
            )}

            {coverage.coveragePercentage && (
              <div className="text-blue-800">
                <span className="font-medium">Coverage Percentage:</span>
                <span className="ml-2">{coverage.coveragePercentage}%</span>
              </div>
            )}

            {coverage.formularyTier && (
              <div className="text-blue-800">
                <span className="font-medium">Formulary Tier:</span>
                <span className="ml-2">{coverage.formularyTier}</span>
              </div>
            )}

            {coverage.restrictions && coverage.restrictions.length > 0 && (
              <div className="text-blue-800">
                <span className="font-medium">Restrictions:</span>
                <p className="text-blue-700 mt-1">{coverage.restrictions.join(', ')}</p>
              </div>
            )}

            {coverage.priorAuthRequired && (
              <div className="p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800">
                <span className="font-medium">⚠️ Prior Authorization Required</span>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Example RxCUIs:</strong></p>
          <p>• Metformin: 1551300</p>
          <p>• Lisinopril: 314076</p>
          <p>• Loratadine: 313406</p>
        </div>
      </CardContent>
    </Card>
  )
}
