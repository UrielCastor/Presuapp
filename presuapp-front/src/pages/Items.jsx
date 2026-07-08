import { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Loading from '../components/Loading';
import { useAuth } from '../hooks/useAuth';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  professionId: '',
};

export default function Items() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const fetchAll = async () => {
    try {
      const [itemsRes, professionsRes] = await Promise.all([
        axiosInstance.get('/items'),
        axiosInstance.get('/professions'),
      ]);
      setItems(itemsRes.data.data || []);
      setProfessions(professionsRes.data.data || []);
    } catch {
      setError('Error al cargar los servicios.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

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
    if (!form.price || isNaN(parseFloat(form.price))) {
      setFormError('El precio debe ser un número válido.');
      return;
    }
    if (user?.userType === 'FREE' && items.length >= 20) {
      setFormError('Has alcanzado el límite de tu plan FREE. Actualizá a VIP para seguir creando elementos.');
      return;
    }
    setSubmitting(true);
    try {
      await axiosInstance.post('/items', {
        ...form,
        price: parseFloat(form.price),
        professionId: form.professionId ? parseInt(form.professionId) : undefined,
      });
      setModalOpen(false);
      fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al guardar el servicio.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount || 0);

  if (loadingData) return <Loading message="Cargando servicios..." />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Servicios</h1>
          <p className="page-subtitle">{items.length} servicios disponibles</p>
        </div>
        <Button variant="primary" onClick={handleOpenModal}>
          + Agregar Servicio
        </Button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {user?.userType === 'FREE' && items.length >= 20 && (
        <div className="alert alert-warning" role="alert" style={{ marginBottom: '20px' }}>
          <span className="alert-icon">💡</span>
          Has alcanzado el límite de tu plan FREE (Máximo 20 servicios). Actualizá a VIP para seguir creando elementos.
        </div>
      )}

      {/* Desktop table */}
      <div className="table-wrapper hide-mobile">
        {items.length === 0 ? (
          <EmptyState onAdd={handleOpenModal} />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Profesión</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="item-name-cell">
                      <div className="item-icon">🔧</div>
                      {item.name}
                    </div>
                  </td>
                  <td className="notes-cell">{item.description || '—'}</td>
                  <td>
                    {item.profession ? (
                      <span className="badge badge-info">{item.profession.name}</span>
                    ) : '—'}
                  </td>
                  <td className="price-cell">{formatCurrency(item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile cards */}
      <div className="card-list show-mobile">
        {items.length === 0 ? (
          <EmptyState onAdd={handleOpenModal} />
        ) : (
          items.map((item) => (
            <Card key={item.id} className="item-card">
              <div className="item-card-header">
                <div className="item-icon large">🔧</div>
                <div>
                  <h3 className="item-card-name">{item.name}</h3>
                  {item.profession && (
                    <span className="badge badge-info">{item.profession.name}</span>
                  )}
                </div>
                <span className="item-price">{formatCurrency(item.price)}</span>
              </div>
              {item.description && (
                <p className="item-description">{item.description}</p>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuevo Servicio"
        size="md"
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input
              name="name"
              type="text"
              className="form-input"
              placeholder="Instalación eléctrica"
              value={form.name}
              onChange={handleChange}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              name="description"
              className="form-input form-textarea"
              placeholder="Descripción del servicio..."
              value={form.description}
              onChange={handleChange}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Precio *</label>
            <div className="input-prefix">
              <span className="prefix-text">$</span>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                className="form-input with-prefix"
                placeholder="0.00"
                value={form.price}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Profesión</label>
            <select
              name="professionId"
              className="form-input form-select"
              value={form.professionId}
              onChange={handleChange}
            >
              <option value="">Sin profesión específica</option>
              {professions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {formError && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              {formError}
            </div>
          )}

          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Guardar Servicio
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
      <div className="empty-icon">🔧</div>
      <p className="empty-text">No hay servicios todavía</p>
      <Button variant="primary" onClick={onAdd}>
        Agregar primer servicio
      </Button>
    </div>
  );
}
