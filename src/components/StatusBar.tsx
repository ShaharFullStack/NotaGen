interface StatusBarProps {
  status: string;
  error: string;
}

export default function StatusBar({ status, error }: StatusBarProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 3,
        background: 'rgba(15, 23, 42, 0.9)',
        padding: '1rem 2rem',
        borderRadius: '8px',
        border: '1px solid #6366f1',
        minWidth: '300px',
        textAlign: 'center'
      }}
    >
      <p style={{ fontSize: '1rem', color: '#e2e8f0' }}>{status}</p>
      {error && (
        <p style={{ fontSize: '0.9rem', color: '#ef4444', marginTop: '0.5rem' }}>
          {error}
        </p>
      )}
    </div>
  );
}