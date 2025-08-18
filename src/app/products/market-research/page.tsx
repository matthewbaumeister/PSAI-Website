export default function MarketResearchPage() {
  return (
    <div className="page-content" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0B1220 0%, #1E293B 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: 'white',
          marginBottom: '1rem'
        }}>
          PS.AI Market Research
        </h1>
        <p style={{
          fontSize: '1.125rem',
          color: '#9CA3AF',
          lineHeight: '1.6',
          marginBottom: '2rem'
        }}>
          Coming Soon - This page is under development
        </p>
        <div style={{
          padding: '1rem',
          background: 'rgba(154, 242, 58, 0.1)',
          border: '1px solid rgba(154, 242, 58, 0.3)',
          borderRadius: '0.5rem',
          color: '#9AF23A'
        }}>
          Our market research tools will provide deep insights into government contracting opportunities and competitive landscapes.
        </div>
      </div>
    </div>
  )
}
