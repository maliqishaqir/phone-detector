import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { model: phoneModel } = await req.json()
  if (!phoneModel) return NextResponse.json({ error: 'No model provided' }, { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const prompt = `You are a strict telecom hardware expert. The user entered this phone model: "${phoneModel}"

Based on your knowledge of this device's full technical specifications, determine how it connects to the telephone network:

NETWORK CONNECTION ANALYSIS (most important factor):
- Does this phone connect to a VoIP/IP network? (SIP server, IP PBX, hosted PBX, Microsoft Teams, Cisco UCM, 3CX, FreePBX, Avaya Aura, etc.)
- Does this phone connect to a PSTN network? (traditional copper line, analogue line, ISDN BRI/PRI, ADSL line, exchange line)
- Does it support both?

CLASSIFICATION:
- VoIP (SIP/IP Phone): registers to a SIP/VoIP server over IP network (ethernet or WiFi). Uses SIP, H.323, SCCP, MGCP protocol.
- Analog Phone (PSTN): connects directly to a PSTN/analogue line (copper pair). Has RJ11 line port. No IP capability.
- Analog Telephone Adapter (ATA): converts analogue phones to work on VoIP networks. Has FXS/FXO ports.
- Hybrid (VoIP + Analog): can connect to BOTH a VoIP/SIP server AND a PSTN/analogue line simultaneously.
- Unknown: genuinely cannot determine.

CONNECTOR GUIDANCE:
- RJ45 only = VoIP
- RJ11 PSTN line port only = Analog/PSTN
- RJ45 + RJ11 PSTN = Hybrid
- WiFi/DECT with SIP = VoIP
- RJ11 handset port (curly cord) does NOT make a phone analog

Respond ONLY with a valid JSON object, no markdown, no backticks:
{
  "model_name": "Full official model name",
  "manufacturer": "Brand name",
  "type": "VoIP (SIP/IP Phone) | Analog Phone (PSTN) | Analog Telephone Adapter (ATA) | Hybrid (VoIP + Analog) | Unknown",
  "line_type": "VoIP | PSTN | Both | Unknown",
  "protocol": "e.g. SIP, H.323, SCCP, MGCP, Analog POTS, ISDN, or N/A",
  "connectivity": "e.g. RJ45 ethernet, WiFi, RJ11 PSTN line, DECT",
  "compatible_systems": "e.g. Any SIP PBX, Cisco UCM, Microsoft Teams, Analogue line, ISDN",
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
