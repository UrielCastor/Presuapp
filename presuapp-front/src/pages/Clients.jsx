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
  const [loadingData, setLoadingData] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');

  const fetchClients = async () => {
    try {
      const res = await axiosInstance.get('/clients');
      setClients(res.data.data || []);
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
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('El nombre es obligatorio.');
      return;
    }
    if (user?.userType === 'FREE' && clients.length >= 50) {
      setFormError('Has alcanzado el límite de tu plan FREE. Actualizá a VIP para seguir creando elementos.');
      return;
    }
    setSubmitting(true);
    try {
      await axiosInstance.post('/clients', form);
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

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {user?.userType === 'FREE' && clients.length >= 50 && (
        <div className="alert alert-warning" role="alert" style={{ marginBottom: '20px' }}>
          <span className="alert-icon">💡</span>
          Has alcanzado el límite de tu plan FREE (Máximo 50 clientes). Actualizá a VIP para seguir creando elementos.
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
              <div className="client-card-details">
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
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuevo Cliente"
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
            <label className="form-label">Notas</label>
            <textarea
              name="notes"
              className="form-input form-textarea"
              placeholder="Información adicional..."
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
              Guardar Cliente
            </Button>
          </div>
        </form>
      </Modal>
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
