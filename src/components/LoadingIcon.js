'use client'

export default function LoadingIcon({ size = 64 }) {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      width: '100%',
      height: '100vh',
      background: 'var(--cream)'
    }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        width={size}
        height={size}
        style={{
          animation: 'spin 1s linear infinite'
        }}
      >
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7C3AED"/>
            <stop offset="1" stopColor="#EC4899"/>
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill="url(#bg)"/>
        <path d="M18 24h28l3 24a4 4 0 0 1-4 4.5H19a4 4 0 0 1-4-4.5z" fill="#fff"/>
        <path d="M24 28v-6a8 8 0 0 1 16 0v6" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round"/>
        <path d="M25 38q7 8 14 0" fill="none" stroke="#7C3AED" strokeWidth="3.5" strokeLinecap="round"/>
      </svg>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
