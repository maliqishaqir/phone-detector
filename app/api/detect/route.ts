import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { model: phoneModel } = await req.json()
  if (!phoneModel) return NextResponse.json({ error: 'No model provided' }, { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const prompt = `You are a strict telecom hardware expert. The user entered this device model: "${phoneModel}"

STEP 1 - DEVICE VALIDATION:
First determine if this is a telephone/phone device. It must be one of:
- A desk phone / IP phone / SIP phone
- A cordless phone / DECT phone
- An analog telephone adapter (ATA)
- A conference phone

If it is NOT a phone (e.g. printer, router, switch, laptop, camera, etc), respond with this exact JSON:
{
  "error": "not_a_phone",
  "message": "This does not appear to be a phone. Please enter a phone model number."
}

STEP 2 - CLASSIFICATION (only if it is a phone):
- VoIP (SIP/IP Phone): registers to SIP/VoIP server over ethernet or WiFi
- Analog Phone (PSTN): connects to PSTN/analogue line via RJ11, no IP capability
- Analog Telephone Adapter (ATA): converts analogue phones to VoIP, has FXS/FXO ports
- Hybrid (VoIP + Analog): connects to BOTH VoIP and PSTN line
- Unknown: cannot determine

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "model_name": "Full official model name",
  "manufacturer": "Brand name",
  "type": "VoIP (SIP/IP Phone) | Analog Phone (PSTN) | Analog Telephone Adapter (ATA) | Hybrid (VoIP + Analog) | Unknown",
  "line_type": "VoIP | PSTN | Both | Unknown",
  "protocol": "SIP, H.323, SCCP, MGCP, Analog POTS, ISDN, or N/A",
  "connectivity": "e.g. RJ45 ethernet, WiFi, RJ11 PSTN line, DECT",
  "compatible_systems": "e.g. Any SIP PBX, Cisco UCM, Microsoft Teams, Analogue line",
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
    if (info.error === 'not_a_phone') {
      return NextResponse.json({ error: info.message }, { status: 200 })
    }
    return NextResponse.json(info)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
EOFcat > ~/Downloads/phone-detector/app/api/detect/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { model: phoneModel } = await req.json()
  if (!phoneModel) return NextResponse.json({ error: 'No model provided' }, { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const prompt = `You are a strict telecom hardware expert. The user entered this device model: "${phoneModel}"

STEP 1 - DEVICE VALIDATION:
First determine if this is a telephone/phone device. It must be one of:
- A desk phone / IP phone / SIP phone
- A cordless phone / DECT phone
- An analog telephone adapter (ATA)
- A conference phone

If it is NOT a phone (e.g. printer, router, switch, laptop, camera, etc), respond with this exact JSON:
{
  "error": "not_a_phone",
  "message": "This does not appear to be a phone. Please enter a phone model number."
}

STEP 2 - CLASSIFICATION (only if it is a phone):
- VoIP (SIP/IP Phone): registers to SIP/VoIP server over ethernet or WiFi
- Analog Phone (PSTN): connects to PSTN/analogue line via RJ11, no IP capability
- Analog Telephone Adapter (ATA): converts analogue phones to VoIP, has FXS/FXO ports
- Hybrid (VoIP + Analog): connects to BOTH VoIP and PSTN line
- Unknown: cannot determine

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "model_name": "Full official model name",
  "manufacturer": "Brand name",
  "type": "VoIP (SIP/IP Phone) | Analog Phone (PSTN) | Analog Telephone Adapter (ATA) | Hybrid (VoIP + Analog) | Unknown",
  "line_type": "VoIP | PSTN | Both | Unknown",
  "protocol": "SIP, H.323, SCCP, MGCP, Analog POTS, ISDN, or N/A",
  "connectivity": "e.g. RJ45 ethernet, WiFi, RJ11 PSTN line, DECT",
  "compatible_systems": "e.g. Any SIP PBX, Cisco UCM, Microsoft Teams, Analogue line",
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
    if (info.error === 'not_a_phone') {
      return NextResponse.json({ error: info.message }, { status: 200 })
    }
    return NextResponse.json(info)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
