import { CoverageInfo } from '@/types'

const API_BASE_URL = 'http://localhost:8000/api'

export interface CoverageApiResponse {
  success: boolean
  data?: CoverageInfo
  error?: string
}

/**
 * Fetch coverage information for a patient and medication
 * @param patientId - The patient's unique identifier
 * @param rxcui - The RxCUI (RxNorm Concept Unique Identifier) for the medication
 * @returns Promise with coverage information
 */
export async function fetchCoverageInfo(
  patientId: string,
  rxcui: string
): Promise<CoverageApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/coverage?patientId=${encodeURIComponent(patientId)}&rxcui=${encodeURIComponent(rxcui)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      success: true,
      data: {
        patientId: data.patientId || patientId,
        rxcui: data.rxcui || rxcui,
        coverageStatus: data.coverageStatus || 'unknown',
        copay: data.copay,
        deductible: data.deductible,
        coveragePercentage: data.coveragePercentage,
        priorAuthRequired: data.priorAuthRequired,
        formularyTier: data.formularyTier,
        restrictions: data.restrictions || [],
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
      }
    }
  } catch (error) {
    console.error('Error fetching coverage info:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Check if a medication is covered by insurance
 * @param patientId - The patient's unique identifier
 * @param rxcui - The RxCUI for the medication
 * @returns Promise with boolean indicating if covered
 */
export async function isMedicationCovered(
  patientId: string,
  rxcui: string
): Promise<boolean> {
  const result = await fetchCoverageInfo(patientId, rxcui)
  return result.success && result.data?.coverageStatus === 'covered'
}

/**
 * Check if prior authorization is required for a medication
 * @param patientId - The patient's unique identifier
 * @param rxcui - The RxCUI for the medication
 * @returns Promise with boolean indicating if prior auth is required
 */
export async function isPriorAuthRequired(
  patientId: string,
  rxcui: string
): Promise<boolean> {
  const result = await fetchCoverageInfo(patientId, rxcui)
  return result.success && (result.data?.priorAuthRequired || result.data?.coverageStatus === 'prior_auth_required')
}

export interface EvidenceApiResponse {
  success: boolean
  data?: any
  error?: string
}

/**
 * Fetch evidence information for a patient and medication
 * @param patientId - The patient's unique identifier
 * @param rxcui - The RxCUI (RxNorm Concept Unique Identifier) for the medication
 * @returns Promise with evidence information
 */
export async function fetchEvidence(
  patientId: string,
  rxcui: string
): Promise<EvidenceApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/evidence/digest-rxcui`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patientId,
        rxcui
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Error fetching evidence:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}
