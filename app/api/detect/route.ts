import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { model: phoneModel } = await req.json()
  if (!phoneModel) return NextResponse.json({ error: 'No model provided' }, { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const prompt = `You are a strict telecom hardware expert with deep knowledge of phone hardware specifications. The user entered this phone model: "${phoneModel}"

Research this exact model and apply these classification rules strictly:

CONNECTOR RULES (highest priority):
- If the phone has an RJ9, RJ10, or RJ11 port as its PRIMARY line connection → it is an Analog Phone, period.
- RJ9/RJ10 = handset connector only (not a line port), common on desk phones
- RJ11 = analog PSTN line port → confirms Analog Phone
- RJ45 only = VoIP phone (ethernet)
- RJ45 + RJ11 PSTN port = Hybrid

CLASSIFICATION RULES:
- VoIP (SIP/IP Phone): connects via ethernet (RJ45) or WiFi only, uses SIP/H.323/SCCP/MGCP, no analog PSTN line port
- Analog Phone: has RJ11 PSTN line port, connects to traditional phone line, no SIP/ethernet capability
- Analog Telephone Adapter (ATA): a converter device with FXS/FXO ports that bridges analog phones to VoIP networks
- Hybrid (VoIP + Analog): has BOTH RJ45 ethernet AND RJ11 PSTN line port
- WiFi phone / DECT cordless VoIP = VoIP, NOT hybrid
- DSL/ADSL phone with RJ11 = Analog Phone

Respond ONLY with a valid JSON object, no markdown, no backticks, no extra text:
{
  "model_name": "Full official model name",
  "manufacturer": "Brand name",
  "type": "VoIP (SIP/IP Phone) | Analog Phone | Analog Telephone Adapter (ATA) | Hybrid (VoIP + Analog) | Unknown",
  "protocol": "e.g. SIP, H.323, SCCP, MGCP, Analog POTS, or N/A",
  "connectivity": "e.g. RJ45 ethernet, WiFi, RJ11 PSTN, DECT",
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
      model: 'claude-haiku-4-5-20251001',
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
