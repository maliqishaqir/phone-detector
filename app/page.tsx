'use client'
import { useState, useEffect, useCallback } from 'react'
import styles from './page.module.css'

interface PhoneInfo {
  model_name: string
  manufacturer: string
  type: string
  protocol: string
  key_features: string[]
  typical_use: string
  confidence: string
  notes: string
  _saved_at?: string | null
}

type DB = Record<string, PhoneInfo>

const DB_KEY = 'phone_db_v1'

function loadDB(): DB {
  try { return JSON.parse(localStorage.getItem(DB_KEY) || '{}') } catch { return {} }
}
function saveDB(db: DB) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)) } catch {}
}
function normalizeKey(m: string) {
  return m.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function getBadgeStyle(type: string): { bg: string; color: string } {
  const t = type.toLowerCase()
  if (t.includes('ata') || t.includes('adapter')) return { bg: 'var(--purple-bg)', color: 'var(--purple-text)' }
  if (t.includes('voip') || t.includes('sip') || t.includes('ip phone')) return { bg: 'var(--blue-bg)', color: 'var(--blue-text)' }
  if (t.includes('analog')) return { bg: 'var(--amber-bg)', color: 'var(--amber-text)' }
  if (t.includes('hybrid')) return { bg: 'var(--teal-bg)', color: 'var(--teal-text)' }
  return { bg: 'var(--gray-bg)', color: 'var(--gray-text)' }
}

const EXAMPLES = ['Cisco 7942G', 'Grandstream HT814', 'Yealink T46U', 'Avaya 9641G', 'Polycom VVX 500', 'Panasonic KX-UT123']

export default function Home() {
  const [tab, setTab] = useState<'lookup' | 'database'>('lookup')
  const [model, setModel] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ info: PhoneInfo; source: 'ai' | 'db'; key: string } | null>(null)
  const [error, setError] = useState('')
  const [db, setDB] = useState<DB>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => { setDB(loadDB()) }, [])

  const detect = useCallback(async () => {
    const trimmed = model.trim()
    if (!trimmed) return
    setLoading(true)
    setResult(null)
    setError('')
    setSaved(false)

    const key = normalizeKey(trimmed)
    const currentDB = loadDB()

    if (currentDB[key]) {
      setResult({ info: currentDB[key], source: 'db', key })
      setSaved(true)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: trimmed }),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const info: PhoneInfo = await res.json()
      if (info.error) throw new Error(info.error)
      info._saved_at = null
      setResult({ info, source: 'ai', key })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [model])

  const handleSave = () => {
    if (!result) return
    const currentDB = loadDB()
    const info = { ...result.info, _saved_at: new Date().toISOString() }
    currentDB[result.key] = info
    saveDB(currentDB)
    setDB({ ...currentDB })
    setResult({ ...result, info })
    setSaved(true)
  }

  const handleDelete = (key: string) => {
    const currentDB = loadDB()
    delete currentDB[key]
    saveDB(currentDB)
    setDB({ ...currentDB })
  }

  const handleClear = () => {
    if (!confirm('Clear all saved phones from the database?')) return
    saveDB({})
    setDB({})
  }

  const dbEntries = Object.entries(db)
  const dbCount = dbEntries.length

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>IP Phone Detector</h1>
          <p className={styles.subtitle}>Identify whether a phone model is VoIP, Analog, or ATA — and build your own knowledge base.</p>
        </div>

        <div className={styles.card}>
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${tab === 'lookup' ? styles.tabActive : ''}`} onClick={() => setTab('lookup')}>
              Lookup
            </button>
            <button className={`${styles.tab} ${tab === 'database' ? styles.tabActive : ''}`} onClick={() => setTab('database')}>
              Saved database
              <span className={styles.badge} style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{dbCount}</span>
            </button>
          </div>

          {tab === 'lookup' && (
            <div className={styles.tabContent}>
              <div className={styles.inputRow}>
                <input
                  type="text"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && detect()}
                  placeholder="e.g. Cisco 7960, Polycom VVX 411, Yealink T46U…"
                />
                <button onClick={detect} disabled={loading || !model.trim()} style={{ whiteSpace: 'nowrap' }}>
                  {loading ? 'Detecting…' : 'Detect'}
                </button>
              </div>

              <div className={styles.examples}>
                <span className={styles.examplesLabel}>Try:</span>
                {EXAMPLES.map(ex => (
                  <button key={ex} className={styles.chip} onClick={() => setModel(ex)}>{ex}</button>
                ))}
              </div>

              {error && (
                <div className={styles.errorBox}>{error}</div>
              )}

              {result && (
                <ResultCard
                  info={result.info}
                  source={result.source}
                  saved={saved}
                  onSave={handleSave}
                />
              )}
            </div>
          )}

          {tab === 'database' && (
            <div className={styles.tabContent}>
              <div className={styles.dbHeader}>
                <span className={styles.dbSummary}>
                  {dbCount === 0 ? 'No phones saved yet.' : `${dbCount} phone${dbCount > 1 ? 's' : ''} saved`}
                </span>
                {dbCount > 0 && (
                  <button onClick={handleClear} style={{ fontSize: 12, padding: '4px 10px', height: 'auto', color: '#a32d2d', borderColor: '#f09595' }}>
                    Clear all
                  </button>
                )}
              </div>

              {dbCount === 0 ? (
                <p className={styles.emptyState}>Database is empty. Detect phones and save them to build your knowledge base.</p>
              ) : (
                <div className={styles.dbList}>
                  {dbEntries.map(([key, info]) => {
                    const bs = getBadgeStyle(info.type)
                    return (
                      <div key={key} className={styles.dbRow}>
                        <span className={styles.dbModel}>{info.model_name}</span>
                        <span className={styles.dbMfr}>{info.manufacturer}</span>
                        <span className={styles.badge} style={{ background: bs.bg, color: bs.color, fontSize: 11 }}>{info.type}</span>
                        {info._saved_at && (
                          <span className={styles.dbDate}>{new Date(info._saved_at).toLocaleDateString()}</span>
                        )}
                        <button
                          onClick={() => handleDelete(key)}
                          style={{ border: 'none', background: 'transparent', color: 'var(--text-tertiary)', padding: '0 4px', height: 'auto', fontSize: 18 }}
                          title="Remove"
                        >×</button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultCard({ info, source, saved, onSave }: {
  info: PhoneInfo
  source: 'ai' | 'db'
  saved: boolean
  onSave: () => void
}) {
  const bs = getBadgeStyle(info.type)
  return (
    <div className={styles.resultCard}>
      <div className={styles.resultHeader}>
        <div>
          <div className={styles.resultTitleRow}>
            <h2 className={styles.resultModel}>{info.model_name}</h2>
            <span className={styles.badge} style={{ background: bs.bg, color: bs.color }}>{info.type}</span>
          </div>
          <div className={styles.sourceTags}>
            <span className={styles.sourceTag} style={source === 'db'
              ? { background: 'var(--teal-bg)', color: 'var(--teal-text)' }
              : { background: 'var(--blue-bg)', color: 'var(--blue-text)' }
            }>
              {source === 'db' ? '⬡ From saved database' : '✦ AI identified'}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.detailTable}>
        {[
          ['Manufacturer', info.manufacturer],
          ['Protocol', info.protocol],
          ['Typical use', info.typical_use],
          ['AI confidence', info.confidence],
        ].map(([label, value]) => (
          <div key={label} className={styles.detailRow}>
            <span className={styles.detailLabel}>{label}</span>
            <span className={styles.detailValue}>{value || '—'}</span>
          </div>
        ))}
      </div>

      {info.key_features?.length > 0 && (
        <div className={styles.features}>
          {info.key_features.map(f => (
            <span key={f} className={styles.featureChip}>{f}</span>
          ))}
        </div>
      )}

      {info.notes && (
        <div className={styles.notes}>{info.notes}</div>
      )}

      <div className={styles.saveRow}>
        {saved ? (
          <button disabled style={{ background: 'var(--teal-bg)', color: 'var(--teal-text)', borderColor: 'var(--teal-bg)' }}>
            ✓ Saved in database{info._saved_at ? ` · ${new Date(info._saved_at).toLocaleDateString()}` : ''}
          </button>
        ) : (
          <button onClick={onSave}>Save to database</button>
        )}
      </div>
    </div>
  )
}
