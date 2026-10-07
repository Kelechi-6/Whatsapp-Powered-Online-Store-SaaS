'use client'

import { useRouter } from 'next/navigation'
import { Lock, ArrowRight } from 'lucide-react'

interface UpgradePromptProps {
  featureName: string
  currentPlan: string
  requiredPlan?: string
  message?: string
}

export function UpgradePrompt({ featureName, currentPlan, requiredPlan = 'starter', message }: UpgradePromptProps) {
  const router = useRouter()

  const handleUpgrade = () => {
    router.push('/dashboard/subscription?upgrade=true')
  }

  return (
    <div style={{
      background: '#fff3cd',
      border: '1px solid #ffc107',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px'
    }}>
      <Lock size={20} style={{ color: '#856404', flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <strong style={{ color: '#856404', display: 'block', marginBottom: '4px' }}>
          {featureName} requires {requiredPlan} plan or higher
        </strong>
        <p style={{ margin: '4px 0 0 0', color: '#856404', fontSize: '13px', lineHeight: '1.4' }}>
          {message || `You're currently on the ${currentPlan} plan. Upgrade to access ${featureName.toLowerCase()}.`}
        </p>
        <button
          onClick={handleUpgrade}
          style={{
            background: '#856404',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          Upgrade Plan <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
