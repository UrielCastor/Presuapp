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
  const [profilePlan, setProfilePlan] = useState(null);
  const [profilePlanLoading, setProfilePlanLoading] = useState(true);
  
  const fetchActivePlan = async () => {
    try {
      const res = await axiosInstance.get('/payments/plan');
      setProfilePlan(res.data.data);
    } catch (err) {
      console.error('Error al obtener plan activo:', err);
    } finally {
      setProfilePlanLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
    fetchActivePlan();
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


  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const initialLetter = (user?.name || user?.email || 'P')[0].toUpperCase();

  return (
    <div className="page-container" style={{ maxWidth: '960px', margin: '0 auto' }}>
      
      {/* 1. ALERTS */}
      {paymentStatus === 'success' && (
        <div className="alert alert-success" style={{ marginBottom: '24px', borderRadius: '12px' }}>
          <span className="alert-icon">🎉</span>
          <div>
            <strong>¡Suscripción Premium Activada!</strong> Ahora tenés acceso ilimitado a clientes, presupuestos y catálogos.
          </div>
        </div>
      )}

      {paymentStatus === 'failure' && (
        <div className="alert alert-error" style={{ marginBottom: '24px', borderRadius: '12px' }}>
          <span className="alert-icon">⚠️</span>
          <div>
            <strong>Pago cancelado/rechazado.</strong> Seguís con tu plan gratuito actual.
          </div>
        </div>
      )}

      {errorPay && (
        <div className="alert alert-error" style={{ marginBottom: '24px', borderRadius: '12px' }}>
          <span className="alert-icon">⚠️</span>
          {errorPay}
        </div>
      )}

      {/* 2. UNIFIED PREMIUM HEADER */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          padding: '28px',
          background: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}
      >
        <div 
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '14px',
            background: 'rgba(59, 130, 246, 0.1)',
            color: '#3b82f6',
            fontSize: '1.8rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(59, 130, 246, 0.2)'
          }}
        >
          {initialLetter}
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {user?.name || 'Profesional'}
          </h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
            {user?.email}
          </span>
        </div>
        <div 
          style={{ 
            padding: '6px 14px', 
            borderRadius: '8px', 
            fontSize: '0.78rem', 
            fontWeight: 750,
            background: user?.userType === 'VIP' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(156, 163, 175, 0.08)',
            color: user?.userType === 'VIP' ? '#f59e0b' : 'var(--text-secondary)',
            border: `1px solid ${user?.userType === 'VIP' ? 'rgba(245, 158, 11, 0.2)' : 'var(--border-color)'}`
          }}
        >
          {user?.userType === 'VIP' ? '🏆 CLIENTE PREMIUM' : 'PLAN FREE'}
        </div>
      </div>

      {/* 3. SYMMETRICAL TWIN DETAILS LIST */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px'
        }}
      >
        {/* LEFT CARD: ACCOUNT DETAIL */}
        <Card style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚙️ Detalles de la Cuenta
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>📍 Ubicación</span>
              <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                {user?.city || user?.locality ? (
                  `${user.city || '—'}, ${user.locality || '—'}`
                ) : (
                  'No especificada'
                )}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>🏷️ Nombre de Usuario</span>
              <strong style={{ fontSize: '0.88rem', color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
                {user?.username ? `@${user.username}` : '—'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>🔑 Rol Asignado</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                {user?.role || 'PROFESIONAL'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>🆔 ID de Usuario</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                #{user?.id || '—'}
              </span>
            </div>
          </div>
        </Card>

        {/* RIGHT CARD: MEMBERSHIP DETAIL */}
        <Card style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💳 Membresía y Estado
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>📅 Alta del Servicio</span>
              <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                {user?.membership?.startDate ? formatDate(user.membership.startDate) : formatDate(Date.now())}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>⏳ Vencimiento del Plan</span>
              <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                {user?.userType === 'VIP' && user?.membership?.endDate 
                  ? formatDate(user.membership.endDate) 
                  : 'Sin límite (Plan gratuito)'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>📈 Estado</span>
              <span 
                style={{ 
                  fontSize: '0.74rem', 
                  fontWeight: 700, 
                  color: user?.userType === 'VIP' ? '#10b981' : 'var(--text-muted)',
                  textTransform: 'uppercase'
                }}
              >
                {user?.userType === 'VIP' ? 'Activo' : 'FREE'}
              </span>
            </div>
          </div>

          {/* CTA Box based on user plan */}
          {user?.userType !== 'VIP' ? (
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px',
                borderRadius: '12px',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                marginTop: '10px'
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
                  ⭐ Actualizate a {profilePlan ? `${profilePlan.name}` : 'Platinum Premium'}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4', display: 'block' }}>
                  Eliminá límites de clientes, presupuestos y catálogos de rubros por {profilePlan ? `$${profilePlan.price.toLocaleString('es-AR')} ${profilePlan.currency}` : '$10.000 ARS'} / mes.
                </span>
              </div>
              
              {profilePlan && !profilePlan.active ? (
                <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#f87171', fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold' }}>
                  El plan Premium no está disponible actualmente.
                </div>
              ) : (
                <>
                  <Button 
                    onClick={handleUpgrade} 
                    disabled={loadingPay || !profilePlan} 
                    variant="primary" 
                    style={{ width: '100%', padding: '10px', fontSize: '0.82rem', fontWeight: 700 }}
                  >
                    {loadingPay ? 'Iniciando...' : `Obtener Premium — ${profilePlan ? `$${profilePlan.price.toLocaleString('es-AR')}` : '$10.000'} / mes`}
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div 
              style={{ 
                padding: '12px 14px', 
                background: 'rgba(16, 185, 129, 0.04)', 
                border: '1px solid rgba(16, 185, 129, 0.12)', 
                borderRadius: '12px', 
                color: '#10b981', 
                fontSize: '0.82rem', 
                lineHeight: '1.4',
                marginTop: '10px',
                display: 'flex',
                gap: '8px'
              }}
            >
              <span>✨</span>
              <span>¡Felicidades! Tenés acceso total e ilimitado a PresuApp por ser cliente Platinum Premium.</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
