import { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Loading from '../components/Loading';
import { useAuth } from '../hooks/useAuth';

const emptyForm = { name: '', description: '' };

export default function Professions() {
  const { user } = useAuth();
  const [professions, setProfessions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchProfessions = async () => {
    try {
      setError('');
      const res = await axiosInstance.get('/professions');
      setProfessions(res.data.data || []);
    } catch (err) {
      setError('Error al cargar las profesiones. Verificá que el servidor esté activo.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchProfessions();
  }, []);

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
    if (user?.userType === 'FREE' && professions.length >= 1) {
      setFormError('Has alcanzado el límite de tu plan FREE. Actualizá a VIP para seguir creando elementos.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await axiosInstance.post('/professions', {
        name: form.name.trim(),
        description: form.description.trim(),
      });
      
      // Mostrar feedback de éxito temporal
      setSuccessMessage('¡Profesión creada con éxito!');
      setTimeout(() => setSuccessMessage(''), 4000);

      // Cerrar modal si corresponde
      setModalOpen(false);
      
      // Limpiar formulario y refrescar listado
      setForm(emptyForm);
      fetchProfessions();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al guardar la profesión.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderForm = (isModalForm = false) => (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label className="form-label">Nombre *</label>
        <input
          name="name"
          type="text"
          className="form-input"
          placeholder="Ej: Plomero, Electricista, Gasista..."
          value={form.name}
          onChange={handleChange}
          autoFocus={isModalForm}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Descripción</label>
        <textarea
          name="description"
          className="form-input form-textarea"
          placeholder="Breve descripción del rubro..."
          value={form.description}
          onChange={handleChange}
          rows={3}
        />
      </div>

      {formError && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">⚠️</span>
          {formError}
        </div>
      )}

      <div className={isModalForm ? 'modal-actions' : 'form-actions'} style={!isModalForm ? { marginTop: '20px' } : undefined}>
        {isModalForm && (
          <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          fullWidth={!isModalForm}
        >
          Crear profesión
        </Button>
      </div>
    </form>
  );

  if (loadingData) return <Loading message="Cargando profesiones..." />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profesiones</h1>
          <p className="page-subtitle">{professions.length} profesiones creadas</p>
        </div>
        {/* Botón "+ Agregar Profesión" - Visible solo en Mobile */}
        <Button variant="primary" className="show-mobile" onClick={handleOpenModal}>
          + Agregar Profesión
        </Button>
      </div>

      {successMessage && (
        <div className="alert alert-success" role="alert">
          <span className="alert-icon">✅</span>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {user?.userType === 'FREE' && professions.length >= 1 && (
        <div className="alert alert-warning" role="alert" style={{ marginBottom: '20px' }}>
          <span className="alert-icon">💡</span>
          Has alcanzado el límite de tu plan FREE (Máximo 1 profesión). Actualizá a VIP para seguir creando elementos.
        </div>
      )}

      <div className="professions-layout">
        {/* Formulario lateral de Desktop (Oculto en Mobile con hide-mobile) */}
        <div className="profession-form-card hide-mobile">
          <h2 className="profession-form-card-title">Nueva Profesión</h2>
          {renderForm(false)}
        </div>

        {/* Sección de Listado */}
        <div className="profession-list-section">
          {professions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏅</div>
              <p className="empty-text">No hay profesiones configuradas</p>
              <Button variant="primary" className="show-mobile" onClick={handleOpenModal}>
                Agregar primera profesión
              </Button>
              <p className="hide-mobile" style={{ color: 'var(--text-muted)' }}>
                Utilizá el formulario lateral para agregar tu primera profesión.
              </p>
            </div>
          ) : (
            <>
              {/* Tabla para Desktop (hide-mobile) */}
              <div className="table-wrapper hide-mobile">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Nombre</th>
                      <th>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {professions.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                            <span style={{ fontSize: '1.2rem' }}>🏅</span>
                            {p.name}
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {p.description || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin descripción</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards para Mobile (show-mobile) */}
              <div className="card-list show-mobile">
                {professions.map((p) => (
                  <Card key={p.id} className="profession-card" style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span style={{ fontSize: '1.4rem', marginTop: '2px' }}>🏅</span>
                      <div style={{ flex: 1 }}>
                        <h3 className="profession-name" style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {p.name}
                        </h3>
                        {p.description && (
                          <p className="profession-description" style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.88rem', lineHeight: '1.4' }}>
                            {p.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal para Celular (Mobile UI Form) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Crear Profesión"
        size="md"
      >
        {renderForm(true)}
      </Modal>
    </div>
  );
}

