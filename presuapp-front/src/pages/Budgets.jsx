import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Loading from '../components/Loading';
import { useAuth } from '../hooks/useAuth';

export default function Budgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedProfessionId, setSelectedProfessionId] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [discount, setDiscount] = useState(0);

  const fetchAll = async () => {
    try {
      const [budgetsRes, clientsRes, itemsRes, professionsRes] = await Promise.all([
        axiosInstance.get('/budgets'),
        axiosInstance.get('/clients'),
        axiosInstance.get('/items'),
        axiosInstance.get('/professions'),
      ]);
      setBudgets(budgetsRes.data.data || []);
      setClients(clientsRes.data.data || []);
      setItems(itemsRes.data.data || []);
      setProfessions(professionsRes.data.data || []);
    } catch {
      setError('Error al cargar los presupuestos.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleOpenModal = () => {
    setSelectedClientId('');
    setSelectedProfessionId('');
    setNotes('');
    setSelectedItems([]);
    setDiscount(0);
    setFormError('');
    setModalOpen(true);
  };

  const handleAddItem = (itemId) => {
    const id = parseInt(itemId);
    if (!id) return;
    const exists = selectedItems.find((si) => si.serviceItemId === id);
    if (exists) return;
    setSelectedItems((prev) => [...prev, { serviceItemId: id, quantity: 1 }]);
  };

  const handleQtyChange = (serviceItemId, qty) => {
    setSelectedItems((prev) =>
      prev.map((si) =>
        si.serviceItemId === serviceItemId
          ? { ...si, quantity: Math.max(1, parseInt(qty) || 1) }
          : si
      )
    );
  };

  const handleRemoveItem = (serviceItemId) => {
    setSelectedItems((prev) => prev.filter((si) => si.serviceItemId !== serviceItemId));
  };

  const getItemById = (id) => items.find((i) => i.id === id);

  const calcTotal = () =>
    selectedItems.reduce((acc, si) => {
      const item = getItemById(si.serviceItemId);
      return acc + (item?.price || 0) * si.quantity;
    }, 0);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClientId) {
      setFormError('Seleccioná un cliente.');
      return;
    }
    if (professions.length >= 2 && !selectedProfessionId) {
      setFormError('Seleccioná una profesión.');
      return;
    }
    if (selectedItems.length === 0) {
      setFormError('Agregá al menos un servicio.');
      return;
    }
    const discountVal = parseFloat(discount) || 0;
    if (discountVal < 0 || discountVal > 100) {
      setFormError('El descuento debe estar entre 0% y 100%.');
      return;
    }
    const currentItemsCount = budgets.reduce((acc, b) => acc + (b.items?.length || 0), 0);
    if (user?.userType === 'FREE' && currentItemsCount + selectedItems.length > 100) {
      setFormError('Has alcanzado el límite de tu plan FREE (Máximo 100 ítems permitidos). Actualizá a Premium para seguir creando elementos.');
      return;
    }
    setSubmitting(true);
    try {
      await axiosInstance.post('/budgets', {
        clientId: parseInt(selectedClientId),
        items: selectedItems,
        notes,
        discount: parseFloat(discount),
      });
      setModalOpen(false);
      fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al crear el presupuesto.');
    } finally {
      setSubmitting(false);
    }
  };

  const getBadgeClass = (status) => {
    const map = {
      PENDING: 'badge-pending',
      SENT: 'badge-sent',
      APPROVED: 'badge-approved',
      IN_PROGRESS: 'badge-inprogress',
      FINISHED: 'badge-finished',
      CANCELLED: 'badge-cancelled'
    };
    return map[status] || 'badge-default';
  };

  const getStatusLabel = (status) => {
    const map = {
      PENDING: 'Pendiente',
      SENT: 'Enviado',
      APPROVED: 'Aceptado',
      IN_PROGRESS: 'En proceso',
      FINISHED: 'Finalizado',
      CANCELLED: 'Cancelado'
    };
    return map[status] || status;
  };

  const filtered = budgets.filter((b) =>
    b.client?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loadingData) return <Loading message="Cargando presupuestos..." />;

  // Filter available items for creation select dropdown based on professions
  const availableItems = items.filter((i) => {
    if (selectedItems.find((si) => si.serviceItemId === i.id)) return false;
    if (professions.length >= 2) {
      return i.professionId === parseInt(selectedProfessionId);
    }
    if (professions.length === 1) {
      return i.professionId === professions[0].id;
    }
    return true;
  });

  const isServiceSelectDisabled = professions.length >= 2 && !selectedProfessionId;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Presupuestos</h1>
          <p className="page-subtitle">{budgets.length} presupuestos en total</p>
        </div>
        <Button variant="primary" onClick={handleOpenModal}>
          + Nuevo Presupuesto
        </Button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {(() => {
        const totalItemsCount = budgets.reduce((acc, b) => acc + (b.items?.length || 0), 0);
        if (user?.userType === 'FREE' && totalItemsCount >= 100) {
          return (
            <div className="alert alert-warning" role="alert" style={{ marginBottom: '20px' }}>
              <span className="alert-icon">💡</span>
              Has alcanzado el límite de tu plan FREE (Máximo 100 items en presupuestos). Actualizá a Premium para seguir creando elementos.
            </div>
          );
        }
        return null;
      })()}

      {/* Modern Search Bar */}
      {budgets.length > 0 && (
        <div className="search-bar" style={{ marginBottom: '20px' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Buscar presupuesto por nombre del cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Desktop table */}
      <div className="table-wrapper hide-mobile">
        {budgets.length === 0 ? (
          <EmptyState onAdd={handleOpenModal} />
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔍</div>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '20px', fontWeight: 600 }}>
              No se encontraron presupuestos para esa búsqueda.
            </p>
            <Button variant="ghost" onClick={() => setSearch('')}>
              🧹 Limpiar búsqueda
            </Button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td><span className="budget-number">#{b.id}</span></td>
                  <td>{b.client?.name || '—'}</td>
                  <td className="price-cell">{formatCurrency(b.total)}</td>
                  <td>{formatDate(b.createdAt)}</td>
                  <td>
                    <span className={`badge ${getBadgeClass(b.status)}`}>
                      {getStatusLabel(b.status)}
                    </span>
                  </td>
                  <td>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/budgets/${b.id}`)}
                    >
                      Ver detalle
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile cards */}
      <div className="card-list show-mobile">
        {budgets.length === 0 ? (
          <EmptyState onAdd={handleOpenModal} />
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔍</div>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '20px', fontWeight: 600 }}>
              No se encontraron presupuestos para esa búsqueda.
            </p>
            <Button variant="ghost" onClick={() => setSearch('')}>
              🧹 Limpiar búsqueda
            </Button>
          </div>
        ) : (
          filtered.map((b) => (
            <Card
              key={b.id}
              className="budget-card"
              onClick={() => navigate(`/budgets/${b.id}`)}
            >
              <div className="budget-card-header">
                <span className="budget-number">#{b.id}</span>
                <span className={`badge ${getBadgeClass(b.status)}`}>
                  {getStatusLabel(b.status)}
                </span>
              </div>
              <div className="budget-card-client">
                <span className="budget-icon">👤</span>
                <strong>{b.client?.name || 'Sin cliente'}</strong>
              </div>
              <div className="budget-card-footer">
                <span className="budget-date">{formatDate(b.createdAt)}</span>
                <span className="budget-total">{formatCurrency(b.total)}</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuevo Presupuesto"
        size="lg"
      >
        <form onSubmit={handleSubmit} noValidate>
          {/* Client */}
          <div className="form-group">
            <label className="form-label">Cliente *</label>
            <select
              className="form-input form-select"
              value={selectedClientId}
              onChange={(e) => { setSelectedClientId(e.target.value); setFormError(''); }}
            >
              <option value="">Seleccioná un cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Profession Selector (mandatory if multiple) */}
          {professions.length >= 2 && (
            <div className="form-group">
              <label className="form-label">Profesión *</label>
              <select
                className="form-input form-select"
                value={selectedProfessionId}
                onChange={(e) => {
                  setSelectedProfessionId(e.target.value);
                  setSelectedItems([]); // Clear selected items dynamically
                  setFormError('');
                }}
              >
                <option value="">Seleccioná una profesión</option>
                {professions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Add service */}
          <div className="form-group">
            <label className="form-label">Agregar Servicio</label>
            <select
              className="form-input form-select"
              value=""
              disabled={isServiceSelectDisabled}
              onChange={(e) => { handleAddItem(e.target.value); }}
            >
              <option value="">
                {isServiceSelectDisabled 
                  ? '⚠️ Seleccioná primero una profesión' 
                  : 'Seleccioná un servicio para agregar'}
              </option>
              {availableItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} — {formatCurrency(i.price)}
                </option>
              ))}
            </select>
          </div>

          {/* Selected items */}
          {selectedItems.length > 0 && (
            <div className="selected-items">
              <h4 className="selected-items-title">Servicios seleccionados</h4>
              {selectedItems.map((si) => {
                const item = getItemById(si.serviceItemId);
                return (
                  <div key={si.serviceItemId} className="selected-item-row">
                    <div className="selected-item-info">
                      <span className="selected-item-name">{item?.name}</span>
                      <span className="selected-item-price">
                        {formatCurrency((item?.price || 0) * si.quantity)}
                      </span>
                    </div>
                    <div className="selected-item-controls">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => handleQtyChange(si.serviceItemId, si.quantity - 1)}
                      >−</button>
                      <span className="qty-value">{si.quantity}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => handleQtyChange(si.serviceItemId, si.quantity + 1)}
                      >+</button>
                      <button
                        type="button"
                        className="remove-item-btn"
                        onClick={() => handleRemoveItem(si.serviceItemId)}
                      >🗑️</button>
                    </div>
                  </div>
                );
              })}
              <div className="budget-total-row" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
                <span style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                  Subtotal: <strong>{formatCurrency(calcTotal())}</strong>
                </span>
                {discount > 0 && (
                  <span style={{ fontSize: '0.92rem', color: 'var(--brand-danger)' }}>
                    Descuento ({discount}%): <strong>-{formatCurrency(calcTotal() * (discount / 100))}</strong>
                  </span>
                )}
                <div style={{ marginTop: '4px', fontSize: '1.15rem' }}>
                  <strong>Total estimado: </strong>
                  <strong className="total-amount" style={{ color: 'var(--brand-primary)' }}>
                    {formatCurrency(calcTotal() * (1 - discount / 100))}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Discount Selector */}
          <div className="form-group" style={{ marginTop: '20px' }}>
            <label className="form-label">Descuento Especial</label>
            <select
              className="form-input form-select"
              value={discount}
              onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
            >
              <option value="0">Sin descuento</option>
              <option value="5">5% de descuento</option>
              <option value="10">10% de descuento</option>
              <option value="15">15% de descuento</option>
              <option value="20">20% de descuento</option>
              <option value="25">25% de descuento</option>
            </select>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notas</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Condiciones, aclaraciones..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Crear Presupuesto
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
      <div className="empty-icon">📋</div>
      <p className="empty-text">No hay presupuestos todavía</p>
      <Button variant="primary" onClick={onAdd}>
        Crear primer presupuesto
      </Button>
    </div>
  );
}
