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
  const [viewPdfLoading, setViewPdfLoading] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState('PENDING');
  const [editNotes, setEditNotes] = useState('');
  const [editDiscount, setEditDiscount] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchBudget = async () => {
    try {
      const res = await axiosInstance.get(`/budgets/${id}`);
      setBudget(res.data.data);
      if (res.data.data) {
        setEditStatus(res.data.data.status || 'PENDING');
        setEditNotes(res.data.data.notes || '');
        setEditDiscount(res.data.data.discount || 0);
      }
    } catch {
      setError('No se pudo cargar el presupuesto.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [id]);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/budgets/${id}/pdf?origin=${encodeURIComponent(window.location.origin)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al generar PDF');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Clean metadata naming convention
      const clientNameRaw = budget.client?.name || 'Cliente';
      const cleanClientName = clientNameRaw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s-_]/g, '')
        .trim()
        .replace(/\s+/g, '_');

      const dateObj = budget.createdAt ? new Date(budget.createdAt) : new Date();
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      const filename = `Presupuesto_${cleanClientName}_${formattedDate}.pdf`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
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

  const handleViewPDF = async () => {
    setViewPdfLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/budgets/${id}/pdf?origin=${encodeURIComponent(window.location.origin)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al generar vista previa');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      alert('Error al abrir la vista previa del PDF. Intentá de nuevo.');
    } finally {
      setViewPdfLoading(false);
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

  const handleCopyLink = () => {
    const publicUrl = `${window.location.origin}/public/budget/${id}`;
    navigator.clipboard.writeText(publicUrl);
    alert('¡Enlace copiado al portapapeles!');
  };

  const handleShareEmail = () => {
    const publicUrl = `${window.location.origin}/public/budget/${id}`;
    const subject = encodeURIComponent(`Presupuesto #${budget?.number || id} de ${budget?.user?.name || ''}`);
    const body = encodeURIComponent(`Hola ${budget?.client?.name || ''},\n\nTe adjunto el enlace para ver el presupuesto correspondiente por los servicios acordados:\n\n${publicUrl}\n\nQuedo a tu disposición.\nSaludos cordiales.`);
    window.location.href = `mailto:${budget?.client?.email || ''}?subject=${subject}&body=${body}`;
  };

  const handleDuplicate = async () => {
    if (!window.confirm('¿Querés duplicar este presupuesto? Se creará uno nuevo con la misma información.')) return;
    setDuplicating(true);
    try {
      const payload = {
        clientId: budget.clientId,
        notes: budget.notes ? `${budget.notes} (Copia)` : 'Copia de presupuesto',
        discount: budget.discount,
        items: items.map(bi => ({
          serviceItemId: bi.serviceItemId || bi.item?.id || bi.id,
          quantity: bi.quantity
        }))
      };
      const res = await axiosInstance.post('/budgets', payload);
      alert('Presupuesto duplicado con éxito.');
      navigate(`/budgets/${res.data.data.id}`);
    } catch {
      alert('Error al duplicar el presupuesto.');
    } finally {
      setDuplicating(false);
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

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await axiosInstance.put(`/budgets/${id}`, {
        status: editStatus,
        notes: editNotes,
        discount: parseFloat(editDiscount) || 0
      });
      alert('Presupuesto actualizado correctamente.');
      setIsEditModalOpen(false);
      fetchBudget(); // Reload fresh state
    } catch (err) {
      alert(err.response?.data?.message || 'Error al actualizar el presupuesto.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTransitionStatus = async (newStatus) => {
    let confirmText = '';
    if (newStatus === 'IN_PROGRESS') {
      confirmText = '¿Estás seguro de que querés iniciar el trabajo para este presupuesto?';
    } else if (newStatus === 'FINISHED') {
      confirmText = '¿Estás seguro de que querés marcar este trabajo como Finalizado? Esta acción es definitiva.';
    } else if (newStatus === 'CANCELLED') {
      confirmText = '¿Estás seguro de que querés la cancelación? El presupuesto quedará bloqueado permanentemente.';
    }

    if (!window.confirm(confirmText)) return;

    setIsUpdating(true);
    try {
      await axiosInstance.put(`/budgets/${id}`, {
        status: newStatus
      });
      alert('¡El estado del presupuesto se actualizó con éxito!');
      fetchBudget(); // Reload fresh state
    } catch (err) {
      alert(err.response?.data?.message || 'Error al actualizar el estado del presupuesto.');
    } finally {
      setIsUpdating(false);
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

  const getServiceIcon = (name) => {
    const text = (name || '').toLowerCase();
    if (text.includes('elect') || text.includes('cabl') || text.includes('toma')) return '🔌';
    if (text.includes('ilum') || text.includes('lamp') || text.includes('luz')) return '💡';
    if (text.includes('tabl') || text.includes('termico') || text.includes('disy')) return '⚡';
    if (text.includes('plom') || text.includes('agua') || text.includes('caño') || text.includes('grif')) return '🚰';
    if (text.includes('alba') || text.includes('pared') || text.includes('cem') || text.includes('ladr')) return '🧱';
    if (text.includes('pint') || text.includes('color') || text.includes('endui')) return '🎨';
    if (text.includes('carp') || text.includes('mad') || text.includes('mueb')) return '🪚';
    return '🔧';
  };

  if (loadingData) return <Loading message="Cargando presupuesto..." />;
  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
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

  const publicUrl = `${window.location.origin}/public/budget/${id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicUrl)}`;

  // Timeline indexing setup for visual progress lines
  const timelineSteps = [
    { key: 'PENDING', label: 'Creado', order: 0 },
    { key: 'SENT', label: 'Enviado', order: 1 },
    { key: 'APPROVED', label: 'Aceptado', order: 2 },
    { key: 'IN_PROGRESS', label: 'En proceso', order: 3 },
    { key: 'FINISHED', label: 'Finalizado', order: 4 }
  ];

  const currentStep = timelineSteps.find(s => s.key === budget.status) || { order: 0 };
  const isCancelled = budget.status === 'CANCELLED';
  const progressPercent = `${(currentStep.order / (timelineSteps.length - 1)) * 100}%`;

  return (
    <div className="page-container" style={{ position: 'relative', paddingBottom: '100px' }}>
      
      {/* Dynamic inline Custom Badges and custom elements styles */}
      <style>{`
        /* State Badges Style Upgrade */
        .badge-pending { color: #f59e0b; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.25); }
        .badge-sent { color: #0284c7; background: rgba(2, 132, 199, 0.12); border: 1px solid rgba(2, 132, 199, 0.25); }
        .badge-approved { color: #10b981; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25); }
        .badge-inprogress { color: #8b5cf6; background: rgba(139, 92, 246, 0.12); border: 1px solid rgba(139, 92, 246, 0.25); }
        .badge-finished { color: #047857; background: rgba(4, 120, 87, 0.12); border: 1px solid rgba(4, 120, 87, 0.25); }
        .badge-cancelled { color: #ef4444; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.25); font-weight: 700; }

        /* Unified Card Styles */
        .detail-page-card {
          padding: 24px;
          border-radius: 16px;
          border: 1px solid var(--border-color);
          background: var(--bg-card);
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.15);
          margin-bottom: 32px;
          overflow: hidden;
        }

        /* Improved Grid Distribution & Spacings */
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 32px;
          margin-bottom: 32px;
        }
        
        .detail-row-field {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-color);
        }
        .detail-row-field:last-child {
          border-bottom: none;
        }

        /* Back Button Style Restoration and Polish */
        .back-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 24px;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .back-btn:hover {
          color: var(--text-primary);
          transform: translateX(-2px);
        }

        /* Perfect Alignments and Modern Header styling */
        .modern-header-section {
          padding: 28px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.1);
          margin-bottom: 32px;
        }

        /* Timeline layout */
        .timeline-container-card {
          padding: 28px 24px 24px;
          margin-bottom: 32px;
          background: var(--bg-card);
          border-radius: 16px;
          border: 1px solid var(--border-color);
          box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .timeline-wrapper {
          display: flex;
          justify-content: space-between;
          position: relative;
          margin: 32px auto 16px;
          padding: 0 40px;
          max-width: 100%;
        }
        .timeline-line {
          position: absolute;
          top: 16px;
          left: 40px;
          right: 40px;
          height: 4px;
          background: var(--border-color);
          z-index: 1;
          border-radius: 2px;
        }
        .timeline-line-active {
          position: absolute;
          top: 16px;
          left: 40px;
          height: 4px;
          z-index: 2;
          border-radius: 2px;
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .timeline-node {
          position: relative;
          z-index: 3;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 80px;
        }
        .node-bullet {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--bg-surface);
          border: 3px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          font-weight: 700;
          font-size: 0.92rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .node-label {
          margin-top: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          text-align: center;
          white-space: nowrap;
          transition: color 0.3s ease;
        }

        /* Timeline States implementation */
        .timeline-node.passed .node-bullet {
          border-color: #10b981;
          background: #10b981;
          color: #fff;
        }
        .timeline-node.passed .node-label {
          color: #10b981;
        }

        .timeline-node.active .node-bullet {
          border-color: var(--brand-primary);
          background: var(--brand-primary);
          color: #fff;
          box-shadow: 0 0 0 5px rgba(99, 102, 241, 0.25), 0 0 16px rgba(99, 102, 241, 0.4);
        }
        .timeline-node.active .node-label {
          color: var(--text-primary);
          font-weight: 700;
        }

        .timeline-node.passed.active .node-bullet {
          border-color: var(--brand-primary);
          background: #10b981;
          color: #fff;
          box-shadow: 0 0 0 5px rgba(99, 102, 241, 0.25), 0 0 16px rgba(99, 102, 241, 0.4);
        }

        .timeline-node.cancelled .node-bullet {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        .timeline-node.cancelled .node-label {
          color: #ef4444;
          font-weight: 600;
        }

        /* Action Grid buttons spacing */
        .action-grid-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 12px;
          margin-bottom: 32px;
        }

        .prof-avatar-placeholder {
          background: linear-gradient(135deg, var(--brand-primary), var(--brand-accent));
          color: #fff;
          border-radius: 50%;
          justify-content: center;
          align-items: center;
          width: 54px;
          height: 54px;
          font-size: 1.4rem;
          font-weight: 800;
          display: flex;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
        }

        /* Uniform card title designs */
        .detail-card-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 24px;
          border-bottom: 2px solid var(--border-color);
          padding-bottom: 12px;
        }

        /* Budget detailed services table margins */
        .data-table th, .data-table td {
          padding: 14px 16px;
        }

        /* Responsive adaptations */
        @media (max-width: 650px) {
          .timeline-wrapper {
            flex-direction: column;
            gap: 28px;
            align-items: flex-start;
            padding: 10px 20px;
            margin: 20px 0 10px;
          }
          .timeline-line {
            top: 20px;
            bottom: 20px;
            left: 37px;
            width: 4px;
            height: auto;
            right: auto;
          }
          .timeline-line-active {
            top: 20px;
            left: 37px;
            width: 4px !important;
            transition: height 0.4s ease;
          }
          .timeline-node {
            flex-direction: row;
            width: 100%;
            gap: 20px;
            align-items: center;
            text-align: left;
          }
          .node-label {
            margin-top: 0;
            font-size: 0.85rem;
          }
        }
      `}</style>

      {/* Back to budget list Link */}
      <button className="back-btn" onClick={() => navigate('/budgets')}>
        ← Volver a presupuestos
      </button>

      {/* 1. MODERN HEADER SECTION */}
      <div className="modern-header-section">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))' }}>⚡</span>
              <h1 className="page-title" style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800 }}>
                Presupuesto <span className="brand-text">#{budget.id}</span>
              </h1>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
              <span className={`badge ${getBadgeClass(budget.status)}`}>
                {getStatusLabel(budget.status)}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Nº: {budget.number} • Fecha: {formatDate(budget.createdAt)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="prof-avatar-placeholder" style={{ width: '48px', height: '48px', fontSize: '1.15rem' }}>
              {budget.user?.name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)' }}>{budget.user?.name || 'Profesional'}</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {budget.user?.professions?.[0]?.name || 'Servicios Especiales'}
              </span>
              {budget.user?.locality && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  📍 {budget.user.locality}{budget.user.city ? `, ${budget.user.city}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. VISUAL TIMELINE PROGRESS */}
      <div 
        className="timeline-container-card"
        style={{ '--progress': progressPercent }}
      >
        <span 
          style={{ 
            fontSize: '0.78rem', 
            fontWeight: 800, 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em', 
            color: isCancelled ? '#ef4444' : 'var(--text-muted)', 
            marginLeft: '8px'
          }}
        >
          {isCancelled ? '❌ Flujo de Trabajo Interrumpido (Cancelado)' : '⚙️ Línea de Progreso del Presupuesto'}
        </span>
        
        <div className={`timeline-wrapper ${isCancelled ? 'timeline-cancelled' : ''}`}>
          <div className="timeline-line"></div>
          <div 
            className="timeline-line-active" 
            style={{ 
              background: isCancelled ? 'none' : '#10b981',
              borderTop: isCancelled ? '3px dashed #ef4444' : 'none',
              borderLeft: isCancelled ? '3px dashed #ef4444' : 'none',
              width: isCancelled ? '100%' : 'var(--progress)'
            }}
          ></div>
          
          {timelineSteps.map((step) => {
            const isStepActive = step.order === currentStep.order;
            const isStepPassed = !isCancelled && step.order < currentStep.order;
            const isStepPending = !isCancelled && step.order > currentStep.order;
            const isStepCancelled = isCancelled && step.order <= currentStep.order;

            // Compute CSS selector class modifier
            let nodeClass = '';
            if (isCancelled) {
              nodeClass = isStepCancelled ? 'cancelled' : 'pending';
            } else {
              if (isStepPassed) nodeClass = 'passed';
              if (isStepActive) nodeClass = 'active';
              if (isStepPending) nodeClass = 'pending';
            }

            // Bullet content display based on conditions
            let bulletContent = step.order + 1;
            if (isCancelled) {
              if (isStepCancelled) {
                bulletContent = '✗';
              }
            } else {
              if (isStepPassed || (isStepActive && step.order > 0)) {
                bulletContent = '✔';
              }
            }

            return (
              <div 
                key={step.key} 
                className={`timeline-node ${nodeClass}`}
              >
                <div className="node-bullet">
                  {bulletContent}
                </div>
                <div className="node-label">{step.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. BOTONES DE ACCIÓN */}
      <div className="action-grid-buttons">
        <Button variant="success" onClick={handleWhatsApp} fullWidth>
          💬 WhatsApp
        </Button>
        <Button variant="outline" onClick={handleViewPDF} loading={viewPdfLoading} fullWidth style={{ color: 'var(--brand-accent)', borderColor: 'var(--brand-accent)' }}>
          👁️ Ver PDF
        </Button>
        <Button variant="outline" onClick={handleDownloadPDF} loading={pdfLoading} fullWidth>
          📄 Descargar PDF
        </Button>
        <Button variant="outline" onClick={handleCopyLink} fullWidth style={{ color: '#818cf8', borderColor: 'rgba(129, 140, 248, 0.4)' }}>
          🔗 Copiar Enlace
        </Button>
        <Button variant="outline" onClick={handleShareEmail} fullWidth style={{ color: '#a78bfa', borderColor: 'rgba(167, 139, 250, 0.4)' }}>
          ✉️ Enviar Email
        </Button>
        {(budget.status === 'PENDING' || budget.status === 'SENT') && (
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)} fullWidth style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
            ✏️ Editar
          </Button>
        )}
        {budget.status === 'APPROVED' && (
          <>
            <Button variant="primary" onClick={() => handleTransitionStatus('IN_PROGRESS')} fullWidth>
              ⚙️ Iniciar Trabajo
            </Button>
            <Button variant="danger" onClick={() => handleTransitionStatus('CANCELLED')} fullWidth style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
              ❌ Cancelar Trabajo
            </Button>
          </>
        )}
        {budget.status === 'IN_PROGRESS' && (
          <>
            <Button variant="success" onClick={() => handleTransitionStatus('FINISHED')} fullWidth>
              ✅ Finalizar Trabajo
            </Button>
            <Button variant="danger" onClick={() => handleTransitionStatus('CANCELLED')} fullWidth style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
              ❌ Cancelar Trabajo
            </Button>
          </>
        )}
        <Button variant="outline" onClick={handleDuplicate} loading={duplicating} fullWidth style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
          📋 Duplicar
        </Button>
        <Button variant="danger" onClick={handleDelete} loading={deleting} fullWidth>
          🗑️ Eliminar
        </Button>
      </div>

      <div className="detail-grid">
        
        {/* 3. TARJETA INFORMACIÓN DEL PROFESIONAL */}
        <div className="detail-page-card">
          <h2 className="detail-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            💼 Emisor Profesional
          </h2>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
            <div className="prof-avatar-placeholder">
              {budget.user?.name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{budget.user?.name}</h3>
              <span className="badge badge-info" style={{ marginTop: '6px', display: 'inline-block' }}>
                {budget.user?.professions?.[0]?.name || 'Servicios Independientes'}
              </span>
            </div>
          </div>

          <div className="detail-info">
            {budget.user?.phone && (
              <div className="detail-row-field">
                <span className="field-label">WhatsApp</span>
                <span className="field-value" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{budget.user.phone}</span>
              </div>
            )}
            <div className="detail-row-field">
              <span className="field-label">Email de contacto</span>
              <span className="field-value">{budget.user?.email || '—'}</span>
            </div>
            {(budget.user?.locality || budget.user?.city) && (
              <div className="detail-row-field">
                <span className="field-label">Ciudad / Provincia</span>
                <span className="field-value">
                  {budget.user.locality || ''}{budget.user.locality && budget.user.city ? ', ' : ''}{budget.user.city || ''}
                </span>
              </div>
            )}
            <div className="detail-row-field">
              <span className="field-label">Socio desde</span>
              <span className="field-value">
                {new Date(budget.user?.createdAt).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* CLIENT INFO CARD */}
        <div className="detail-page-card">
          <h2 className="detail-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            👤 Cliente Destinatario
          </h2>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
            <div className="client-avatar" style={{ margin: 0 }}>
              {budget.client?.name?.charAt(0).toUpperCase() || 'C'}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{budget.client?.name || '—'}</h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Destinatario del servicio</span>
            </div>
          </div>

          <div className="detail-info">
            {budget.client?.phone && (
              <div className="detail-row-field">
                <span className="field-label">Teléfono</span>
                <a href={`tel:${budget.client.phone}`} className="field-value link" style={{ fontWeight: 600 }}>
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
            {budget.notes && (
              <div className="detail-row-field">
                <span className="field-label">Notas del Cliente</span>
                <span className="field-value" style={{ fontStyle: 'italic' }}>"{budget.notes}"</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. SERVICIOS TABLE */}
      <div className="detail-page-card">
        <h2 className="detail-card-title">🔧 Trabajos y Conceptos Incluidos</h2>

        {/* Desktop view */}
        <div className="hide-mobile">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '45%' }}>Servicio / Concepto</th>
                <th style={{ width: '18%' }} className="text-right">Precio Unit.</th>
                <th style={{ width: '15%' }} className="text-center">Cantidad</th>
                <th style={{ width: '22%' }} className="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((bi, idx) => {
                const price = bi.unitPrice || 0;
                const qty = bi.quantity || 1;
                const subtotal = bi.subtotal || (price * qty);
                return (
                  <tr key={idx}>
                    <td>
                      <span style={{ marginRight: '10px', fontSize: '1.1rem' }}>{getServiceIcon(bi.description)}</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{bi.description || '—'}</strong>
                    </td>
                    <td className="text-right" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(price)}</td>
                    <td className="text-center" style={{ fontWeight: 600 }}>{qty}</td>
                    <td className="text-right price-cell" style={{ fontWeight: 700 }}>
                      {formatCurrency(subtotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile view */}
        <div className="show-mobile">
          {items.map((bi, idx) => {
            const price = bi.unitPrice || 0;
            const qty = bi.quantity || 1;
            const subtotal = bi.subtotal || (price * qty);
            return (
              <div key={idx} className="mobile-item-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '14px' }}>
                <div className="mobile-item-name" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 650, color: 'var(--text-primary)' }}>
                  <span style={{ fontSize: '1.15rem' }}>{getServiceIcon(bi.description)}</span>
                  {bi.description || '—'}
                </div>
                <div className="mobile-item-detail" style={{ marginLeft: '28px', marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{formatCurrency(price)} × {qty}</span>
                  <span className="mobile-item-subtotal" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. RESUMEN ECONÓMICO CARD (FULL WIDTH HORIZONTAL KPI GRID) */}
      <div className="detail-page-card" style={{ 
        width: '100%', 
        background: 'var(--bg-surface)', 
        border: '1px solid var(--border-color)', 
        borderRadius: '16px',
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        padding: '28px',
        marginBottom: '32px'
      }}>
        {/* Decorative Top Accent Stripe */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(95deg, var(--brand-primary), var(--brand-accent))' }}></div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <span style={{ fontSize: '1.25rem' }}>💳</span>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Resumen Financiero del Presupuesto
          </h3>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '24px',
          alignItems: 'center'
        }}>
          {/* Subtotal Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subtotal Bruto</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(subtotalVal)}</span>
          </div>

          {/* Discount Column */}
          {budget.discount > 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '4px',
              background: 'rgba(239, 68, 68, 0.05)', 
              padding: '10px 14px', 
              borderRadius: '8px',
              border: '1px dashed rgba(239, 68, 68, 0.2)'
            }}>
              <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>🏷️ Descuento ({budget.discount}%)</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ef4444' }}>-{formatCurrency(subtotalVal * (budget.discount / 100))}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descuento</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 650, color: 'var(--text-muted)' }}>Sin descuento aplicado</span>
            </div>
          )}

          {/* Taxes Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Impuestos (S.I.)</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>$0,00</span>
          </div>

          {/* Total Column */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '4px',
            alignItems: 'flex-start',
            borderLeft: '2px solid var(--border-color)',
            paddingLeft: '28px',
            height: '100%',
            justifyContent: 'center'
          }} className="total-net-col">
            <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Neto</span>
            <span style={{ 
              fontSize: '2.2rem', 
              fontWeight: 950, 
              color: '#10b981', 
              textShadow: '0 0 16px rgba(16, 185, 129, 0.35)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em'
            }}>
              {formatCurrency(budget.total)}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pesos Argentinos (ARS)</span>
          </div>
        </div>
      </div>
      
      {/* Support simple mobile layout style overrides */}
      <style>{`
        @media (max-width: 900px) {
          .total-net-col {
            border-left: none !important;
            padding-left: 0 !important;
            padding-top: 18px !important;
            border-top: 2px dashed var(--border-color) !important;
          }
        }
      `}</style>

      {/* 9. TARJETA DIGITAL QR */}
      <div className="detail-page-card" style={{ border: '1px dashed var(--border-color)', background: 'var(--bg-surface)', padding: '24px 20px', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <img 
          src={qrCodeUrl} 
          alt="Presupuesto QR" 
          style={{ width: '130px', height: '130px', borderRadius: '12px', border: '6px solid white', boxShadow: 'var(--shadow-md)' }}
        />
        <div style={{ flex: 1, minWidth: '220px', textAlign: 'left' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Código de Lectura Rápida (QR)</h4>
          <p style={{ margin: '0 0 14px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Escaneá este código QR con la cámara de tu celular para ver el presupuesto en línea en su formato web interactivo público.
          </p>
          <Button variant="ghost" size="sm" onClick={handleCopyLink}>
            🔗 Copiar enlace público
          </Button>
        </div>
      </div>

      {/* EDIT BUDGET MODAL */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal modal-md">
            <div className="modal-header">
              <h2 className="modal-title">✏️ Editar Presupuesto #{budget.id}</h2>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateBudget} className="modal-body">
              <div className="form-group">
                <label className="form-label">Estado del Presupuesto</label>
                <select 
                  className="form-input form-select"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="SENT">Enviado</option>
                  <option value="APPROVED">Aceptado</option>
                  <option value="IN_PROGRESS">En proceso</option>
                  <option value="FINISHED">Finalizado</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Descuento (%)</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  value={editDiscount}
                  onChange={(e) => setEditDiscount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notas / Observaciones</label>
                <textarea 
                  className="form-input form-textarea"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Garantía de servicio, plazos, etc."
                />
              </div>

              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" loading={isUpdating}>
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Sticky Action Panel */}
      <div className="bottom-actions show-mobile">
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="success" style={{ flex: 1 }} onClick={handleWhatsApp}>
            💬 WhatsApp
          </Button>
          <Button variant="outline" style={{ flex: 1 }} onClick={handleViewPDF} loading={viewPdfLoading}>
            👁️ Ver PDF
          </Button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" style={{ flex: 1 }} onClick={handleDownloadPDF} loading={pdfLoading}>
            📄 PDF
          </Button>
          <Button variant="danger" style={{ flex: 1 }} onClick={handleDelete} loading={deleting}>
            🗑️ Eliminar
          </Button>
        </div>
      </div>

    </div>
  );
}
