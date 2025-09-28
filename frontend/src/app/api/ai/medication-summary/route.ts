import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientName, medications, prescriptions, emrRecords } = body

    if (!patientName || !medications || !prescriptions || !emrRecords) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is available
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Prepare the prompt for OpenAI
    const prompt = createMedicationSummaryPrompt(patientName, medications, prescriptions, emrRecords)

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a compassionate, encouraging healthcare AI assistant. Your role is to provide positive, motivating summaries of patients\' medications that help them understand how their medications are supporting their health journey. Always be encouraging, clear, and supportive.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const summary = data.choices[0]?.message?.content || 'Unable to generate summary'

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Error generating medication summary:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function createMedicationSummaryPrompt(
  patientName: string,
  medications: any[],
  prescriptions: any[],
  emrRecords: any[]
) {
  return `
Please create an encouraging, personalized medication summary for ${patientName}. Here's their health information:

CURRENT MEDICATIONS:
${medications.map(med => `
- ${med.name} (${med.genericName})
  - Dosage: ${med.dosage}
  - Frequency: ${med.frequency}
  - Instructions: ${med.instructions}
  - Side Effects: ${med.sideEffects?.join(', ') || 'None listed'}
`).join('')}

PRESCRIPTIONS:
${prescriptions.map(pres => `
- Diagnosis: ${pres.diagnosis} (${pres.icdCode})
  - Medications: ${pres.medications.map(med => `${med.name} ${med.dosage} - ${med.frequency}`).join(', ')}
`).join('')}

RECENT HEALTH RECORDS:
${emrRecords.slice(0, 5).map(record => `
- ${record.type.toUpperCase()}: ${record.title}
  - ${record.content}
  - ${record.value ? `Value: ${record.value} ${record.unit || ''}` : ''}
  - Date: ${new Date(record.date).toLocaleDateString()}
`).join('')}

Please provide a warm, encouraging summary that:
1. Explains how each medication is helping their health
2. Provides clear, simple instructions on when and how to take each medication make it 2-3 lines max for each medication use the medication name and instructions.
3. Highlights the positive progress they're making
4. Offers encouragement and motivation
5. Uses a friendly, supportive tone
6. Keeps it concise but comprehensive 
7. Format it well , hightlight the data and make it look good.

Sample response:

**John Doe's Medication Summary:**

**1. Lisinopril (Blood Pressure):**
- Take 1 tablet daily in the morning.
- Helps control blood pressure and protect heart health.
- Keep up the great work managing your blood pressure, John!

**2. Metformin (Diabetes):**
- Take 1 tablet with breakfast and 1 tablet with dinner.
- Supports in managing blood sugar levels effectively.
- Your dedication to managing your diabetes is truly admirable, John!

**3. Simvastatin (Cholesterol):**
- Take 1 tablet at bedtime.
- Works to lower cholesterol levels and reduce heart disease risk.
- Your commitment to your heart health is inspiring, John!

Keep up the excellent effort with your medications, John! Your proactive approach to your health is truly paying off. Remember, I'm here to support you every step of the way! 🌟👏
`
}
