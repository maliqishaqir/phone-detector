import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { model: phoneModel } = await req.json()
  if (!phoneModel) return NextResponse.json({ error: 'No model provided' }, { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const prompt = `Device model: "${phoneModel}"

Is this a phone? If NOT a phone (printer, router, laptop, camera, etc), return exactly:
{"error":"not_a_phone","message":"This is not a phone or telephony device."}

If it IS a phone or telephony device, return exactly this JSON structure:
{
  "model_name": "string",
  "manufacturer": "string",
  "type": "VoIP (SIP/IP Phone) or Analog Phone (PSTN) or Analog Telephone Adapter (ATA) or Hybrid (VoIP + Analog) or Unknown",
  "line_type": "VoIP or PSTN or Both or Unknown",
  "protocol": "string",
  "connectivity": "string",
  "compatible_systems": "string",
  "key_features": ["string", "string", "string"],
  "typical_use": "string",
  "action_url_support": "Yes or No or Unknown",
  "webhook_support": "Yes or No or Unknown",
  "supported_events": "e.g. Call Start, Call End, Incoming Call, Registration, DND — or N/A if not supported",
  "integration_notes": "Brief note on how Action URLs or webhooks are configured on this phone, or empty string",
  "confidence": "High or Medium or Low",
  "notes": "string"
}

Classification rules:
- VoIP = ethernet/WiFi + SIP/H.323/SCCP/MGCP, no PSTN line port
- Analog PSTN = RJ11 PSTN line port, no IP capability
- ATA = FXS/FXO ports, bridges analog to VoIP
- Hybrid = both ethernet AND RJ11 PSTN port
- DECT/WiFi cordless with SIP = VoIP not Hybrid

Action URL / Webhook rules:
- Most Yealink, Grandstream, Polycom VVX, Cisco SPA series support Action URLs
- Cisco 79xx/89xx/99xx (SCCP/SIP) support XML services and notifications
- Avaya supports event notifications via PUSH/HTTP
- Analog phones (PSTN) do NOT support Action URLs or webhooks
- If unsure, set to Unknown

Return ONLY the JSON object, no markdown, no backticks, no explanation.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: 'You are a telecom hardware expert. You respond ONLY with a single raw JSON object. No markdown. No backticks. No explanation. Just the JSON.',
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: res.status })
  }

  const data = await res.json()
  const raw = data.content
    .map((i: { text?: string }) => i.text || '')
    .join('')
    .replace(/```json|```/g, '')
    .trim()

  try {
    const info = JSON.parse(raw)
    if (info.error === 'not_a_phone') {
      return NextResponse.json({ error: info.message }, { status: 200 })
    }
    return NextResponse.json(info)
  } catch {
    return NextResponse.json({ error: 'Failed to parse response. Please try again.' }, { status: 200 })
  }
}