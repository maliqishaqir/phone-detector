import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { model: phoneModel } = await req.json()
  if (!phoneModel) return NextResponse.json({ error: 'No model provided' }, { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const prompt = `You are a telecom hardware expert. The user entered this phone model: "${phoneModel}"
Respond ONLY with a valid JSON object, no markdown, no backticks, no extra text:
{
  "model_name": "Full official model name",
  "manufacturer": "Brand name",
  "type": "VoIP (SIP/IP Phone) | Analog Phone | Analog Telephone Adapter (ATA) | Hybrid (VoIP + Analog) | Unknown",
  "protocol": "e.g. SIP, H.323, SCCP, MGCP, Analog POTS, or N/A",
  "key_features": ["feature 1", "feature 2", "feature 3"],
  "typical_use": "One sentence description",
  "confidence": "High | Medium | Low",
  "notes": "Any clarification or empty string"
}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: res.status })
  }

  const data = await res.json()
  const raw = data.content.map((i: { text?: string }) => i.text || '').join('').replace(/```json|```/g, '').trim()

  try {
    const info = JSON.parse(raw)
    return NextResponse.json(info)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
