import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/Card';
import Button from '../components/Button';
import axiosInstance from '../api/axios';

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [paymentStatus, setPaymentStatus] = useState(searchParams.get('payment'));
  const [loadingPay, setLoadingPay] = useState(false);
  const [errorPay, setErrorPay] = useState('');
  
  // Refresh the profile data on mount to see changes immediately (e.g. from redirect)
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const handleUpgrade = async () => {
    setLoadingPay(true);
    setErrorPay('');
    try {
      const res = await axiosInstance.post('/payments/create-preference');
      const { initPoint } = res.data.data;
      if (initPoint) {
        window.location.href = initPoint;
      } else {
        setErrorPay('No se pudo redirigir a Mercado Pago.');
      }
    } catch (err) {
      console.error(err);
      setErrorPay(err.response?.data?.message || 'Error al conectar con la pasarela de pagos.');
    } finally {
      setLoadingPay(false);
    }
  };

  const handleSimulateSuccess = async () => {
    setLoadingPay(true);
    setErrorPay('');
    try {
      await axiosInstance.post('/payments/simulate-success');
      setPaymentStatus('success');
      setSearchParams({ payment: 'success' });
      await refreshProfile();
    } catch (err) {
      setErrorPay('Error al simular el pago.');
    } finally {
      setLoadingPay(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Mi Perfil</h1>
      </div>

      {paymentStatus === 'success' && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          <span className="alert-icon">🎉</span>
          <div>
            <strong>¡Pago aprobado con éxito!</strong> Tu cuenta ahora forma parte del plan <strong>VIP</strong>. Disfrutá de acceso ilimitado a todas las herramientas.
          </div>
        </div>
      )}

      {paymentStatus === 'failure' && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <span className="alert-icon">⚠️</span>
          <div>
            <strong>Pago rechazado.</strong> No pudimos procesar tu suscripción. Tu cuenta se mantiene en plan <strong>FREE</strong>.
          </div>
        </div>
      )}

      {errorPay && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <span className="alert-icon">⚠️</span>
          {errorPay}
        </div>
      )}

      <div className="profile-grid">
        <Card className="profile-card">
          <div className="profile-avatar">
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <h2 className="profile-name">{user?.name || 'Sin nombre'}</h2>
          <p className="profile-email">{user?.email}</p>
          {user?.profession && (
            <span className="badge badge-info">{user.profession}</span>
          )}
        </Card>

        <Card className="detail-card">
          <h2 className="detail-card-title">📋 Información de cuenta</h2>
          <div className="detail-info">
            {user?.name && (
              <div className="detail-row-field">
                <span className="field-label">Nombre</span>
                <span className="field-value">{user.name}</span>
              </div>
            )}
            {user?.username && (
              <div className="detail-row-field">
                <span className="field-label">Nombre de usuario</span>
                <span className="field-value" style={{ fontFamily: 'monospace', color: 'var(--brand-primary)', fontWeight: 'bold' }}>
                  @{user.username}
                </span>
              </div>
            )}
            <div className="detail-row-field">
              <span className="field-label">Email</span>
              <span className="field-value">{user?.email}</span>
            </div>
            <div className="detail-row-field">
              <span className="field-label">Residencia</span>
              <span className="field-value">
                {user?.city || user?.locality ? (
                  `${user.city || '—'}, ${user.locality || '—'}`
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin especificar</span>
                )}
              </span>
            </div>
            <div className="detail-row-field">
              <span className="field-label">Tipo de cuenta</span>
              <span className={`badge ${user?.userType === 'VIP' ? 'badge-warning' : 'badge-default'}`}>
                {user?.userType || 'FREE'}
              </span>
            </div>
            {user?.id && (
              <div className="detail-row-field">
                <span className="field-label">ID de usuario</span>
                <span className="field-value">#{user.id}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="detail-card" style={{ gridColumn: '1 / -1' }}>
          <h2 className="detail-card-title">💳 Mi Plan (Membresía)</h2>
          <div className="detail-info">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '8px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span className="field-label" style={{ display: 'block', marginBottom: '4px' }}>Plan Actual</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  {user?.userType === 'VIP' ? 'Platinum VIP ⭐' : 'Plan Básico (FREE)'}
                </strong>
              </div>
              <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span className="field-label" style={{ display: 'block', marginBottom: '4px' }}>Estado</span>
                <span className={`badge ${user?.userType === 'VIP' ? 'badge-success' : 'badge-default'}`}>
                  {user?.userType === 'VIP' ? 'Activo' : 'Libre'}
                </span>
              </div>
              <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span className="field-label" style={{ display: 'block', marginBottom: '4px' }}>Inicio de Membresía</span>
                <span className="field-value" style={{ color: 'var(--text-secondary)' }}>
                  {user?.membership?.startDate ? formatDate(user.membership.startDate) : '—'}
                </span>
              </div>
              <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span className="field-label" style={{ display: 'block', marginBottom: '4px' }}>Vencimiento</span>
                <span className="field-value" style={{ color: 'var(--text-secondary)' }}>
                  {user?.userType === 'VIP' && user?.membership?.endDate 
                    ? formatDate(user.membership.endDate) 
                    : 'Sin límite (Plan gratuito)'}
                </span>
              </div>
            </div>

            {user?.userType !== 'VIP' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '24px', padding: '24px 16px', background: 'rgba(99, 102, 241, 0.04)', border: '1px dashed rgba(99, 102, 241, 0.3)', borderRadius: '12px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '750', marginBottom: '8px' }}>⚡ Actualizate a VIP y eliminá todos los límites</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '500px', marginBottom: '20px' }}>
                  El plan FREE limita tus profesiones, clientes, servicios y presupuestos. Actualizate a VIP por solo <strong>$10.000 / mes</strong> para obtener acceso corporativo y sin límites de almacenamiento.
                </p>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                  <Button 
                    onClick={handleUpgrade} 
                    disabled={loadingPay} 
                    variant="primary" 
                    style={{ padding: '12px 32px', fontSize: '1.02rem', fontWeight: 'bold', minWidth: '260px' }}
                  >
                    {loadingPay ? 'Creando preferencia...' : 'Actualizar a VIP — $10.000 / mes'}
                  </Button>
                  <Button 
                    onClick={handleSimulateSuccess} 
                    disabled={loadingPay} 
                    variant="secondary" 
                    style={{ padding: '12px 20px', fontSize: '0.95rem' }}
                  >
                    🧪 Simular Pago Aprobado
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--brand-success)', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '14px', borderRadius: '8px' }}>
                ✨ <strong>¡Felicidades!</strong> Estás disfrutando del Plan VIP. Tus cuotas para registrar profesiones, clientes, presupuestos y servicios del catálogo son ahora de acceso libre e ilimitado.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
