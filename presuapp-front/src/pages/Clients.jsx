import { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Loading from '../components/Loading';
import { useAuth } from '../hooks/useAuth';

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

export default function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteWarning, setDeleteWarning] = useState('');
  const [search, setSearch] = useState('');

  const fetchClients = async () => {
    try {
      const [clientsRes, budgetsRes] = await Promise.all([
        axiosInstance.get('/clients'),
        axiosInstance.get('/budgets'),
      ]);
      setClients(clientsRes.data.data || []);
      setBudgets(budgetsRes.data.data || []);
    } catch {
      setError('Error al cargar clientes.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
  };

  const handleOpenModal = () => {
    setEditingClient(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const handleEditClick = (client) => {
    setSuccessMessage('');
    setDeleteWarning('');
    setEditingClient(client);
    setForm({
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      notes: client.notes || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleDeleteClick = (client) => {
    setSuccessMessage('');
    setDeleteWarning('');
    // Filtrar si el cliente posee presupuestos
    const associated = budgets.filter((b) => b.clientId === client.id);
    if (associated.length > 0) {
      setDeleteWarning(`No es posible eliminar al cliente "${client.name}" porque posee ${associated.length} presupuesto(s) asociado(s) (Ej: Presupuesto #${associated[0].id}). Para mantener la consistencia histórica de la base de datos, debés eliminar primero todos sus presupuestos asociados.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setClientToDelete(client);
      setDeleteConfirmOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    setSubmitting(true);
    try {
      await axiosInstance.delete(`/clients/${clientToDelete.id}`);
      setSuccessMessage(`Cliente "${clientToDelete.name}" eliminado con éxito.`);
      setDeleteConfirmOpen(false);
      setClientToDelete(null);
      fetchClients();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el cliente.');
      setDeleteConfirmOpen(false);
      setClientToDelete(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('El nombre es obligatorio.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email.trim() && !emailRegex.test(form.email.trim())) {
      setFormError('El correo electrónico ingresado no es válido.');
      return;
    }

    const phoneRegex = /^[0-9+\s\-()]+$/;
    if (form.phone.trim() && !phoneRegex.test(form.phone.trim())) {
      setFormError('El teléfono ingresado contiene caracteres inválidos. Solo se permiten números, espacios, +, paréntesis y guiones.');
      return;
    }
    
    // Validar límite para plan FREE en creación nueva
    if (!editingClient && user?.userType === 'FREE' && clients.length >= 50) {
      setFormError('Has alcanzado el límite de tu plan FREE. Actualizá a Premium para seguir creando elementos.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingClient) {
        // Modo Edición
        await axiosInstance.put(`/clients/${editingClient.id}`, form);
        setSuccessMessage(`Cliente "${form.name}" actualizado correctamente.`);
      } else {
        // Modo Creación
        await axiosInstance.post('/clients', form);
        setSuccessMessage(`Cliente "${form.name}" guardado correctamente.`);
      }
      setModalOpen(false);
      fetchClients();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al guardar el cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = clients.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  if (loadingData) return <Loading message="Cargando clientes..." />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clients.length} clientes registrados</p>
        </div>
        <Button variant="primary" onClick={handleOpenModal}>
          + Agregar Cliente
        </Button>
      </div>

      {successMessage && (
        <div className="alert alert-success" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="alert-icon">✅</span>
          {successMessage}
        </div>
      )}

      {deleteWarning && (
        <div className="alert alert-warning" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', border: '1px dashed rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span>⚠️ Regla de Integridad de Datos</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>{deleteWarning}</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {user?.userType === 'FREE' && clients.length >= 50 && (
        <div className="alert alert-warning" role="alert" style={{ marginBottom: '20px' }}>
          <span className="alert-icon">💡</span>
          Has alcanzado el límite de tu plan FREE (Máximo 50 clientes). Actualizá a Premium para seguir creando elementos.
        </div>
      )}

      {/* Search */}
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por nombre, email o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Desktop table */}
      <div className="table-wrapper hide-mobile">
        {filtered.length === 0 ? (
          <EmptyState onAdd={handleOpenModal} />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección</th>
                <th>Notas</th>
                <th className="text-center" style={{ width: '180px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="client-name-cell">
                      <div className="client-avatar">
                        {c.name[0].toUpperCase()}
                      </div>
                      {c.name}
                    </div>
                  </td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.address || '—'}</td>
                  <td className="notes-cell">{c.notes || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditClick(c)}
                        style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                      >
                        ✏️ Editar
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleDeleteClick(c)}
                      >
                        🗑️ Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile cards */}
      <div className="card-list show-mobile">
        {filtered.length === 0 ? (
          <EmptyState onAdd={handleOpenModal} />
        ) : (
          filtered.map((c) => (
            <Card key={c.id} className="client-card">
              <div className="client-card-header">
                <div className="client-avatar large">
                  {c.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="client-card-name">{c.name}</h3>
                  {c.email && <p className="client-card-email">{c.email}</p>}
                </div>
              </div>
              <div className="client-card-details" style={{ marginBottom: '16px' }}>
                {c.phone && (
                  <div className="detail-row">
                    <span className="detail-icon">📞</span>
                    <a href={`tel:${c.phone}`} className="detail-link">{c.phone}</a>
                  </div>
                )}
                {c.address && (
                  <div className="detail-row">
                    <span className="detail-icon">📍</span>
                    <span>{c.address}</span>
                  </div>
                )}
                {c.notes && (
                  <div className="detail-row">
                    <span className="detail-icon">📝</span>
                    <span>{c.notes}</span>
                  </div>
                )}
              </div>
              {/* Mobile Actions */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  fullWidth
                  onClick={() => handleEditClick(c)}
                  style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                >
                  ✏️ Editar
                </Button>
                <Button 
                  variant="danger" 
                  size="sm" 
                  fullWidth
                  onClick={() => handleDeleteClick(c)}
                >
                  🗑️ Eliminar
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClient ? '✏️ Editar Cliente' : 'Nuevo Cliente'}
        size="md"
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input
              name="name"
              type="text"
              className="form-input"
              placeholder="Juan García"
              value={form.name}
              onChange={handleChange}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input
              name="phone"
              type="tel"
              className="form-input"
              placeholder="+54 9 11 1234-5678"
              value={form.phone}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              name="email"
              type="email"
              className="form-input"
              placeholder="cliente@email.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input
              name="address"
              type="text"
              className="form-input"
              placeholder="Av. Corrientes 1234, CABA"
              value={form.address}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Observaciones / Notas</label>
            <textarea
              name="notes"
              className="form-input form-textarea"
              placeholder="Información adicional o condiciones particulares..."
              value={form.notes}
              onChange={handleChange}
              rows={3}
            />
          </div>

          {formError && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              {formError}
            </div>
          )}

          <div className="modal-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingClient ? 'Guardar Cambios' : 'Guardar Cliente'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && clientToDelete && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">Confirmar Eliminación</h2>
              <button className="modal-close" onClick={() => setDeleteConfirmOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '20px 0' }}>
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                ¿Está seguro de eliminar al cliente <strong>{clientToDelete.name}</strong>?
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
                Esta acción no se puede deshacer de forma directa.
              </p>
            </div>
            <div className="modal-actions" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
              <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleConfirmDelete} loading={submitting}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">👥</div>
      <p className="empty-text">No hay clientes todavía</p>
      <Button variant="primary" onClick={onAdd}>
        Agregar primer cliente
      </Button>
    </div>
  );
}
