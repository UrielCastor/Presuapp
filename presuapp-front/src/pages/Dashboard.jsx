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
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, budgetsRes] = await Promise.all([
          axiosInstance.get('/clients'),
          axiosInstance.get('/budgets'),
        ]);
        setClients(clientsRes.data.data || []);
        setBudgets(budgetsRes.data.data || []);
      } catch {
        setError('Error al cargar los datos. Verificá tu conexión.');
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  if (loadingData) return <Loading message="Cargando dashboard..." />;

  const recentBudgets = [...budgets]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount || 0);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const getBudgetStatusClass = (status) => {
    const map = {
      PENDING: 'badge-warning',
      APPROVED: 'badge-success',
      REJECTED: 'badge-danger',
    };
    return map[status] || 'badge-default';
  };

  const getBudgetStatusLabel = (status) => {
    const map = {
      PENDING: 'Pendiente',
      APPROVED: 'Aprobado',
      REJECTED: 'Rechazado',
    };
    return map[status] || status;
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {greeting()}, {user?.name || user?.email?.split('@')[0] || 'Profesional'} 👋
          </h1>
          <p className="page-subtitle">Aquí tenés un resumen de tu actividad</p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/budgets')}
        >
          + Nuevo Presupuesto
        </Button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon stat-icon-blue">👥</div>
          <div className="stat-info">
            <span className="stat-label">Clientes</span>
            <span className="stat-value">{clients.length}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/clients')}
          >
            Ver todos →
          </Button>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon stat-icon-green">📋</div>
          <div className="stat-info">
            <span className="stat-label">Presupuestos</span>
            <span className="stat-value">{budgets.length}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/budgets')}
          >
            Ver todos →
          </Button>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon stat-icon-purple">✅</div>
          <div className="stat-info">
            <span className="stat-label">Aprobados</span>
            <span className="stat-value">
              {budgets.filter((b) => b.status === 'APPROVED').length}
            </span>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon stat-icon-orange">⏳</div>
          <div className="stat-info">
            <span className="stat-label">Pendientes</span>
            <span className="stat-value">
              {budgets.filter((b) => b.status === 'PENDING').length}
            </span>
          </div>
        </Card>
      </div>

      {/* Recent Budgets */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Últimos Presupuestos</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/budgets')}>
            Ver todos →
          </Button>
        </div>

        {recentBudgets.length === 0 ? (
          <Card className="empty-state">
            <div className="empty-icon">📋</div>
            <p className="empty-text">No hay presupuestos todavía</p>
            <Button variant="primary" onClick={() => navigate('/budgets')}>
              Crear presupuesto
            </Button>
          </Card>
        ) : (
          <div className="recent-list">
            {recentBudgets.map((b) => (
              <Card
                key={b.id}
                className="recent-item"
                onClick={() => navigate(`/budgets/${b.id}`)}
              >
                <div className="recent-item-left">
                  <span className="recent-number">#{b.id}</span>
                  <div>
                    <p className="recent-client">
                      {b.client?.name || 'Sin cliente'}
                    </p>
                    <p className="recent-date">{formatDate(b.createdAt)}</p>
                  </div>
                </div>
                <div className="recent-item-right">
                  <span className={`badge ${getBudgetStatusClass(b.status)}`}>
                    {getBudgetStatusLabel(b.status)}
                  </span>
                  <span className="recent-total">
                    {formatCurrency(b.total)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
