// src/components/common/PWAInstallBanner.jsx
import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { initInstallPrompt, showInstallPrompt, isInstalled } from '../../utils/pwa'

const STORAGE_KEY  = 'pwa_install_dismissed'
const BANNER_H     = 48   // px — keep in sync with CSS variable below

export default function PWAInstallBanner() {
  const [visible,    setVisible]    = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [leaving,    setLeaving]    = useState(false)

  /* ── Capture the browser install event ── */
  useEffect(() => {
    if (isInstalled()) return
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed === 'forever') return

    initInstallPrompt(() => setCanInstall(true))
  }, [])

  /* ── Show banner once canInstall becomes true ── */
  useEffect(() => {
    if (!canInstall) return
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed === 'forever' || isInstalled()) return

    const t = setTimeout(() => {
      setVisible(true)
      // Signal to CSS: banner is active — push sticky headers down
      document.documentElement.setAttribute('data-pwa-banner', 'true')
    }, 800)
    return () => clearTimeout(t)
  }, [canInstall])

  /* ── Dismiss helpers ── */
  const hide = (permanent = false) => {
    setLeaving(true)
    document.documentElement.removeAttribute('data-pwa-banner')
    setTimeout(() => {
      setVisible(false)
      setLeaving(false)
      localStorage.setItem(STORAGE_KEY, permanent ? 'forever' : 'session')
    }, 400)
  }

  const handleInstall = async () => {
    setInstalling(true)
    try {
      const outcome = await showInstallPrompt()
      if (outcome === 'accepted') hide(true)
      else setInstalling(false)
    } catch {
      setInstalling(false)
    }
  }

  if (!visible) return null

  return (
    <>
      {/* ── Banner strip ── */}
      <div
        id="pwa-install-banner"
        role="banner"
        aria-label="Install Expense AI"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: BANNER_H,
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
          padding: '0 16px',
          background: 'linear-gradient(90deg, #0f766e 0%, #0d9488 55%, #0891b2 100%)',
          boxShadow: '0 2px 12px rgba(13,148,136,0.40)',
          animation: leaving
            ? 'pwaBannerOut 0.38s cubic-bezier(0.4,0,0.2,1) forwards'
            : 'pwaBannerIn  0.44s cubic-bezier(0.16,1,0.3,1)  forwards',
        }}
      >
        {/* App icon */}
        <span
          aria-hidden="true"
          style={{ fontSize: 18, lineHeight: 1, marginRight: 10, flexShrink: 0 }}
        >
          💸
        </span>

        {/* Copy */}
        <span style={{
          color: 'rgba(255,255,255,0.96)',
          fontSize: '0.8125rem',
          fontWeight: 500,
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          userSelect: 'none',
        }}>
          Get the{' '}
          <strong style={{ fontWeight: 700 }}>Expense AI</strong>{' '}
          app — faster, offline‑ready, no browser bar
        </span>

        {/* Install CTA */}
        <button
          id="pwa-install-btn"
          onClick={handleInstall}
          disabled={installing}
          aria-label={installing ? 'Installing…' : 'Install Expense AI'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginLeft: 14,
            padding: '5px 13px',
            borderRadius: 7,
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.38)',
            color: '#fff',
            fontSize: '0.775rem',
            fontWeight: 700,
            letterSpacing: '0.03em',
            cursor: installing ? 'not-allowed' : 'pointer',
            opacity: installing ? 0.65 : 1,
            transition: 'background 0.16s, transform 0.14s, box-shadow 0.16s',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => {
            if (installing) return
            e.currentTarget.style.background = 'rgba(255,255,255,0.30)'
            e.currentTarget.style.transform  = 'translateY(-1px)'
            e.currentTarget.style.boxShadow  = '0 4px 12px rgba(0,0,0,0.15)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.18)'
            e.currentTarget.style.transform  = 'translateY(0)'
            e.currentTarget.style.boxShadow  = 'none'
          }}
        >
          <Download size={12} strokeWidth={2.5} />
          {installing ? 'Installing…' : 'Install'}
        </button>

        {/* Separator */}
        <span style={{
          width: 1,
          height: 18,
          background: 'rgba(255,255,255,0.28)',
          margin: '0 10px',
          flexShrink: 0,
        }} />

        {/* Dismiss (X) */}
        <button
          id="pwa-dismiss-btn"
          onClick={() => hide(false)}
          aria-label="Dismiss install prompt"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 26,
            borderRadius: 6,
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.22)',
            color: 'rgba(255,255,255,0.80)',
            cursor: 'pointer',
            transition: 'background 0.16s, color 0.16s',
            flexShrink: 0,
            padding: 0,
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.22)'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.10)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.80)'
          }}
        >
          <X size={13} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes pwaBannerIn {
          from { transform: translateY(-100%); opacity: 0.6; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        @keyframes pwaBannerOut {
          from { transform: translateY(0);     opacity: 1; }
          to   { transform: translateY(-100%); opacity: 0; }
        }

        /* Push sticky topbar + fixed sidebar below the banner */
        [data-pwa-banner="true"] .sticky {
          top: ${BANNER_H}px !important;
        }
        [data-pwa-banner="true"] .sidebar {
          top: ${BANNER_H}px !important;
          min-height: calc(100vh - ${BANNER_H}px) !important;
        }
      `}</style>
    </>
  )
}
