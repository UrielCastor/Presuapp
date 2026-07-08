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
  const [budgets, setBudgets] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteWarning, setDeleteWarning] = useState('');

  const fetchAll = async () => {
    try {
      const [itemsRes, professionsRes, budgetsRes] = await Promise.all([
        axiosInstance.get('/items'),
        axiosInstance.get('/professions'),
        axiosInstance.get('/budgets'),
      ]);
      setItems(itemsRes.data.data || []);
      setProfessions(professionsRes.data.data || []);
      setBudgets(budgetsRes.data.data || []);
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
    setEditingItem(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const handleEditClick = (item) => {
    setSuccessMessage('');
    setDeleteWarning('');
    setEditingItem(item);
    setForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price !== undefined ? item.price.toString() : '',
      professionId: item.professionId ? item.professionId.toString() : '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleDeleteClick = (item) => {
    setSuccessMessage('');
    setDeleteWarning('');
    // Como los presupuestos guardan los ítems desnormalizados (copias de textos),
    // borrar un item no rompe la base de datos ni los presupuestos existentes ya creados.
    // Para mayor seguridad informativa detectamos si hay coincidencia de nombres con items de presupuestos.
    const isUsed = budgets.some(b => 
      b.items && b.items.some(bi => bi.description?.trim().toLowerCase() === item.name?.trim().toLowerCase())
    );
    
    if (isUsed) {
      // Explicar al usuario pero permitir eliminar ya que no afectará los budgets históricos ya creados.
      setDeleteWarning(`El servicio "${item.name}" coincide textualmente con conceptos utilizados en tus presupuestos existentes. Si lo eliminás, no se verá afectada tu facturación histórica ni tus presupuestos redactados.`);
    }

    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setSubmitting(true);
    try {
      await axiosInstance.delete(`/items/${itemToDelete.id}`);
      setSuccessMessage(`Servicio "${itemToDelete.name}" eliminado correctamente.`);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el servicio.');
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
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
    if (!form.price || isNaN(parseFloat(form.price))) {
      setFormError('El precio debe ser un número válido.');
      return;
    }
    
    // Validar límites para FREE en creación nueva
    if (!editingItem && user?.userType === 'FREE' && items.length >= 20) {
      setFormError('Has alcanzado el límite de tu plan FREE (Máximo 20 servicios). Actualizá a VIP para seguir creando elementos.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        professionId: form.professionId ? parseInt(form.professionId) : undefined,
      };

      if (editingItem) {
        // Editar Servicio
        await axiosInstance.put(`/items/${editingItem.id}`, payload);
        setSuccessMessage(`Servicio "${form.name}" actualizado correctamente.`);
      } else {
        // Crear Servicio
        await axiosInstance.post('/items', payload);
        setSuccessMessage(`Servicio "${form.name}" guardado correctamente.`);
      }
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

      {successMessage && (
        <div className="alert alert-success" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="alert-icon">✅</span>
          {successMessage}
        </div>
      )}

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
                <th>Profesión / Rubro</th>
                <th>Precio sugerido</th>
                <th className="text-center" style={{ width: '180px' }}>Acciones</th>
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
                    {(() => {
                      const prof = professions.find(p => p.id === item.professionId);
                      return prof ? (
                        <span className="badge badge-info">{prof.name}</span>
                      ) : '—';
                    })()}
                  </td>
                  <td className="price-cell">{formatCurrency(item.price)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditClick(item)}
                        style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                      >
                        ✏️ Editar
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleDeleteClick(item)}
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
        {items.length === 0 ? (
          <EmptyState onAdd={handleOpenModal} />
        ) : (
          items.map((item) => (
            <Card key={item.id} className="item-card">
              <div className="item-card-header">
                <div className="item-icon large">🔧</div>
                <div>
                  <h3 className="item-card-name">{item.name}</h3>
                  {(() => {
                    const prof = professions.find(p => p.id === item.professionId);
                    return prof ? (
                      <span className="badge badge-info" style={{ display: 'inline-block', marginTop: '4px' }}>{prof.name}</span>
                    ) : null;
                  })()}
                </div>
                <span className="item-price">{formatCurrency(item.price)}</span>
              </div>
              {item.description && (
                <p className="item-description" style={{ marginBottom: '16px' }}>{item.description}</p>
              )}
              {/* Mobile Actions */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  fullWidth
                  onClick={() => handleEditClick(item)}
                  style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                >
                  ✏️ Editar
                </Button>
                <Button 
                  variant="danger" 
                  size="sm" 
                  fullWidth
                  onClick={() => handleDeleteClick(item)}
                >
                  🗑️ Eliminar
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Item Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? '✏️ Editar Servicio' : 'Nuevo Servicio'}
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
            <label className="form-label">Profesión / Rubro</label>
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
              {editingItem ? 'Guardar Cambios' : 'Guardar Servicio'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && itemToDelete && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">Confirmar Eliminación</h2>
              <button className="modal-close" onClick={() => setDeleteConfirmOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '20px 0' }}>
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                ¿Está seguro de eliminar el servicio <strong>{itemToDelete.name}</strong>?
              </p>
              {deleteWarning && (
                <p style={{ fontSize: '0.82rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.08)', padding: '10px', borderRadius: '6px', marginTop: '10px', marginBottom: 0, border: '1px dashed rgba(245, 158, 11, 0.2)' }}>
                  ⚠️ {deleteWarning}
                </p>
              )}
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
      <div className="empty-icon">🔧</div>
      <p className="empty-text">No hay servicios todavía</p>
      <Button variant="primary" onClick={onAdd}>
        Agregar primer servicio
      </Button>
    </div>
  );
}
