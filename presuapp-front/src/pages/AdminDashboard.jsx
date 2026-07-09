import { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import Card from '../components/Card';
import Button from '../components/Button';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dashboard states
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  // User management states
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  
  // Filters
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchProfession, setSearchProfession] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  // Modals / Acciones
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionUser, setActionUser] = useState(null); // Usuario al que se aplica el cambio
  const [confirmAction, setConfirmAction] = useState({ type: '', value: '', show: false }); // {type: 'plan'|'status', value: string, show: boolean}
  
  // Memberships states
  const [memberships, setMemberships] = useState([]);
  const [membershipsLoading, setMembershipsLoading] = useState(true);
  const [membershipsError, setMembershipsError] = useState('');
  const [memPagination, setMemPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [memFilters, setMemFilters] = useState({ name: '', email: '', filterType: '' });
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [showMemDetailModal, setShowMemDetailModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendDays, setExtendDays] = useState('30');
  const [confirmMemAction, setConfirmMemAction] = useState({ type: '', targetUserId: null, userName: '', show: false }); // activate | deactivate | extend

  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  // Fetch stats
  const fetchStats = async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const res = await axiosInstance.get('/admin/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
      setStatsError('No se pudieron cargar las estadísticas generales.');
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const params = {
        page,
        name: searchName || undefined,
        email: searchEmail || undefined,
        city: searchCity || undefined,
        profession: searchProfession || undefined,
        plan: filterPlan || undefined,
        status: filterStatus || undefined,
      };
      const res = await axiosInstance.get('/admin/users', { params });
      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
      setUsersError('Error al listar los usuarios registrados.');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchMemberships = async () => {
    setMembershipsLoading(true);
    setMembershipsError('');
    try {
      const params = {
        page,
        name: memFilters.name || undefined,
        email: memFilters.email || undefined,
        filterType: memFilters.filterType || undefined,
      };
      const res = await axiosInstance.get('/admin/memberships', { params });
      setMemberships(res.data.data.memberships);
      setMemPagination({
        total: res.data.data.pagination.total,
        page: res.data.data.pagination.page,
        limit: res.data.data.pagination.limit,
        totalPages: Math.ceil(res.data.data.pagination.total / res.data.data.pagination.limit) || 1
      });
    } catch (err) {
      console.error(err);
      setMembershipsError('Error al listar las membresías.');
    } finally {
      setMembershipsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'memberships') {
      fetchMemberships();
    }
  }, [activeTab, page]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleApplyMemFilters = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMemberships();
  };

  const handleClearMemFilters = () => {
    setMemFilters({ name: '', email: '', filterType: '' });
    setPage(1);
    setTimeout(fetchMemberships, 50);
  };

  const handleViewMembership = async (userId) => {
    try {
      const res = await axiosInstance.get(`/admin/memberships/${userId}`);
      setSelectedMembership(res.data.data);
      setShowMemDetailModal(true);
    } catch (err) {
      alert('Error al cargar la información detallada de la membresía.');
    }
  };

  const triggerMemAction = (type, targetUserId, userName) => {
    setConfirmMemAction({
      type,
      targetUserId,
      userName,
      show: true
    });
  };

  const handleConfirmMemActionSubmit = async () => {
    setActionSubmitting(true);
    setActionError('');
    try {
      const { type, targetUserId } = confirmMemAction;
      if (type === 'activate') {
        await axiosInstance.post('/admin/memberships/activate', { userId: targetUserId });
      } else if (type === 'deactivate') {
        await axiosInstance.post('/admin/memberships/deactivate', { userId: targetUserId });
      } else if (type === 'extend') {
        await axiosInstance.post('/admin/memberships/extend', { userId: targetUserId, days: parseInt(extendDays) });
      }
      
      setConfirmMemAction({ type: '', targetUserId: null, userName: '', show: false });
      setShowExtendModal(false);
      
      fetchMemberships();
      fetchStats();
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || 'Error al procesar la acción sobre la membresía.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleClearFilters = () => {
    setSearchName('');
    setSearchEmail('');
    setSearchCity('');
    setSearchProfession('');
    setFilterPlan('');
    setFilterStatus('');
    setPage(1);
    // Para que refresque automáticamente tras limpiar
    setTimeout(fetchUsers, 50);
  };

  // Trigger Plan confirmation
  const triggerPlanChange = (user, targetPlan) => {
    setActionUser(user);
    setConfirmAction({
      type: 'plan',
      value: targetPlan,
      show: true
    });
  };

  // Trigger Status confirmation
  const triggerStatusChange = (user, targetStatus) => {
    setActionUser(user);
    setConfirmAction({
      type: 'status',
      value: targetStatus,
      show: true
    });
  };

  // Trigger Role confirmation
  const triggerRoleChange = (user, targetRole) => {
    setActionUser(user);
    setConfirmAction({
      type: 'role',
      value: targetRole,
      show: true
    });
  };

  const handleConfirmActionSubmit = async () => {
    if (!actionUser) return;
    setActionSubmitting(true);
    setActionError('');
    try {
      if (confirmAction.type === 'plan') {
        await axiosInstance.post('/admin/users/plan', {
          userId: actionUser.id,
          plan: confirmAction.value
        });
      } else if (confirmAction.type === 'status') {
        await axiosInstance.post('/admin/users/status', {
          userId: actionUser.id,
          status: confirmAction.value
        });
      } else if (confirmAction.type === 'role') {
        await axiosInstance.post('/admin/users/role', {
          userId: actionUser.id,
          role: confirmAction.value
        });
      }

      // Cerrar modal y refrescar
      setConfirmAction({ type: '', value: '', show: false });
      setActionUser(null);
      
      // Recargar lista u vista de detalle si estaba abierta
      fetchUsers();
      if (activeTab === 'dashboard') fetchStats();
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || 'Error al procesar el cambio solicitado.');
    } finally {
      setActionSubmitting(false);
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
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">⚙️ Consola de Administración</h1>
          <p className="page-subtitle" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Supervisión y control del ecosistema de PresuApp.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', paddingBottom: '2px' }}>
        <button
          onClick={() => { setActiveTab('dashboard'); setPage(1); }}
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'dashboard' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            fontWeight: 'bold',
            padding: '12px 20px',
            cursor: 'pointer',
            fontSize: '1rem',
            borderBottom: activeTab === 'dashboard' ? '3px solid var(--brand-primary)' : '3px solid transparent',
            transition: 'all var(--transition)'
          }}
        >
          📊 Dashboard & Métricas
        </button>
        <button
          onClick={() => { setActiveTab('users'); setPage(1); }}
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'users' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            fontWeight: 'bold',
            padding: '12px 20px',
            cursor: 'pointer',
            fontSize: '1rem',
            borderBottom: activeTab === 'users' ? '3px solid var(--brand-primary)' : '3px solid transparent',
            transition: 'all var(--transition)'
          }}
        >
          👥 Gestión de Usuarios
        </button>
        <button
          onClick={() => { setActiveTab('memberships'); setPage(1); }}
          className={`tab-btn ${activeTab === 'memberships' ? 'active' : ''}`}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'memberships' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            fontWeight: 'bold',
            padding: '12px 20px',
            cursor: 'pointer',
            fontSize: '1rem',
            borderBottom: activeTab === 'memberships' ? '3px solid var(--brand-primary)' : '3px solid transparent',
            transition: 'all var(--transition)'
          }}
        >
          💳 Membresías & Pagos
        </button>
      </div>

      {/* RENDER TAB 1: METRICAS */}
      {activeTab === 'dashboard' && (
        <div>
          {statsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div className="spinner"></div>
            </div>
          ) : statsError ? (
            <div className="alert alert-error">{statsError}</div>
          ) : !stats ? null : (
            <div>
              {/* Grilla principal estadísticas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                
                {/* CARD 1: USUARIOS */}
                <Card style={{ borderLeft: '4px solid var(--brand-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Registros Generales</h3>
                    <span style={{ fontSize: '1.25rem' }}>👥</span>
                  </div>
                  <strong style={{ fontSize: '2rem', display: 'block', margin: '12px 0 6px', color: '#fff' }}>
                    {stats.users.total}
                  </strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span>Activos: <b style={{ color: 'var(--brand-success)' }}>{stats.users.active}</b></span>
                    <span>•</span>
                    <span>VIPs: <b style={{ color: 'var(--brand-warning)' }}>{stats.users.vip}</b></span>
                    <span>•</span>
                    <span>Gratis: <b>{stats.users.free}</b></span>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px' }}>
                    📈 Registrados hoy: <b>{stats.users.today}</b> | Nuevos este mes: <b>{stats.users.thisMonth}</b>
                  </div>
                </Card>

                {/* CARD 2: MEMBRESÍAS */}
                <Card style={{ borderLeft: '4px solid var(--brand-warning)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Membresías VIP</h3>
                    <span style={{ fontSize: '1.25rem' }}>💳</span>
                  </div>
                  <strong style={{ fontSize: '2rem', display: 'block', margin: '12px 0 6px', color: '#fff' }}>
                    {stats.memberships.active} <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-muted)' }}>activas</span>
                  </strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span>Próximos vencimientos (7d): <b style={{ color: 'var(--brand-danger)' }}>{stats.memberships.nearExpiration}</b></span>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Vencidas: <b>{stats.memberships.expired}</b></span>
                    <span>Renovaciones: <b>{stats.memberships.renewals}</b></span>
                    <span>Canceladas: <b>{stats.memberships.cancellations}</b></span>
                  </div>
                </Card>

                {/* CARD 3: PAGOS */}
                <Card style={{ borderLeft: '4px solid var(--brand-success)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Pagos & Facturación</h3>
                    <span style={{ fontSize: '1.25rem' }}>💵</span>
                  </div>
                  <strong style={{ fontSize: '2rem', display: 'block', margin: '12px 0 6px', color: 'var(--brand-success-light)' }}>
                    ${stats.payments.totalRevenue.toLocaleString('es-AR')} ARS
                  </strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span>Proyección mensual: <b>${stats.payments.monthlyRevenue.toLocaleString('es-AR')}</b></span>
                    <span>•</span>
                    <span>Anual: <b>${stats.payments.annualRevenue.toLocaleString('es-AR')}</b></span>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Aprobados: <b style={{ color: 'var(--brand-success)' }}>{stats.payments.approved}</b></span>
                    <span>Pendientes: <b>{stats.payments.pending}</b></span>
                    <span>Rechazados: <b style={{ color: 'var(--brand-danger)' }}>{stats.payments.rejected}</b></span>
                  </div>
                </Card>

                {/* CARD 4: CONTENIDO */}
                <Card style={{ borderLeft: '4px solid var(--brand-info)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Contenido del Sistema</h3>
                    <span style={{ fontSize: '1.25rem' }}>📦</span>
                  </div>
                  <strong style={{ fontSize: '2rem', display: 'block', margin: '12px 0 6px', color: '#fff' }}>
                    {stats.content.budgets} <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-muted)' }}>presupuestos</span>
                  </strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: '12px' }}>
                    <span>Rubros: <b>{stats.content.professions}</b></span>
                    <span>Servicios: <b>{stats.content.services}</b></span>
                    <span>Clientes: <b>{stats.content.clients}</b></span>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '0.73rem', background: 'rgba(99, 102, 241, 0.05)', color: 'var(--brand-primary-light)', padding: '6px', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                    Actividad de profesionales en tiempo real
                  </div>
                </Card>
              </div>

              {/* Sección Gráficos Nativos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                
                {/* Grafico 1: Crecimiento de Registros e Ingresos (oculto) */}
                {false && <Card>
                  <h3 style={{ fontSize: '1rem', fontWeight: '750', marginBottom: '20px' }}>📈 Evolución Trimestral de Registros</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '10px 0' }}>
                    {stats.graphs.monthlyData.map(item => (
                      <div key={item.month} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ width: '40px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{item.month}</span>
                        <div style={{ flex: '1', background: 'var(--bg-app)', height: '22px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                          <div 
                            style={{ 
                              background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-accent))', 
                              height: '100%', 
                              width: `${Math.min(100, Math.max(8, (item.users / 50) * 100))}%`,
                              transition: 'width 1s ease-in-out',
                              display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '8px'
                            }}
                          >
                            <span style={{ fontSize: '0.7rem', color: '#000', fontWeight: '900' }}>{item.users}</span>
                          </div>
                        </div>
                        <span style={{ width: '80px', fontSize: '0.8rem', color: 'var(--brand-success-light)', textAlign: 'right', fontWeight: 'bold' }}>
                          ${item.revenue.toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '10px' }}>
                    <span>Regs. Máximos: 50 usuarios</span>
                    <span>Ancho relativo al máximo</span>
                  </div>
                </Card>}

                {/* Grafico 2: Rubros Profesionales más utilizados (oculto) */}
                {false && <Card>
                  <h3 style={{ fontSize: '1rem', fontWeight: '750', marginBottom: '20px' }}>🏆 Rubros Profesionales más Registrados</h3>
                  {stats.graphs.professions.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: '40px' }}>
                      No se registraron profesionales con rubros declarados aún.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {stats.graphs.professions.map((prof, idx) => (
                        <div key={prof.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600' }}>
                            <span>{idx + 1}. {prof.name}</span>
                            <span style={{ color: 'var(--brand-primary-light)' }}>{prof.count} profesionales</span>
                          </div>
                          <div style={{ background: 'var(--bg-app)', height: '10px', borderRadius: '4px', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                background: 'var(--brand-primary)', 
                                height: '100%', 
                                width: `${(prof.count / Math.max(1, stats.graphs.professions[0].count)) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>}

                {/* Grafico 3: Ciudades Populares */}
                <Card style={{ gridColumn: '1 / -1' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '750', marginBottom: '20px' }}>📍 Geografía: Ciudades con Mayor Presencia</h3>
                  {stats.graphs.cities.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
                      Sin datos de residencia.
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                      {stats.graphs.cities.map(item => (
                        <div key={item.city} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                          <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '6px' }}>🏙️</span>
                          <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px', textTransform: 'capitalize' }}>
                            {item.city}
                          </strong>
                          <span style={{ fontSize: '0.82rem', color: 'var(--brand-primary-light)', fontWeight: 'bold' }}>
                            {item.count} registrado{item.count > 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RENDER TAB 2: GESTION USUARIOS */}
      {activeTab === 'users' && (
        <div>
          {/* Panel Filtros */}
          <Card style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '750', marginBottom: '16px' }}>🔍 Filtros de Búsqueda</h3>
            <form onSubmit={handleApplyFilters} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label className="field-label" style={{ display: 'block', marginBottom: '4px' }}>Nombre</label>
                <input 
                  type="text" 
                  value={searchName} 
                  onChange={e => setSearchName(e.target.value)} 
                  placeholder="Ej: Juan Pérez"
                  className="main-search-input"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', width: '100%', padding: '10px', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div>
                <label className="field-label" style={{ display: 'block', marginBottom: '4px' }}>Email</label>
                <input 
                  type="text" 
                  value={searchEmail} 
                  onChange={e => setSearchEmail(e.target.value)} 
                  placeholder="Ej: test@email.com"
                  className="main-search-input"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', width: '100%', padding: '10px', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div>
                <label className="field-label" style={{ display: 'block', marginBottom: '4px' }}>Profesión</label>
                <input 
                  type="text" 
                  value={searchProfession} 
                  onChange={e => setSearchProfession(e.target.value)} 
                  placeholder="Ej: Gasista"
                  className="main-search-input"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', width: '100%', padding: '10px', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div>
                <label className="field-label" style={{ display: 'block', marginBottom: '4px' }}>Ciudad</label>
                <input 
                  type="text" 
                  value={searchCity} 
                  onChange={e => setSearchCity(e.target.value)} 
                  placeholder="Ej: Mendoza"
                  className="main-search-input"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', width: '100%', padding: '10px', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div>
                <label className="field-label" style={{ display: 'block', marginBottom: '4px' }}>Plan</label>
                <select 
                  value={filterPlan} 
                  onChange={e => setFilterPlan(e.target.value)}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', width: '100%', padding: '10px', borderRadius: '6px', color: '#fff', outline: 'none' }}
                >
                  <option value="">Todos los planes</option>
                  <option value="FREE">Gratuito (FREE)</option>
                  <option value="VIP">VIP Platinum</option>
                </select>
              </div>

              <div>
                <label className="field-label" style={{ display: 'block', marginBottom: '4px' }}>Estado</label>
                <select 
                  value={filterStatus} 
                  onChange={e => setFilterStatus(e.target.value)}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', width: '100%', padding: '10px', borderRadius: '6px', color: '#fff', outline: 'none' }}
                >
                  <option value="">Todos los estados</option>
                  <option value="ACTIVE">Activo</option>
                  <option value="SUSPENDED">Suspendido</option>
                  <option value="INACTIVE">Inactivo (Inhabilitado)</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <Button type="button" onClick={handleClearFilters} variant="secondary">Limpiar filtros</Button>
                <Button type="submit" variant="primary">Aplicar filtros</Button>
              </div>
            </form>
          </Card>

          {/* Tabla / Lista de usuarios */}
          {usersLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div className="spinner"></div>
            </div>
          ) : usersError ? (
            <div className="alert alert-error">{usersError}</div>
          ) : users.length === 0 ? (
            <div className="no-results-card">
              <span className="no-results-icon">👥</span>
              <h3>No se encontraron usuarios</h3>
              <p>Revisa los filtros de búsqueda e intenta nuevamente.</p>
            </div>
          ) : (
            <div>
              {/* Contenedor responsivo tabla */}
              <div style={{ overflowX: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '9px 12px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Nombre</th>
                      <th style={{ padding: '9px 12px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Email</th>
                      <th style={{ padding: '9px 12px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Tipo</th>
                      <th style={{ padding: '9px 12px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Estado</th>
                      <th style={{ padding: '9px 12px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Registro</th>
                      <th style={{ padding: '9px 12px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background var(--transition)' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#fff', fontSize: '0.82rem' }}>{u.name}</td>
                        <td style={{ padding: '8px 12px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span className={`badge ${u.userType === 'VIP' ? 'badge-warning' : 'badge-default'}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                            {u.userType}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span className={`badge ${u.status === 'ACTIVE' ? 'badge-success' : u.status === 'SUSPENDED' ? 'badge-danger' : 'badge-default'}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                            {u.status === 'ACTIVE' ? '🟢 Activo' : u.status === 'SUSPENDED' ? '🔴 Suspendido' : '⚪ Inactivo'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(u.createdAt)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => { setSelectedUser(u); setShowDetailModal(true); }}
                              style={{ padding: '4px 8px', fontSize: '0.7rem', fontWeight: 600, borderRadius: '5px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap' }}
                            >
                              🔍 Ver
                            </button>

                            {u.role === 'ADMIN' ? (
                              <button
                                onClick={() => triggerRoleChange(u, 'USER')}
                                style={{ padding: '4px 8px', fontSize: '0.7rem', fontWeight: 600, borderRadius: '5px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'transparent', color: '#f87171', cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap' }}
                              >
                                🛡️ Quitar Admin
                              </button>
                            ) : (
                              <button
                                onClick={() => triggerRoleChange(u, 'ADMIN')}
                                style={{ padding: '4px 8px', fontSize: '0.7rem', fontWeight: 600, borderRadius: '5px', border: '1px solid rgba(99, 102, 241, 0.25)', background: 'transparent', color: 'var(--brand-primary-light)', cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap' }}
                              >
                                🛡️ Hacer Admin
                              </button>
                            )}

                            {u.status === 'ACTIVE' ? (
                              <button
                                onClick={() => triggerStatusChange(u, 'SUSPENDED')}
                                style={{ padding: '4px 8px', fontSize: '0.7rem', fontWeight: 600, borderRadius: '5px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'transparent', color: '#f87171', cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap' }}
                              >
                                ⛔ Suspender
                              </button>
                            ) : (
                              <button
                                onClick={() => triggerStatusChange(u, 'ACTIVE')}
                                style={{ padding: '4px 8px', fontSize: '0.7rem', fontWeight: 600, borderRadius: '5px', border: '1px solid rgba(16, 185, 129, 0.2)', background: 'transparent', color: '#34d399', cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap' }}
                              >
                                ✅ Activar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Botones de Paginacion */}
              {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Mostrando página <b>{pagination.page}</b> de <b>{pagination.totalPages}</b> ({pagination.total} usuarios totales)
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                      disabled={page === 1} 
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      variant="secondary"
                    >
                      Anterior
                    </Button>
                    <Button 
                      disabled={page === pagination.totalPages} 
                      onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                      variant="secondary"
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* RENDER TAB 3: GESTION MEMBRESÍAS */}
      {activeTab === 'memberships' && (
        <div>
          {/* Panel Filtros de Membresía */}
          <Card style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '750', marginBottom: '16px' }}>🔍 Filtros de Membresías</h3>
            <form onSubmit={handleApplyMemFilters} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label className="field-label" style={{ display: 'block', marginBottom: '4px' }}>Nombre</label>
                <input 
                  type="text" 
                  value={memFilters.name} 
                  onChange={e => setMemFilters(prev => ({ ...prev, name: e.target.value }))} 
                  placeholder="Ej: Juan Pérez"
                  className="main-search-input"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', width: '100%', padding: '10px', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div>
                <label className="field-label" style={{ display: 'block', marginBottom: '4px' }}>Email</label>
                <input 
                  type="text" 
                  value={memFilters.email} 
                  onChange={e => setMemFilters(prev => ({ ...prev, email: e.target.value }))} 
                  placeholder="Ej: test@email.com"
                  className="main-search-input"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', width: '100%', padding: '10px', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div>
                <label className="field-label" style={{ display: 'block', marginBottom: '4px' }}>Estado de Plan</label>
                <select 
                  value={memFilters.filterType} 
                  onChange={e => setMemFilters(prev => ({ ...prev, filterType: e.target.value }))}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', width: '100%', padding: '10px', borderRadius: '6px', color: '#fff', outline: 'none' }}
                >
                  <option value="">Todos los estados</option>
                  <option value="ACTIVE">VIP activos 🟢</option>
                  <option value="EXPIRED">VIP vencidos 🔴</option>
                  <option value="FREE">Plan FREE 🟡</option>
                  <option value="EXPIRING">Próximos vencimientos (7 días)</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <Button type="button" onClick={handleClearMemFilters} variant="secondary">Limpiar filtros</Button>
                <Button type="submit" variant="primary">Aplicar filtros</Button>
              </div>
            </form>
          </Card>

          {/* Tabla / Lista de membresías */}
          {membershipsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div className="spinner"></div>
            </div>
          ) : membershipsError ? (
            <div className="alert alert-error">{membershipsError}</div>
          ) : memberships.length === 0 ? (
            <div className="no-results-card">
              <span className="no-results-icon">💳</span>
              <h3>No se encontraron registros de membresías</h3>
              <p>Revisa los filtros de búsqueda e intenta nuevamente.</p>
            </div>
          ) : (
            <div>
              <div style={{ overflowX: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '750px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '9px 12px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Usuario</th>
                      <th style={{ padding: '9px 12px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Email</th>
                      <th style={{ padding: '9px 12px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Plan</th>
                      <th style={{ padding: '9px 12px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Estado</th>
                      <th style={{ padding: '9px 12px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Vencimiento</th>
                      <th style={{ padding: '9px 12px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Días</th>
                      <th style={{ padding: '9px 12px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Último Pago</th>
                      <th style={{ padding: '9px 12px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberships.map(m => (
                      <tr key={m.userId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background var(--transition)' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#fff', fontSize: '0.82rem' }}>{m.userName}</td>
                        <td style={{ padding: '8px 12px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{m.userEmail}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span className={`badge ${m.planType === 'VIP' ? 'badge-warning' : 'badge-default'}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                            {m.planType}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span className={`badge ${m.status === 'ACTIVE' ? 'badge-success' : m.status === 'EXPIRED' ? 'badge-danger' : 'badge-default'}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                            {m.status === 'ACTIVE' ? '🟢 Activo' : m.status === 'EXPIRED' ? '🔴 Vencido' : '🟡 Pendiente'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.endDate ? formatDate(m.endDate) : '—'}</td>
                        <td style={{ padding: '8px 12px', fontSize: '0.78rem', fontWeight: 600, color: m.daysRemaining <= 7 && m.status === 'ACTIVE' ? '#f87171' : 'var(--text-primary)' }}>
                          {m.status === 'ACTIVE' ? `${m.daysRemaining}d` : '—'}
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: '0.75rem' }}>
                          {m.lastPaymentAmount ? (
                            <span style={{ color: '#34d399', fontWeight: 600 }}>${m.lastPaymentAmount.toLocaleString('es-AR')}</span>
                          ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleViewMembership(m.userId)}
                              style={{ padding: '4px 8px', fontSize: '0.7rem', fontWeight: 600, borderRadius: '5px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap' }}
                            >
                              🔍 Detalle
                            </button>
                            {m.planType === 'VIP' ? (
                              <>
                                <button
                                  onClick={() => { setExtendDays('30'); triggerMemAction('extend', m.userId, m.userName); }}
                                  style={{ padding: '4px 8px', fontSize: '0.7rem', fontWeight: 600, borderRadius: '5px', border: '1px solid rgba(99, 102, 241, 0.25)', background: 'transparent', color: 'var(--brand-primary-light)', cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap' }}
                                >
                                  📆 Extender
                                </button>
                                <button
                                  onClick={() => triggerMemAction('deactivate', m.userId, m.userName)}
                                  style={{ padding: '4px 8px', fontSize: '0.7rem', fontWeight: 600, borderRadius: '5px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'transparent', color: '#f87171', cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap' }}
                                >
                                  ↓ FREE
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => triggerMemAction('activate', m.userId, m.userName)}
                                style={{ padding: '4px 8px', fontSize: '0.7rem', fontWeight: 600, borderRadius: '5px', border: '1px solid rgba(16, 185, 129, 0.2)', background: 'transparent', color: '#34d399', cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap' }}
                              >
                                ↑ Activar VIP
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Botones de Paginacion */}
              {memPagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Mostrando página <b>{memPagination.page}</b> de <b>{memPagination.totalPages}</b> ({memPagination.total} membresías totales)
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                      disabled={page === 1} 
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      variant="secondary"
                    >
                      Anterior
                    </Button>
                    <Button 
                      disabled={page === memPagination.totalPages} 
                      onClick={() => setPage(prev => Math.min(memPagination.totalPages, prev + 1))}
                      variant="secondary"
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL DETALLE DE MEMBRESÍA Y PAGOS */}
      {showMemDetailModal && selectedMembership && (
        <div className="modal-overlay" onClick={() => setShowMemDetailModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2 className="modal-title">💳 Historial y Ficha de Membresía</h2>
              <button className="modal-close" onClick={() => setShowMemDetailModal(false)}>✕</button>
            </div>
            
            <div className="modal-body" style={{ color: 'var(--text-primary)' }}>
              {/* Info de usuario */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', margin: '0 0 4px' }}>{selectedMembership.user.name}</h3>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  📧 {selectedMembership.user.email} | 🛠️ Rubros: {selectedMembership.user.professions.join(', ') || '(Ninguno)'}
                </p>
              </div>

              {/* Info de membresia */}
              <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Estado actual del plan</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Plan:</span>
                    <strong style={{ fontSize: '0.95rem' }}>{selectedMembership.plan.planType}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Estado:</span>
                    <strong style={{ fontSize: '0.95rem' }}>
                      {selectedMembership.plan.status === 'ACTIVE' ? 'Activo 🟢' : selectedMembership.plan.status === 'EXPIRED' ? 'Vencido 🔴' : 'FREE 🟡'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Inicio:</span>
                    <span style={{ fontSize: '0.9rem' }}>{selectedMembership.plan.startDate ? formatDate(selectedMembership.plan.startDate) : '—'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Vencimiento:</span>
                    <span style={{ fontSize: '0.9rem' }}>{selectedMembership.plan.endDate ? formatDate(selectedMembership.plan.endDate) : '—'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Días Restantes:</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>{selectedMembership.plan.daysRemaining} días</span>
                  </div>
                </div>
              </div>

              {/* Registro de pagos */}
              <div>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Historial de Pagos (PaymentTransaction)</h4>
                {selectedMembership.payments.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontStyle: 'italic', padding: '10px 0' }}>
                    No se registran transacciones de pago para este profesional.
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto', maxHeight: '200px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '10px' }}>ID MP</th>
                          <th style={{ padding: '10px' }}>Monto</th>
                          <th style={{ padding: '10px' }}>Método</th>
                          <th style={{ padding: '10px' }}>Fecha</th>
                          <th style={{ padding: '10px' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMembership.payments.map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px 10px', color: 'var(--brand-primary-light)' }}>{p.mercadoPagoPaymentId}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 'bold' }}>${p.amount.toLocaleString('es-AR')}</td>
                            <td style={{ padding: '8px 10px' }}>{p.paymentMethod || 'manual'}</td>
                            <td style={{ padding: '8px 10px' }}>{formatDate(p.createdAt)}</td>
                            <td style={{ padding: '8px 10px' }}>
                              <span className={`badge ${p.status === 'approved' ? 'badge-success' : 'badge-default'}`} style={{ fontSize: '0.67rem', padding: '2px 6px' }}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', marginTop: '20px', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowMemDetailModal(false)} variant="secondary">Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION ACTION MODAL FOR MEMBERSHIP */}
      {confirmMemAction.show && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2 className="modal-title">⚠️ Confirmar Acción sobre Membresía</h2>
            </div>
            <div className="modal-body" style={{ color: 'var(--text-primary)' }}>
              {confirmMemAction.type === 'activate' ? (
                <p>
                  ¿Estás seguro de que querés <strong>ACTIVAR</strong> manualmente el acceso VIP para <strong>{confirmMemAction.userName}</strong>?<br/>
                  Esto le otorgará 30 días de membresía VIP con almacenamiento ilimitado a partir de hoy.
                </p>
              ) : confirmMemAction.type === 'deactivate' ? (
                <p>
                  ¿Estás seguro de que querés <strong>DESACTIVAR</strong> el plan VIP para <strong>{confirmMemAction.userName}</strong>?<br/>
                  Su cuenta revertirá inmediatamente a plan FREE y se aplicarán los límites del sistema.
                </p>
              ) : confirmMemAction.type === 'extend' ? (
                <div>
                  <p>
                    ¿Estás seguro de que querés <strong>EXTENDER</strong> la membresía VIP de <strong>{confirmMemAction.userName}</strong>?
                  </p>
                  <div style={{ marginTop: '12px' }}>
                    <label className="field-label" style={{ display: 'block', marginBottom: '6px' }}>Elegir días a extender:</label>
                    <select 
                      value={extendDays} 
                      onChange={e => setExtendDays(e.target.value)}
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', width: '100%', padding: '10px', borderRadius: '6px', color: '#fff', outline: 'none' }}
                    >
                      <option value="7">7 días</option>
                      <option value="15">15 días</option>
                      <option value="30">30 días (1 Mes)</option>
                      <option value="90">90 días (3 Meses)</option>
                      <option value="365">365 días (1 Año)</option>
                    </select>
                  </div>
                </div>
              ) : null}

              {actionError && (
                <div className="alert alert-error" style={{ marginTop: '14px' }}>
                  {actionError}
                </div>
              )}
            </div>
            
            <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Button 
                onClick={() => { setConfirmMemAction({ type: '', targetUserId: null, userName: '', show: false }); setActionError(''); }}
                disabled={actionSubmitting} 
                variant="secondary"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmMemActionSubmit} 
                disabled={actionSubmitting} 
                variant="primary"
                style={{
                  background: confirmMemAction.type === 'deactivate' ? 'var(--brand-danger)' : 'var(--brand-primary)',
                  borderColor: confirmMemAction.type === 'deactivate' ? 'var(--brand-danger)' : 'var(--brand-primary)'
                }}
              >
                {actionSubmitting ? 'Procesando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE PERFIL */}
      {showDetailModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">👤 Ficha de Profesional</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            
            <div className="modal-body" style={{ color: 'var(--text-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: `2px solid ${selectedUser.userType === 'VIP' ? '#f59e0b' : 'var(--border-color)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {selectedUser.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 4px' }}>{selectedUser.name}</h3>
                  <span style={{ color: 'var(--brand-primary-light)' }}>@{selectedUser.username}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <span className="field-label" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Email</span>
                  <span style={{ fontSize: '0.92rem' }}>{selectedUser.email}</span>
                </div>
                <div>
                  <span className="field-label" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Teléfono</span>
                  <span style={{ fontSize: '0.92rem' }}>{selectedUser.phone || '—'}</span>
                </div>
                <div>
                  <span className="field-label" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Residencia</span>
                  <span style={{ fontSize: '0.92rem' }}>{selectedUser.city || '—'}, {selectedUser.locality || '—'}</span>
                </div>
                <div>
                  <span className="field-label" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Fecha Registro</span>
                  <span style={{ fontSize: '0.92rem' }}>{formatDate(selectedUser.createdAt)}</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>💳 Información de Plan y Membresía</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Membresía actual (Rol):</span>
                    <strong style={{ display: 'block', fontSize: '1rem', color: selectedUser.userType === 'VIP' ? '#f59e0b' : 'var(--text-primary)' }}>
                      {selectedUser.userType === 'VIP' ? 'Platinum VIP ⭐' : 'Plan Básico (FREE)'}
                      <span style={{ fontSize: '0.8rem', color: 'var(--brand-primary-light)', marginLeft: '6px' }}>({selectedUser.role})</span>
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Estado Plan:</span>
                    <span style={{ display: 'block' }}>
                      <span className={`badge ${selectedUser.membership?.status === 'ACTIVE' ? 'badge-success' : 'badge-default'}`}>
                        {selectedUser.membership?.status || 'Libre'}
                      </span>
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Inicio:</span>
                    <span style={{ display: 'block', fontSize: '0.88rem' }}>
                      {selectedUser.membership?.startDate ? formatDate(selectedUser.membership.startDate) : '—'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Vencimiento:</span>
                    <span style={{ display: 'block', fontSize: '0.88rem' }}>
                      {selectedUser.userType === 'VIP' && selectedUser.membership?.endDate
                        ? formatDate(selectedUser.membership.endDate)
                        : 'Sin vencimiento'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>🏅 Profesiones Registradas</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedUser.professions.length === 0 ? (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem' }}>No posee rubros creados.</span>
                  ) : (
                    selectedUser.professions.map(p => (
                      <span key={p} className="profession-tag">{p}</span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', marginTop: '20px', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowDetailModal(false)} variant="secondary">Cerrar ficha</Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION ACTION MODAL */}
      {confirmAction.show && actionUser && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2 className="modal-title">⚠️ Confirmar Cambio</h2>
            </div>
            <div className="modal-body" style={{ color: 'var(--text-primary)' }}>
              {confirmAction.type === 'role' ? (
                <p>
                  ¿Estás seguro de que querés cambiar el rol de <strong>{actionUser.name}</strong> a <strong>{confirmAction.value}</strong>?
                  {confirmAction.value === 'ADMIN' ? (
                    <span style={{ display: 'block', marginTop: '10px', fontSize: '0.85rem', color: 'var(--brand-success)' }}>
                      Esto le otorgará privilegios totales de administración. Podrá acceder a la consola, suspender usuarios o alternar roles.
                    </span>
                  ) : (
                    <span style={{ display: 'block', marginTop: '10px', fontSize: '0.85rem', color: 'var(--brand-danger-light)' }}>
                      Esto le revocará el acceso administrativo y volverá a ser un usuario estándar (USER).
                    </span>
                  )}
                </p>
              ) : confirmAction.type === 'plan' ? (
                <p>
                  ¿Estás seguro de que querés cambiar el plan de <strong>{actionUser.name}</strong> a <strong>{confirmAction.value}</strong>?
                  {confirmAction.value === 'VIP' ? (
                    <span style={{ display: 'block', marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Esto habilitará el plan VIP por <b>30 días</b> de almacenamiento sin restricciones técnicas.
                    </span>
                  ) : (
                    <span style={{ display: 'block', marginTop: '10px', fontSize: '0.85rem', color: 'var(--brand-danger-light)' }}>
                       Esto revertirá la cuenta del usuario a FREE, aplicando limitaciones inmediatas.
                    </span>
                  )}
                </p>
              ) : (
                <p>
                  ¿Estás seguro de cambiar el estado de cuenta de <strong>{actionUser.name}</strong> a <strong>{confirmAction.value}</strong>?
                  {confirmAction.value === 'SUSPENDED' && (
                    <span style={{ display: 'block', marginTop: '10px', fontSize: '0.85rem', color: 'var(--brand-danger-light)', fontWeight: 'bold' }}>
                      El usuario ya no podrá iniciar sesión en la aplicación ni generar presupuestos.
                    </span>
                  )}
                </p>
              )}

              {actionError && (
                <div className="alert alert-error" style={{ marginTop: '14px' }}>
                  {actionError}
                </div>
              )}
            </div>
            
            <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Button 
                onClick={() => { setConfirmAction({ type: '', value: '', show: false }); setActionUser(null); setActionError(''); }}
                disabled={actionSubmitting} 
                variant="secondary"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmActionSubmit} 
                disabled={actionSubmitting} 
                variant="primary"
                style={{
                  background: confirmAction.value === 'SUSPENDED' ? 'var(--brand-danger)' : 'var(--brand-primary)',
                  borderColor: confirmAction.value === 'SUSPENDED' ? 'var(--brand-danger)' : 'var(--brand-primary)'
                }}
              >
                {actionSubmitting ? 'Procesando...' : 'Confirmar Cambio'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
