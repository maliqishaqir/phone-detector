# IP Phone Detector

Detect whether a phone model is VoIP, Analog, or an ATA — powered by Claude AI. Builds a persistent local knowledge base as you look up phones.

## Deploy to Vercel (5 minutes)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/phone-detector.git
git push -u origin main
```

### 2. Import to Vercel
1. Go to [vercel.com](https://vercel.com) and click **Add New Project**
2. Import your GitHub repo
3. In **Environment Variables**, add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com))
4. Click **Deploy**

That's it — Vercel will build and deploy automatically.

## Local development

```bash
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How it works

- Enter any IP phone model number
- The app checks your **saved database first** (localStorage) — instant result
- If not found, **Claude AI identifies** the phone type, protocol, and specs
- Save results to build your own knowledge base over time
- The AI API call is made server-side (your API key is never exposed to the browser)
