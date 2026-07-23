// src/components/common/PWAInstallBanner.jsx
import { useState, useEffect } from 'react'
import { Download, X, Smartphone, Zap, WifiOff, Bell } from 'lucide-react'
import { initInstallPrompt, showInstallPrompt, isInstalled } from '../../utils/pwa'

const STORAGE_KEY = 'pwa_install_dismissed'

export default function PWAInstallBanner() {
  const [visible, setVisible] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [animateOut, setAnimateOut] = useState(false)

  useEffect(() => {
    // Don't show if already installed as PWA
    if (isInstalled()) return

    // Don't show if user permanently dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed === 'forever') return

    // Listen for browser install readiness
    initInstallPrompt((e) => {
      setCanInstall(true)
      // Show popup after a brief delay so the page loads first
      const delay = dismissed === 'session' ? null : 1500
      if (delay !== null) {
        const timer = setTimeout(() => setVisible(true), delay)
        return () => clearTimeout(timer)
      }
    })

    // Also show immediately after page ready if event was already fired
    // (handles some browsers that fire beforeinstallprompt early)
    const fallbackTimer = setTimeout(() => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // Only show fallback if no dismissed flag and prompt was captured
        // canInstall check is reactive via state
      }
    }, 2000)

    return () => clearTimeout(fallbackTimer)
  }, [])

  // Re-show banner when canInstall becomes true (event captured after hook ran)
  useEffect(() => {
    if (!canInstall) return
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed === 'forever' || dismissed === 'session') return
    if (isInstalled()) return
    const timer = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(timer)
  }, [canInstall])

  const dismiss = (permanent = false) => {
    setAnimateOut(true)
    setTimeout(() => {
      setVisible(false)
      setAnimateOut(false)
      localStorage.setItem(STORAGE_KEY, permanent ? 'forever' : 'session')
    }, 350)
  }

  const handleInstall = async () => {
    setInstalling(true)
    try {
      const outcome = await showInstallPrompt()
      if (outcome === 'accepted') {
        dismiss(true)
      } else {
        setInstalling(false)
      }
    } catch {
      setInstalling(false)
    }
  }

  if (!visible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="pwa-backdrop"
        onClick={() => dismiss(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
          animation: animateOut ? 'fadeOut 0.35s ease forwards' : 'fadeIn 0.35s ease forwards',
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Install App"
        style={{
          position: 'fixed',
          bottom: '50%',
          left: '50%',
          transform: 'translate(-50%, 50%)',
          zIndex: 9999,
          width: 'min(440px, calc(100vw - 32px))',
          animation: animateOut ? 'slideDown 0.35s ease forwards' : 'slideUp 0.35s ease forwards',
        }}
      >
        <div style={{
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 24,
          boxShadow: '0 32px 64px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05)',
          overflow: 'hidden',
        }}>
          {/* Gradient header band */}
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 50%, var(--color-primary-light) 100%)',
            padding: '28px 28px 20px',
            position: 'relative',
          }}>
            {/* Close button */}
            <button
              onClick={() => dismiss(false)}
              aria-label="Close install prompt"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: 10,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              <X size={16} />
            </button>

            {/* App icon + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              }}>
                💸
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>
                  Install Expense AI
                </p>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', marginTop: 2 }}>
                  Smart Personal Finance Dashboard
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 28px 24px' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 18 }}>
              Add to your home screen for the best experience — works just like a native app!
            </p>

            {/* Feature chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {[
                { icon: WifiOff, label: 'Works offline', desc: 'Access your data without internet' },
                { icon: Zap, label: 'Lightning fast', desc: 'Instant load, no browser overhead' },
                { icon: Smartphone, label: 'App-like experience', desc: 'Full-screen, no browser bar' },
                { icon: Bell, label: 'Smart alerts', desc: 'Budget & bill reminders' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'var(--color-surface-subtle)',
                }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'var(--color-primary-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                    flexShrink: 0,
                  }}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-text-primary)', margin: 0 }}>{label}</p>
                    <p style={{ fontSize: '0.73rem', color: 'var(--color-text-tertiary)', margin: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                id="pwa-install-btn"
                onClick={handleInstall}
                disabled={installing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '13px 24px',
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
                  color: 'white',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: installing ? 'not-allowed' : 'pointer',
                  opacity: installing ? 0.75 : 1,
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 16px rgba(13,148,136,0.4)',
                }}
                onMouseEnter={e => { if (!installing) e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <Download size={18} />
                {installing ? 'Installing…' : 'Install App'}
              </button>

              <button
                id="pwa-dismiss-btn"
                onClick={() => dismiss(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-tertiary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: 8,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-tertiary)'}
              >
                No thanks, don&apos;t show again
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeOut { from { opacity: 1 } to { opacity: 0 } }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, calc(50% + 40px)); }
          to   { opacity: 1; transform: translate(-50%, 50%); }
        }
        @keyframes slideDown {
          from { opacity: 1; transform: translate(-50%, 50%); }
          to   { opacity: 0; transform: translate(-50%, calc(50% + 40px)); }
        }
      `}</style>
    </>
  )
}
