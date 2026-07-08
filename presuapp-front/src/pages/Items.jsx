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
  
  // Search and Profession-grouping states
  const [search, setSearch] = useState('');
  const [selectedProfessionId, setSelectedProfessionId] = useState(null);

  const fetchAll = async () => {
    try {
      const [itemsRes, professionsRes, budgetsRes] = await Promise.all([
        axiosInstance.get('/items'),
        axiosInstance.get('/professions'),
        axiosInstance.get('/budgets'),
      ]);
      const fetchedItems = itemsRes.data.data || [];
      const fetchedProfessions = professionsRes.data.data || [];
      setItems(fetchedItems);
      setProfessions(fetchedProfessions);
      setBudgets(budgetsRes.data.data || []);

      // If user has 2 or more professions and none is selected yet, select the first one by default
      if (fetchedProfessions.length >= 2 && !selectedProfessionId) {
        setSelectedProfessionId(fetchedProfessions[0].id);
      }
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
    
    // Auto-select active profession tab in form if relevant
    const initialProfessionId = 
      (selectedProfessionId && selectedProfessionId !== 'unassigned') 
        ? selectedProfessionId.toString() 
        : '';

    setForm({
      name: '',
      description: '',
      price: '',
      professionId: initialProfessionId,
    });
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
    const isUsed = budgets.some(b => 
      b.items && b.items.some(bi => bi.description?.trim().toLowerCase() === item.name?.trim().toLowerCase())
    );
    
    if (isUsed) {
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
        professionId: form.professionId ? parseInt(form.professionId) : null,
      };

      if (editingItem) {
        await axiosInstance.put(`/items/${editingItem.id}`, payload);
        setSuccessMessage(`Servicio "${form.name}" actualizado correctamente.`);
      } else {
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

  // Grouping filter logic
  const hasMultipleProfessions = professions.length >= 2;
  
  // Filter by selected profession
  const getFilteredByProfession = () => {
    if (!hasMultipleProfessions) return items;
    if (selectedProfessionId === 'unassigned') {
      return items.filter(item => !item.professionId);
    }
    return items.filter(item => item.professionId === selectedProfessionId);
  };

  // Filter both by profession & search textbox
  const filtered = getFilteredByProfession().filter(
    (item) =>
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loadingData) return <Loading message="Cargando servicios..." />;

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Servicios</h1>
          <p className="page-subtitle">
            {hasMultipleProfessions 
              ? `${filtered.length} servicios de la profesión seleccionada` 
              : `${items.length} servicios disponibles`}
          </p>
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
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
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

      {/* PROFESSION FILTER (Visible if >= 2 professions) */}
      {hasMultipleProfessions && (
        <div 
          style={{ 
            display: 'flex', 
            gap: '10px', 
            flexWrap: 'wrap', 
            marginBottom: '20px',
            background: 'var(--bg-surface)',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}
        >
          {professions.map((prof) => {
            const count = items.filter((i) => i.professionId === prof.id).length;
            const isSelected = selectedProfessionId === prof.id;
            return (
              <button
                key={prof.id}
                onClick={() => setSelectedProfessionId(prof.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: `1px solid ${isSelected ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                  background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>💼 {prof.name}</span>
                <span style={{
                  background: isSelected ? 'var(--brand-primary)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  fontSize: '0.72rem',
                  padding: '2px 7px',
                  borderRadius: '999px',
                  fontWeight: 650
                }}>
                  {count}
                </span>
              </button>
            );
          })}
          {items.some(i => !i.professionId) && (() => {
            const countUnassigned = items.filter(i => !i.professionId).length;
            const isSelected = selectedProfessionId === 'unassigned';
            return (
              <button
                onClick={() => setSelectedProfessionId('unassigned')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: `1px solid ${isSelected ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                  background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>📦 Sin clasificar</span>
                <span style={{
                  background: isSelected ? 'var(--brand-primary)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  fontSize: '0.72rem',
                  padding: '2px 7px',
                  borderRadius: '999px',
                  fontWeight: 650
                }}>
                  {countUnassigned}
                </span>
              </button>
            );
          })()}
        </div>
      )}

      {/* Search bar */}
      <div className="search-bar" style={{ marginBottom: '20px' }}>
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por nombre o descripción de servicio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Desktop table */}
      <div className="table-wrapper hide-mobile">
        {filtered.length === 0 ? (
          <EmptyState 
            onAdd={handleOpenModal} 
            hasFilters={search || (hasMultipleProfessions && selectedProfessionId)} 
          />
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
              {filtered.map((item) => (
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
        {filtered.length === 0 ? (
          <EmptyState 
            onAdd={handleOpenModal} 
            hasFilters={search || (hasMultipleProfessions && selectedProfessionId)}
          />
        ) : (
          filtered.map((item) => (
            <Card key={item.id} className="item-card">
              <div className="item-card-header">
                <div className="item-icon large">🔧</div>
                <div style={{ flex: 1, paddingRight: '8px' }}>
                  <h3 className="item-card-name" style={{ fontSize: '0.95rem' }}>{item.name}</h3>
                  {(() => {
                    const prof = professions.find(p => p.id === item.professionId);
                    return prof ? (
                      <span className="badge badge-info" style={{ display: 'inline-block', marginTop: '4px' }}>{prof.name}</span>
                    ) : null;
                  })()}
                </div>
                <span className="item-price" style={{ fontWeight: 700 }}>{formatCurrency(item.price)}</span>
              </div>
              {item.description && (
                <p className="item-description" style={{ marginBottom: '16px', fontSize: '0.85rem' }}>{item.description}</p>
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

function EmptyState({ onAdd, hasFilters }) {
  return (
    <div className="empty-state" style={{ padding: '40px 20px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', textAlign: 'center', width: '100%' }}>
      <div className="empty-icon" style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔧</div>
      <p className="empty-text" style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '20px', fontWeight: 600 }}>
        {hasFilters ? 'No se encontraron servicios asignados o que coincidan con la búsqueda.' : 'No hay servicios todavía registrado.'}
      </p>
      {!hasFilters && (
        <Button variant="primary" onClick={onAdd}>
          Agregar primer servicio
        </Button>
      )}
    </div>
  );
}
