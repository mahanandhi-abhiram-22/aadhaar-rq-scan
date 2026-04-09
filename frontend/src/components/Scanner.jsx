import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode"
import { useEffect, useState, useRef } from "react"
import axios from "axios"
import jsQR from "jsqr"
import { BrowserQRCodeReader } from '@zxing/browser'

export default function Scanner() {
  const [result, setResult] = useState(null)
  const [cameras, setCameras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState(null)
  const [loading, setLoading] = useState(false)
  const html5QrcodeRef = useRef(null)

  useEffect(() => {
    let mounted = true
    Html5Qrcode.getCameras()
      .then(devices => {
        if (!mounted) return
        setCameras(devices || [])
        const back = (devices || []).find(d => /back|environment|rear/i.test(d.label))
        setSelectedCamera((back && back.id) || (devices && devices[0] && devices[0].id) || null)
      })
      .catch(() => setCameras([]))

    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!selectedCamera) return

    const codeReader = new BrowserQRCodeReader()
    html5QrcodeRef.current = codeReader

    const onResult = async (result, err) => {
      if (result) {
        try {
          setLoading(true)
          const res = await axios.post("/api/verify-qr", { raw: result.getText() })
          setResult(res.data)
          try { await codeReader.reset(); } catch (e) {}
        } catch (e) {
          console.error(e)
          setResult({ error: 'Failed to parse or verify QR' })
        } finally {
          setLoading(false)
        }
      }
    }

    codeReader.decodeFromVideoDevice(selectedCamera, 'reader', onResult).catch(err => console.error('video start failed', err))

    return () => {
      try { codeReader.reset(); } catch (e) {}
    }
  }, [selectedCamera])

  async function handleFileUpload(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setLoading(true)
    try {
      const html5Qrcode = html5QrcodeRef.current || new Html5Qrcode("reader")
      try {
        const decoded = await html5Qrcode.scanFileV2(file, true)
        if (decoded && decoded.decodedText) {
          const res = await axios.post("/api/verify-qr", { raw: decoded.decodedText })
          setResult(res.data)
          return
        }
      } catch (err) {
        console.warn('html5-qrcode file scan failed, falling back to jsQR', err && err.message)
      }

      // jsQR fallback
      const imgBitmap = await createImageBitmap(file)
      const tryJsqr = async () => {
        const rotations = [0, 90, 180, 270]
        const scales = [1, 0.8, 0.6, 0.4, 1.2]
        for (let s of scales) {
          for (let r of rotations) {
            const canvas = document.createElement('canvas')
            const w = Math.max(1, Math.round(imgBitmap.width * s))
            const h = Math.max(1, Math.round(imgBitmap.height * s))
            canvas.width = w
            canvas.height = h
            const ctx = canvas.getContext('2d')
            ctx.save()
            if (r !== 0) {
              ctx.translate(w / 2, h / 2)
              ctx.rotate((r * Math.PI) / 180)
              ctx.translate(-w / 2, -h / 2)
            }
            ctx.drawImage(imgBitmap, 0, 0, w, h)
            ctx.restore()
            try {
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
              const code = jsQR(imageData.data, canvas.width, canvas.height)
              if (code && code.data) return code.data
            } catch (e) {}
          }
        }
        return null
      }

      const jsqrResult = await tryJsqr()
      if (jsqrResult) {
        const res = await axios.post("/api/verify-qr", { raw: jsqrResult })
        setResult(res.data)
        return
      }

      setResult({ error: 'No QR code found in uploaded image' })
    } catch (err) {
      console.error(err)
      setResult({ error: 'Failed to decode uploaded image', detail: err && err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: 16 }}>
      <div style={{ width: 820, maxWidth: '100%', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 20, background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Scan Aadhaar QR</h2>
          {loading ? <div style={{ color: '#0366d6', fontWeight: 600 }}>Loading…</div> : null}
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
          <div style={{ flex: '0 0 420px' }}>
            {cameras.length > 0 && (
              <select value={selectedCamera || ''} onChange={e => setSelectedCamera(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6 }}>
                {cameras.map(c => <option key={c.id} value={c.id}>{c.label || c.id}</option>)}
              </select>
            )}
            <div id="reader" style={{ width: '100%', height: 360, border: '1px solid #eee', marginTop: 8, borderRadius: 6, overflow: 'hidden' }}></div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <label style={{ padding: '8px 12px', background: '#f3f4f6', borderRadius: 6, cursor: 'pointer' }}>
                Upload Image
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
              <button onClick={() => setResult(null)} style={{ padding: '8px 12px', background: '#fff', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }}>Clear</button>
            </div>
          </div>

<div style={{ flex: 1 }}>
            {result ? (
              <div style={{ border: '2px solid #e1e5e9', padding: 0, borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', background: '#fff' }}>
                {result.error && (
                  <div style={{ background: '#fee', color: '#c33', padding: 12, textAlign: 'center' }}>
                    {result.error}
                  </div>
                )}
                {result.verified !== false && result.normalized && (
                  <div>
                    <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: 16, textAlign: 'center' }}>
                      <h2 style={{ margin: 0, fontSize: '1.2em' }}>{result.verified === true ? '✅ Verified Aadhaar' : '📱 Scanned'}</h2>
                    </div>
                    <div style={{ padding: 24 }}>
                      {result.normalized.photoB64 ? (
                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                          <img src={'data:image/png;base64,' + result.normalized.photoB64} alt="Profile" style={{ width: 120, height: 150, borderRadius: 12, objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                        </div>
                      ) : (
                        <div style={{ width: 120, height: 150, borderRadius: 12, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '3em', color: '#666' }}>
                          👤
                        </div>
                      )}
                      <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4em', color: '#2c3e50' }}>{result.normalized.name}</h3>
                        <div style={{ color: '#7f8c8d', fontSize: '0.9em' }}>{result.normalized.gender} • {result.normalized.dob}</div>
                      </div>
                      <div style={{ display: 'grid', gap: 12, fontSize: '0.95em' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8f9fa', borderRadius: 8 }}>
                          <span style={{ color: '#2c3e50', fontWeight: 500 }}>Aadhaar</span>
                          <span style={{ fontFamily: 'monospace', color: '#27ae60' }}>{result.maskedAadhaar}</span>
                        </div>
                        <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: 8 }}>
                          <strong style={{ color: '#2c3e50', display: 'block', marginBottom: 4 }}>Address</strong>
                          <div style={{ lineHeight: 1.4, color: '#34495e', fontSize: '0.9em' }}>{result.normalized.address}</div>
                        </div>
                        {result.normalized.mobile !== 'N/A' && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8f9fa', borderRadius: 8 }}>
                            <span style={{ color: '#2c3e50', fontWeight: 500 }}>Mobile</span>
                            <span>{result.normalized.mobile}</span>
                          </div>
                        )}
                      </div>
<details style={{ marginTop: 16 }}>
                        <summary style={{ cursor: 'pointer', padding: 8, background: '#ecf0f1', borderRadius: 6, fontWeight: 500, color: '#2c3e50' }}>Raw Data</summary>
                        <div style={{ padding: 12, background: '#f8f9fa', borderRadius: 6, marginTop: 8, maxHeight: '300px', overflow: 'auto', maxWidth: '100%' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75em', fontFamily: 'monospace' }}>
                            {result.user && Object.entries(result.user).map(([key, value]) => {
                              let displayValue = String(value);
                              if (typeof value === 'string') {
                                if (key === 'i' || key === 's' || (value.length > 500 && !['a', 'address'].includes(key))) {
                                  displayValue = '[long data hidden]';
                                }
                              }
                              return (
                                <tr key={key} style={{ borderBottom: '1px solid #e9ecef' }}>
                                  <td style={{ padding: '2px 8px', color: '#495057', fontWeight: 'bold', whiteSpace: 'nowrap', minWidth: '80px' }}>{key}:</td>
                                  <td style={{ padding: '2px 8px', color: '#495057', wordBreak: 'break-all' }}>{displayValue}</td>
                                </tr>
                              );
                            })}
                          </table>
                        </div>
                      </details>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#95a5a6', textAlign: 'center', padding: 40 }}>Scan QR or upload image</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
