export default function Card({ children, className = '', onClick, style }) {
  return (
    <div
      className={`card ${className}`}
      onClick={onClick}
      style={{ ...(onClick ? { cursor: 'pointer' } : {}), ...style }}
    >
      {children}
    </div>
  );
}
