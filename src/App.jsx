import { useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import './App.css'

function App() {
  // QR type
  const [qrType, setQrType] = useState('URL')

  // Customization
  const [qrSize, setQrSize] = useState(200)
  const [foreground, setForeground] = useState('#000000')
  const [background, setBackground] = useState('#ffffff')
  const [errorLevel, setErrorLevel] = useState('M')
  const [margin, setMargin] = useState(2)

  // URL / Text
  const [input, setInput] = useState('')

  // Email
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  // Phone
  const [phone, setPhone] = useState('')

  // Wi-Fi
  const [wifiName, setWifiName] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [wifiSecurity, setWifiSecurity] = useState('WPA')

  // Recent QR codes
  const [recentQRs, setRecentQRs] = useState(() => {
    const saved = localStorage.getItem('recentQRs')

    return saved ? JSON.parse(saved) : []
  })

  // ---------------- VALIDATION ----------------

  const validateInput = () => {
    if (qrType === 'URL') {
      if (!input.trim()) {
        return 'Please enter a URL'
      }

      try {
        const url = new URL(input)

        if (
          url.protocol !== 'http:' &&
          url.protocol !== 'https:'
        ) {
          return 'Please enter a valid HTTP or HTTPS URL'
        }
      } catch {
        return 'Please enter a valid URL, for example https://example.com'
      }
    }

    if (qrType === 'Text') {
      if (!input.trim()) {
        return 'Please enter some text'
      }
    }

    if (qrType === 'Email') {
      if (!email.trim()) {
        return 'Please enter an email address'
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailPattern.test(email)) {
        return 'Please enter a valid email address'
      }
    }

    if (qrType === 'Phone') {
      if (!phone.trim()) {
        return 'Please enter a phone number'
      }

      const phonePattern = /^\+?[0-9\s()-]{7,20}$/

      if (!phonePattern.test(phone)) {
        return 'Please enter a valid phone number'
      }
    }

    if (qrType === 'Wi-Fi') {
      if (!wifiName.trim()) {
        return 'Please enter the Wi-Fi network name'
      }

      if (wifiSecurity !== 'nopass' && !wifiPassword) {
        return 'Please enter the Wi-Fi password'
      }
    }

    return ''
  }

  const validationError = validateInput()

  // ---------------- PRESETS ----------------

  const applyPreset = (preset) => {
    if (preset === 'classic') {
      setForeground('#000000')
      setBackground('#ffffff')
    }

    if (preset === 'dark') {
      setForeground('#ffffff')
      setBackground('#000000')
    }

    if (preset === 'blue') {
      setForeground('#2563eb')
      setBackground('#eff6ff')
    }
  }

  // ---------------- QR VALUE ----------------

  let qrValue = ''

  if (qrType === 'URL' || qrType === 'Text') {
    qrValue = input
  }

  if (qrType === 'Email') {
    qrValue = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(message)}`
  }

  if (qrType === 'Phone') {
    qrValue = `tel:${phone}`
  }

  if (qrType === 'Wi-Fi') {
    qrValue = `WIFI:T:${wifiSecurity};S:${wifiName};P:${wifiPassword};;`
  }

  // ---------------- DOWNLOAD ----------------

  const downloadQR = () => {
    const canvas = document.querySelector('.preview canvas')

    if (!canvas) {
      return
    }

    const image = canvas.toDataURL('image/png')

    const link = document.createElement('a')
    link.href = image
    link.download = 'my-qr-code.png'
    link.click()
  }

  // ---------------- SAVE TO RECENT ----------------

  const saveToRecent = () => {
    if (!qrValue || validationError) {
      return
    }

    const canvas = document.querySelector('.preview canvas')

    if (!canvas) {
      return
    }

    const qrImage = canvas.toDataURL('image/png')

    const newQR = {
      id: Date.now(),
      type: qrType,
      value: qrValue,
      image: qrImage,
    }

    const updatedQRs = [newQR, ...recentQRs].slice(0, 5)

    setRecentQRs(updatedQRs)

    localStorage.setItem(
      'recentQRs',
      JSON.stringify(updatedQRs)
    )
  }

  // ---------------- CLEAR HISTORY ----------------

  const clearHistory = () => {
    setRecentQRs([])
    localStorage.removeItem('recentQRs')
  }

  // ---------------- SCAN RELIABILITY ----------------

  // Convert a HEX color into relative luminance
  const getColorLuminance = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const convert = (value) => {
      return value <= 0.03928
        ? value / 12.92
        : Math.pow((value + 0.055) / 1.055, 2.4)
    }

    return (
      0.2126 * convert(r) +
      0.7152 * convert(g) +
      0.0722 * convert(b)
    )
  }

  // Calculate contrast between foreground and background
  const getContrastRatio = (color1, color2) => {
    const luminance1 = getColorLuminance(color1)
    const luminance2 = getColorLuminance(color2)

    const lighter = Math.max(luminance1, luminance2)
    const darker = Math.min(luminance1, luminance2)

    return (lighter + 0.05) / (darker + 0.05)
  }

  const contrastRatio = getContrastRatio(
    foreground,
    background
  )

  // Build warnings
  const scanWarnings = []

  // Small QR warning
  if (qrSize < 150) {
    scanWarnings.push(
      'The QR code is quite small and may be difficult to scan.'
    )
  }

  // Error correction warning
  if (errorLevel === 'L') {
    scanWarnings.push(
      'Low error correction provides less protection if the QR code is damaged.'
    )
  }

  // Very low color contrast warning
  if (contrastRatio < 2) {
    scanWarnings.push(
      'The foreground and background colors have very low contrast. This QR code may be difficult or impossible for scanners to read.'
    )
  }

  return (
    <div className="app">
      <div className="container">

        <h1>QR Code Generator</h1>

        <p className="subtitle">
          Create and customize your QR code
        </p>


        {/* QR TYPE */}

        <h2>Choose QR Type</h2>

        <div className="type-buttons">

          <button
            className={qrType === 'URL' ? 'active' : ''}
            onClick={() => setQrType('URL')}
          >
            URL
          </button>

          <button
            className={qrType === 'Text' ? 'active' : ''}
            onClick={() => setQrType('Text')}
          >
            Text
          </button>

          <button
            className={qrType === 'Email' ? 'active' : ''}
            onClick={() => setQrType('Email')}
          >
            Email
          </button>

          <button
            className={qrType === 'Phone' ? 'active' : ''}
            onClick={() => setQrType('Phone')}
          >
            Phone
          </button>

          <button
            className={qrType === 'Wi-Fi' ? 'active' : ''}
            onClick={() => setQrType('Wi-Fi')}
          >
            Wi-Fi
          </button>

        </div>


        {/* URL */}

        {qrType === 'URL' && (
          <>
            <label>Enter URL</label>

            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="https://example.com"
            />
          </>
        )}


        {/* TEXT */}

        {qrType === 'Text' && (
          <>
            <label>Enter Text</label>

            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Enter your text"
            />
          </>
        )}


        {/* EMAIL */}

        {qrType === 'Email' && (
          <>
            <label>Email Address</label>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@email.com"
            />

            <label>Subject</label>

            <input
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Email subject"
            />

            <label>Message</label>

            <input
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Your message"
            />
          </>
        )}


        {/* PHONE */}

        {qrType === 'Phone' && (
          <>
            <label>Phone Number</label>

            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+91 9876543210"
            />
          </>
        )}


        {/* WI-FI */}

        {qrType === 'Wi-Fi' && (
          <>
            <label>Network Name</label>

            <input
              type="text"
              value={wifiName}
              onChange={(event) => setWifiName(event.target.value)}
              placeholder="Wi-Fi name"
            />

            <label>Password</label>

            <input
              type="password"
              value={wifiPassword}
              onChange={(event) => setWifiPassword(event.target.value)}
              placeholder="Wi-Fi password"
            />

            <label>Security</label>

            <select
              value={wifiSecurity}
              onChange={(event) => setWifiSecurity(event.target.value)}
            >
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">No Password</option>
            </select>
          </>
        )}


        {/* CUSTOMIZATION */}

        <div className="customization">

          <h2>Customize</h2>

          <label>QR Size</label>

          <input
            type="range"
            min="100"
            max="400"
            value={qrSize}
            onChange={(event) =>
              setQrSize(Number(event.target.value))
            }
          />

          <p>Size: {qrSize}px</p>


          <label>Foreground Color</label>

          <input
            type="color"
            value={foreground}
            onChange={(event) =>
              setForeground(event.target.value)
            }
          />


          <label>Background Color</label>

          <input
            type="color"
            value={background}
            onChange={(event) =>
              setBackground(event.target.value)
            }
          />


          <label>Error Correction</label>

          <select
            value={errorLevel}
            onChange={(event) =>
              setErrorLevel(event.target.value)
            }
          >
            <option value="L">Low</option>
            <option value="M">Medium</option>
            <option value="Q">Quartile</option>
            <option value="H">High</option>
          </select>


          <label>Margin</label>

          <input
            type="range"
            min="0"
            max="10"
            value={margin}
            onChange={(event) =>
              setMargin(Number(event.target.value))
            }
          />

          <p>Margin: {margin}</p>

        </div>


        {/* PRESETS */}

        <div className="presets">

          <h2>Presets</h2>

          <div className="preset-buttons">

            <button
              onClick={() => applyPreset('classic')}
            >
              Classic
            </button>

            <button
              onClick={() => applyPreset('dark')}
            >
              Dark
            </button>

            <button
              onClick={() => applyPreset('blue')}
            >
              Blue
            </button>

          </div>

        </div>


        {/* PREVIEW */}

        <div className="preview">

          <h2>Preview</h2>

          {qrValue && !validationError ? (
            <>
              <QRCodeCanvas
                value={qrValue}
                size={qrSize}
                fgColor={foreground}
                bgColor={background}
                level={errorLevel}
                marginSize={margin}
              />

              <br />

              <button
                className="download-button"
                onClick={downloadQR}
              >
                Download PNG
              </button>

              <button
                className="save-button"
                onClick={saveToRecent}
              >
                Save to Recent
              </button>
            </>
          ) : (
            <>
              {validationError && qrValue ? (
                <p className="error-message">
                  {validationError}
                </p>
              ) : (
                <p>Your QR code will appear here</p>
              )}
            </>
          )}

          {/* SCAN WARNINGS */}

          {scanWarnings.length > 0 && (
            <div className="scan-warning">
              <strong>
                ⚠️ Scan reliability warning
              </strong>

              <ul>
                {scanWarnings.map((warning, index) => (
                  <li key={index}>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>


        {/* RECENT QR CODES */}

        <div className="recent">

          <div className="recent-header">

            <h2>Recent QR Codes</h2>

            {recentQRs.length > 0 && (
              <button
                className="clear-history-button"
                onClick={clearHistory}
              >
                Clear History
              </button>
            )}

          </div>


          {recentQRs.length === 0 ? (
            <p>No recent QR codes yet.</p>
          ) : (
            <div className="recent-list">

              {recentQRs.map((qr) => (
                <div
                  className="recent-item"
                  key={qr.id}
                >

                  <img
                    src={qr.image}
                    alt="Saved QR Code"
                    width="120"
                    height="120"
                  />

                  <div>

                    <strong>{qr.type}</strong>

                    <p>{qr.value}</p>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

      </div>
    </div>
  )
}

export default App