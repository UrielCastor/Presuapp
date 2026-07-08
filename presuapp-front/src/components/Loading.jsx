export default function Loading({ message = 'Cargando...' }) {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <div className="spinner-ring"></div>
        <p className="loading-text">{message}</p>
      </div>
    </div>
  );
}
