import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/Card';
import Loading from '../components/Loading';
import Button from '../components/Button';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [items, setItems] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');

  // Hover states for interactive dashboard cards
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, budgetsRes, itemsRes] = await Promise.all([
          axiosInstance.get('/clients'),
          axiosInstance.get('/budgets'),
          axiosInstance.get('/items'),
        ]);
        setClients(clientsRes.data.data || []);
        setBudgets(budgetsRes.data.data || []);
        setItems(itemsRes.data.data || []);
      } catch (err) {
        setError('Error al cargar la información de tu cuenta. Reintentá recargando.');
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount || 0);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  if (loadingData) return <Loading message="Cargando panel de control..." />;

  // Calcs
  const totalPresupuestos = budgets.length;
  const totalClientes = clients.length;
  const totalServicios = items.length;

  const countPending = budgets.filter((b) => b.status === 'PENDING').length;
  const countSent = budgets.filter((b) => b.status === 'SENT').length;
  const countApproved = budgets.filter((b) => b.status === 'APPROVED').length;
  const countInProgress = budgets.filter((b) => b.status === 'IN_PROGRESS').length;
  const countFinished = budgets.filter((b) => b.status === 'FINISHED').length;
  const countCancelled = budgets.filter((b) => b.status === 'CANCELLED').length;

  const totalPresupuestado = budgets.reduce((sum, b) => sum + (b.total || 0), 0);
  const promedioPresupuesto = totalPresupuestos > 0 ? totalPresupuestado / totalPresupuestos : 0;
  const maxPresupuesto = totalPresupuestos > 0 ? Math.max(...budgets.map((b) => b.total || 0)) : 0;

  return (
    <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
      
      {/* 1. HEADER */}
      <div className="page-header" style={{ marginBottom: '28px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {greeting()}, {user?.name || user?.email?.split('@')[0] || 'Profesional'} 👋
          </h1>
          <p className="page-subtitle" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Panel de control analítico y resumen general de tu actividad
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/budgets')}>
          + Nuevo Presupuesto
        </Button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px', borderRadius: '12px' }}>
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* 2. PREMIUM KEY METRICS INTERACTIVE CARDS */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}
      >
        {/* Card 1: Presupuestos */}
        <div
          onClick={() => navigate('/budgets')}
          onMouseEnter={() => setHoveredCard('budgets')}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            cursor: 'pointer',
            padding: '24px',
            borderRadius: '16px',
            background: 'var(--bg-surface)',
            border: `1px solid ${hoveredCard === 'budgets' ? 'rgba(59, 130, 246, 0.4)' : 'var(--border-color)'}`,
            boxShadow: hoveredCard === 'budgets' ? '0 10px 20px -10px rgba(59, 130, 246, 0.15)' : 'none',
            transform: hoveredCard === 'budgets' ? 'translateY(-2px)' : 'translateY(0)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            position: 'relative'
          }}
        >
          <div style={{ fontSize: '2.2rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📄</div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 650 }}>Total Presupuestos</span>
            <span style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalPresupuestos}</span>
          </div>
          <span style={{ fontSize: '1rem', color: '#3b82f6', opacity: hoveredCard === 'budgets' ? 1 : 0.4, transition: 'opacity 0.2s', paddingRight: '4px' }}>↗</span>
        </div>

        {/* Card 2: Clientes */}
        <div
          onClick={() => navigate('/clients')}
          onMouseEnter={() => setHoveredCard('clients')}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            cursor: 'pointer',
            padding: '24px',
            borderRadius: '16px',
            background: 'var(--bg-surface)',
            border: `1px solid ${hoveredCard === 'clients' ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-color)'}`,
            boxShadow: hoveredCard === 'clients' ? '0 10px 20px -10px rgba(16, 185, 129, 0.15)' : 'none',
            transform: hoveredCard === 'clients' ? 'translateY(-2px)' : 'translateY(0)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            position: 'relative'
          }}
        >
          <div style={{ fontSize: '2.2rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👥</div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 655 }}>Total Clientes</span>
            <span style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalClientes}</span>
          </div>
          <span style={{ fontSize: '1rem', color: '#10b981', opacity: hoveredCard === 'clients' ? 1 : 0.4, transition: 'opacity 0.2s', paddingRight: '4px' }}>↗</span>
        </div>

        {/* Card 3: Servicios */}
        <div
          onClick={() => navigate('/items')}
          onMouseEnter={() => setHoveredCard('items')}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            cursor: 'pointer',
            padding: '24px',
            borderRadius: '16px',
            background: 'var(--bg-surface)',
            border: `1px solid ${hoveredCard === 'items' ? 'rgba(139, 92, 246, 0.4)' : 'var(--border-color)'}`,
            boxShadow: hoveredCard === 'items' ? '0 10px 20px -10px rgba(139, 92, 246, 0.15)' : 'none',
            transform: hoveredCard === 'items' ? 'translateY(-2px)' : 'translateY(0)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            position: 'relative'
          }}
        >
          <div style={{ fontSize: '2.2rem', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔧</div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 655 }}>Total Servicios</span>
            <span style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalServicios}</span>
          </div>
          <span style={{ fontSize: '1rem', color: '#8b5cf6', opacity: hoveredCard === 'items' ? 1 : 0.4, transition: 'opacity 0.2s', paddingRight: '4px' }}>↗</span>
        </div>
      </div>

      {/* 3. COMPACT PREMIUM STATUS DISTRIBUTION ROW */}
      <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        📊 Distribución de Presupuestos
      </h2>
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(132px, 1fr))',
          gap: '12px',
          marginBottom: '32px'
        }}
      >
        <div style={{ padding: '14px 12px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.18)', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.85rem' }}>🟡</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 650 }}>Pendientes</span>
          </div>
          <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{countPending}</strong>
        </div>

        <div style={{ padding: '14px 12px', textAlign: 'center', border: '1px solid rgba(59, 130, 246, 0.18)', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.85rem' }}>🔵</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 650 }}>Enviados</span>
          </div>
          <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{countSent}</strong>
        </div>

        <div style={{ padding: '14px 12px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.18)', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.85rem' }}>🟢</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 650 }}>Aceptados</span>
          </div>
          <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{countApproved}</strong>
        </div>

        <div style={{ padding: '14px 12px', textAlign: 'center', border: '1px solid rgba(139, 92, 246, 0.18)', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.85rem' }}>🟣</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 650 }}>En proceso</span>
          </div>
          <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{countInProgress}</strong>
        </div>

        <div style={{ padding: '14px 12px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.18)', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.85rem' }}>✅</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 650 }}>Finalizados</span>
          </div>
          <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{countFinished}</strong>
        </div>

        <div style={{ padding: '14px 12px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.18)', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.85rem' }}>🔴</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 650 }}>Cancelados</span>
          </div>
          <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{countCancelled}</strong>
        </div>
      </div>

      {/* 4. CLEAN GENERAL ECONOMICAL SUMMARY */}
      <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        💰 Resumen Económico General
      </h2>
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '20px'
        }}
      >
        <Card style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', borderTop: '4px solid #10b981', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Presupuestado</span>
            <span style={{ fontSize: '1.2rem', opacity: 0.8 }}>💵</span>
          </div>
          <strong style={{ fontSize: '1.8rem', fontWeight: 850, color: '#10b981', display: 'block' }}>{formatCurrency(totalPresupuestado)}</strong>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>Suma acumulada de todos tus presupuestos</span>
        </Card>

        <Card style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', borderTop: '4px solid #6366f1', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Promedio por Presupuesto</span>
            <span style={{ fontSize: '1.2rem', opacity: 0.8 }}>📊</span>
          </div>
          <strong style={{ fontSize: '1.8rem', fontWeight: 850, color: '#6366f1', display: 'block' }}>{formatCurrency(promedioPresupuesto)}</strong>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>Calulado en base a la cantidad total emitida</span>
        </Card>

        <Card style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', borderTop: '4px solid #f59e0b', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Presupuesto más Alto</span>
            <span style={{ fontSize: '1.2rem', opacity: 0.8 }}>🏆</span>
          </div>
          <strong style={{ fontSize: '1.8rem', fontWeight: 850, color: '#f59e0b', display: 'block' }}>{formatCurrency(maxPresupuesto)}</strong>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>Importe más alto facturado o enviado</span>
        </Card>
      </div>
    </div>
  );
}
