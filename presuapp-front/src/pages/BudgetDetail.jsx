import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export default function BudgetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [budget, setBudget] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const res = await axiosInstance.get(`/budgets/${id}`);
        setBudget(res.data.data);
      } catch {
        setError('No se pudo cargar el presupuesto.');
      } finally {
        setLoadingData(false);
      }
    };
    fetchBudget();
  }, [id]);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/budgets/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al generar PDF');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presupuesto-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Error al descargar el PDF. Intentá de nuevo.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleWhatsApp = async () => {
    try {
      const res = await axiosInstance.get(`/budgets/${id}/whatsapp`);
      const { link } = res.data.data || {};
      if (link) {
        window.open(link, '_blank');
      } else {
        alert('No se pudo generar el link de WhatsApp.');
      }
    } catch {
      alert('Error al generar el link de WhatsApp.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que querés eliminar este presupuesto? Esta acción no se puede deshacer.')) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/budgets/${id}`);
      navigate('/budgets');
    } catch {
      alert('Error al eliminar el presupuesto.');
      setDeleting(false);
    }
  };

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
      hour: '2-digit',
      minute: '2-digit',
    });

  const getBadgeClass = (status) => {
    const map = { PENDING: 'badge-warning', APPROVED: 'badge-success', REJECTED: 'badge-danger' };
    return map[status] || 'badge-default';
  };
  const getStatusLabel = (status) => {
    const map = { PENDING: 'Pendiente', APPROVED: 'Aprobado', REJECTED: 'Rechazado' };
    return map[status] || status;
  };

  if (loadingData) return <Loading message="Cargando presupuesto..." />;
  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span> {error}
        </div>
        <Button variant="ghost" onClick={() => navigate('/budgets')}>
          ← Volver
        </Button>
      </div>
    );
  }

  const items = budget?.items || budget?.budgetItems || [];

  const subtotalVal = items.reduce((acc, bi) => {
    const price = bi.unitPrice || bi.price || bi.serviceItem?.price || 0;
    const qty = bi.quantity || 1;
    return acc + (price * qty);
  }, 0);

  return (
    <div className="page-container">
      {/* Back */}
      <button className="back-btn" onClick={() => navigate('/budgets')}>
        ← Volver a presupuestos
      </button>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Presupuesto #{budget.id}</h1>
          <span className={`badge ${getBadgeClass(budget.status)}`}>
            {getStatusLabel(budget.status)}
          </span>
        </div>
        <div className="action-buttons">
          <Button variant="success" onClick={handleWhatsApp}>
            💬 WhatsApp
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            loading={pdfLoading}
          >
            📄 Descargar PDF
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={deleting}
          >
            🗑️ Eliminar
          </Button>
        </div>
      </div>

      <div className="detail-grid">
        {/* Client info */}
        <Card className="detail-card">
          <h2 className="detail-card-title">👤 Cliente</h2>
          <div className="detail-info">
            <div className="detail-row-field">
              <span className="field-label">Nombre</span>
              <span className="field-value">{budget.client?.name || '—'}</span>
            </div>
            {budget.client?.phone && (
              <div className="detail-row-field">
                <span className="field-label">Teléfono</span>
                <a href={`tel:${budget.client.phone}`} className="field-value link">
                  {budget.client.phone}
                </a>
              </div>
            )}
            {budget.client?.email && (
              <div className="detail-row-field">
                <span className="field-label">Email</span>
                <span className="field-value">{budget.client.email}</span>
              </div>
            )}
            {budget.client?.address && (
              <div className="detail-row-field">
                <span className="field-label">Dirección</span>
                <span className="field-value">{budget.client.address}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Meta info */}
        <Card className="detail-card">
          <h2 className="detail-card-title">📋 Información</h2>
          <div className="detail-info">
            <div className="detail-row-field">
              <span className="field-label">Fecha creación</span>
              <span className="field-value">{formatDate(budget.createdAt)}</span>
            </div>
            <div className="detail-row-field">
              <span className="field-label">Estado</span>
              <span className={`badge ${getBadgeClass(budget.status)}`}>
                {getStatusLabel(budget.status)}
              </span>
            </div>
            {budget.notes && (
              <div className="detail-row-field">
                <span className="field-label">Notas</span>
                <span className="field-value">{budget.notes}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Items table */}
      <Card className="detail-card items-card">
        <h2 className="detail-card-title">🔧 Servicios</h2>

        {/* Desktop */}
        <div className="hide-mobile">
          <table className="data-table">
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Descripción</th>
                <th className="text-right">Precio Unit.</th>
                <th className="text-center">Cantidad</th>
                <th className="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((bi, idx) => {
                const item = bi.serviceItem || bi.item || bi;
                const price = item?.price || bi.price || 0;
                const qty = bi.quantity || 1;
                return (
                  <tr key={idx}>
                    <td>{item?.name || '—'}</td>
                    <td className="notes-cell">{item?.description || '—'}</td>
                    <td className="text-right">{formatCurrency(price)}</td>
                    <td className="text-center">{qty}</td>
                    <td className="text-right price-cell">
                      {formatCurrency(price * qty)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              {budget.discount > 0 && (
                <>
                  <tr className="subtotal-row" style={{ borderTop: '2px solid var(--border-color)' }}>
                    <td colSpan={4} className="text-right" style={{ padding: '8px 12px 4px', color: 'var(--text-secondary)' }}>
                      Subtotal
                    </td>
                    <td className="text-right price-cell" style={{ padding: '8px 12px 4px', color: 'var(--text-secondary)' }}>
                      {formatCurrency(subtotalVal)}
                    </td>
                  </tr>
                  <tr className="discount-row">
                    <td colSpan={4} className="text-right" style={{ padding: '4px 12px', color: 'var(--brand-danger)' }}>
                      Descuento ({budget.discount}%)
                    </td>
                    <td className="text-right price-cell" style={{ padding: '4px 12px', color: 'var(--brand-danger)' }}>
                      -{formatCurrency(subtotalVal * (budget.discount / 100))}
                    </td>
                  </tr>
                </>
              )}
              <tr className="total-row">
                <td colSpan={4} className="text-right">
                  <strong>Total</strong>
                </td>
                <td className="text-right price-cell">
                  <strong>{formatCurrency(budget.total)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile */}
        <div className="show-mobile">
          {items.map((bi, idx) => {
            const item = bi.serviceItem || bi.item || bi;
            const price = item?.price || bi.price || 0;
            const qty = bi.quantity || 1;
            return (
              <div key={idx} className="mobile-item-row">
                <div className="mobile-item-name">{item?.name || '—'}</div>
                <div className="mobile-item-detail">
                  <span>{formatCurrency(price)} × {qty}</span>
                  <span className="mobile-item-subtotal">
                    {formatCurrency(price * qty)}
                  </span>
                </div>
              </div>
            );
          })}
          <div className="mobile-total-row" style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'stretch', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            {budget.discount > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotalVal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--brand-danger)' }}>
                  <span>Descuento ({budget.discount}%)</span>
                  <span>-{formatCurrency(subtotalVal * (budget.discount / 100))}</span>
                </div>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', marginTop: '6px', fontWeight: 'bold' }}>
              <span>Total</span>
              <span className="total-amount" style={{ color: 'var(--brand-primary)' }}>{formatCurrency(budget.total)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Bottom actions for mobile */}
      <div className="bottom-actions show-mobile">
        <Button variant="success" fullWidth onClick={handleWhatsApp}>
          💬 Compartir por WhatsApp
        </Button>
        <Button
          variant="outline"
          fullWidth
          onClick={handleDownloadPDF}
          loading={pdfLoading}
        >
          📄 Descargar PDF
        </Button>
        <Button
          variant="danger"
          fullWidth
          onClick={handleDelete}
          loading={deleting}
        >
          🗑️ Eliminar presupuesto
        </Button>
      </div>
    </div>
  );
}
