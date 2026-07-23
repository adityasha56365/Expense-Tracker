// src/pages/Premium.jsx
/**
 * Premium Subscription Page
 * - Free vs Premium comparison
 * - Fake payment flow (demo)
 * - Invoice display
 * - Modular: swap in Stripe/Razorpay by updating activatePremium() in PremiumContext
 */
import { useState } from 'react'
import { usePremium } from '../context/PremiumContext'
import { CheckCircle2, X, Sparkles, Crown, Zap, Shield, Star } from 'lucide-react'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ── Fake Payment Flow ─────────────────────────────────────────────────────────
function PaymentModal({ isOpen, onClose, plan, planInfo, onSuccess }) {
  const [step, setStep] = useState('card') // card | processing | success
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' })
  const [invoice, setInvoice] = useState(null)

  const handlePay = async () => {
    if (!card.name) { toast.error('Please enter cardholder name'); return }
    setStep('processing')
    // Simulate payment processing (2 seconds)
    await new Promise(r => setTimeout(r, 2000))
    const result = await onSuccess(plan)
    setInvoice(result?.invoice)
    setStep('success')
  }

  const handleClose = () => {
    setStep('card')
    setCard({ number: '', expiry: '', cvv: '', name: '' })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Complete Purchase" size="sm">
      {step === 'card' && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl flex items-center justify-between"
            style={{ background: 'var(--color-primary-muted)' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                {planInfo?.label} Plan
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Billed {plan === 'yearly' ? 'annually' : 'monthly'}
              </p>
            </div>
            <p className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
              ₹{planInfo?.price}
            </p>
          </div>

          {/* Demo payment form */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                Card Number
              </label>
              <input className="form-input" placeholder="4242 4242 4242 4242"
                value={card.number} onChange={e => setCard(c => ({ ...c, number: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                  Expiry
                </label>
                <input className="form-input" placeholder="MM/YY"
                  value={card.expiry} onChange={e => setCard(c => ({ ...c, expiry: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                  CVV
                </label>
                <input className="form-input" placeholder="123" type="password"
                  value={card.cvv} onChange={e => setCard(c => ({ ...c, cvv: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                Cardholder Name *
              </label>
              <input className="form-input" placeholder="Your name" required
                value={card.name} onChange={e => setCard(c => ({ ...c, name: e.target.value }))} />
            </div>
          </div>

          <div className="p-2 rounded-lg text-center" style={{ background: 'var(--color-surface-subtle)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              🔒 Demo mode — no real payment. Use any card details.
            </p>
          </div>

          <Button variant="primary" className="w-full" icon={Crown} onClick={handlePay}>
            Pay ₹{planInfo?.price}
          </Button>
        </div>
      )}

      {step === 'processing' && (
        <div className="py-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin mx-auto" />
          <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Processing payment...</p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Please wait a moment</p>
        </div>
      )}

      {step === 'success' && (
        <div className="py-6 text-center space-y-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ background: '#10b98120' }}>
            <CheckCircle2 size={40} style={{ color: '#10b981' }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Welcome to Premium! 🎉
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              All premium features are now unlocked
            </p>
          </div>
          {invoice && (
            <div className="p-4 rounded-xl text-left space-y-1"
              style={{ background: 'var(--color-surface-subtle)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>Invoice</p>
              <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                #{invoice.invoice_number}
              </p>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--color-text-secondary)' }}>{invoice.plan} Plan</span>
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>₹{invoice.amount}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{invoice.date}</p>
            </div>
          )}
          <Button variant="primary" className="w-full" onClick={handleClose}>
            Start Using Premium
          </Button>
        </div>
      )}
    </Modal>
  )
}

// ── Feature List ──────────────────────────────────────────────────────────────
function FeatureItem({ text, included }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      {included ? (
        <CheckCircle2 size={15} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
      ) : (
        <X size={15} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
      )}
      <span className="text-sm" style={{ color: included ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
        {text}
      </span>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Premium() {
  const { isPremium, plan, status, activatePremium, cancelPremium, loading } = usePremium()
  const [selectedPlan, setSelectedPlan] = useState('monthly')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  const plans = status.plans || {}
  const freeFeatures = status.free_features || []
  const premiumFeatures = status.premium_features || []

  const handleActivate = async (activatedPlan) => {
    const result = await activatePremium(activatedPlan)
    toast.success('Premium activated!')
    return result
  }

  const handleCancel = async () => {
    setCancelLoading(true)
    try {
      await cancelPremium()
      toast.success('Subscription cancelled. Downgraded to free plan.')
    } finally {
      setCancelLoading(false)
    }
  }

  if (isPremium) {
    return (
      <div className="max-w-2xl space-y-6 animate-fade-in">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Premium Plan</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Your active subscription</p>
        </div>

        {/* Active badge */}
        <div className="card p-6 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <Crown size={28} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">Premium Active ✓</p>
            <p className="text-sm opacity-80">
              {plan === 'yearly' ? 'Yearly' : 'Monthly'} Plan
              {status.expires_at ? ` · Expires ${new Date(status.expires_at).toLocaleDateString('en-IN')}` : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black">
              ₹{plan === 'yearly' ? '2,499' : '299'}
            </p>
            <p className="text-xs opacity-70">/{plan === 'yearly' ? 'year' : 'month'}</p>
          </div>
        </div>

        {/* Unlocked features */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            Your Premium Features
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {premiumFeatures.map(f => <FeatureItem key={f} text={f} included />)}
          </div>
        </div>

        <div className="p-4 rounded-xl border" style={{ borderColor: '#fca5a5', background: 'var(--color-danger-muted)' }}>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-danger)' }}>Cancel Subscription</p>
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            You'll lose access to premium features at the end of your billing period.
          </p>
          <Button variant="danger" size="sm" onClick={handleCancel} loading={cancelLoading}>
            Cancel Plan
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
          style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}>
          <Sparkles size={14} />
          <span className="text-xs font-semibold">Upgrade to unlock all features</span>
        </div>
        <h2 className="text-3xl font-black" style={{ color: 'var(--color-text-primary)' }}>
          Choose Your Plan
        </h2>
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Start free, upgrade when you're ready
        </p>
      </div>

      {/* Plan selector */}
      <div className="flex justify-center">
        <div className="inline-flex items-center p-1 rounded-xl" style={{ background: 'var(--color-surface-subtle)' }}>
          {[{ key: 'monthly', label: 'Monthly' }, { key: 'yearly', label: 'Yearly · Save 30%' }].map(p => (
            <button key={p.key}
              onClick={() => setSelectedPlan(p.key)}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: selectedPlan === p.key ? 'var(--color-primary)' : 'transparent',
                color: selectedPlan === p.key ? 'white' : 'var(--color-text-secondary)',
              }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Free plan */}
        <div className="card p-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={18} style={{ color: 'var(--color-text-secondary)' }} />
              <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Free Plan</h3>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-black" style={{ color: 'var(--color-text-primary)' }}>₹0</span>
              <span className="text-sm mb-1" style={{ color: 'var(--color-text-tertiary)' }}>/forever</span>
            </div>
          </div>
          <div className="space-y-0.5">
            {freeFeatures.map(f => <FeatureItem key={f} text={f} included />)}
            <FeatureItem text="Advanced AI forecasting" included={false} />
            <FeatureItem text="Bill splitting" included={false} />
            <FeatureItem text="Bank statement import" included={false} />
          </div>
          <button className="w-full py-2.5 rounded-xl border text-sm font-medium" disabled
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
            Current Plan
          </button>
        </div>

        {/* Premium plan */}
        <div className="card p-6 space-y-4 relative overflow-hidden"
          style={{ borderColor: 'var(--color-primary)', borderWidth: '2px' }}>
          {/* Popular badge */}
          <div className="absolute top-4 right-4 px-2 py-1 rounded-lg text-xs font-bold text-white"
            style={{ background: 'var(--color-primary)' }}>
            ✨ Popular
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown size={18} style={{ color: 'var(--color-primary)' }} />
              <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Premium Plan</h3>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-black" style={{ color: 'var(--color-primary)' }}>
                ₹{selectedPlan === 'yearly' ? (2499 / 12).toFixed(0) : 299}
              </span>
              <span className="text-sm mb-1" style={{ color: 'var(--color-text-tertiary)' }}>/month</span>
            </div>
            {selectedPlan === 'yearly' && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-success)' }}>
                Billed ₹2,499/year · Save ₹{(299 * 12 - 2499).toLocaleString()}
              </p>
            )}
          </div>
          <div className="space-y-0.5">
            {premiumFeatures.map(f => <FeatureItem key={f} text={f} included />)}
          </div>
          <Button variant="primary" className="w-full" icon={Zap}
            loading={loading}
            onClick={() => setPaymentOpen(true)}>
            Upgrade to Premium
          </Button>
        </div>
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap gap-4 justify-center">
        {[
          { icon: '🔒', text: 'Secure & Encrypted' },
          { icon: '↩️', text: 'Cancel Anytime' },
          { icon: '🛡️', text: '7-Day Money Back' },
          { icon: '⚡', text: 'Instant Activation' },
        ].map(item => (
          <div key={item.text} className="flex items-center gap-2 text-xs"
            style={{ color: 'var(--color-text-tertiary)' }}>
            <span>{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      {/* Payment modal */}
      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        plan={selectedPlan}
        planInfo={plans[selectedPlan]}
        onSuccess={handleActivate}
      />
    </div>
  )
}
