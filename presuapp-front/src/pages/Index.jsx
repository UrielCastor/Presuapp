import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Loading from '../components/Loading';
import { useAuth } from '../hooks/useAuth';

export default function Index() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch initial directory of professionals
  const fetchProfessionals = async (query = '') => {
    try {
      const res = await axiosInstance.get(`/professionals?q=${encodeURIComponent(query)}`);
      setProfessionals(res.data.data || []);
    } catch (err) {
      console.error('Error fetching professionals:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search logic or simple instantaneous search on writing
  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetchProfessionals(searchQuery);
    }, 300); // 300ms debounce to prevent constant server hit

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleOpenProfile = (prof) => {
    setSelectedProfessional(prof);
    setModalOpen(true);
  };

  return (
    <div className="index-landing-container">
      {/* Dynamic Landing Header / Navbar area */}
      <header className="landing-navigation">
        <div className="landing-nav-container">
          <div className="brand" onClick={() => navigate('/')}>
            <span className="brand-icon">⚡</span>
            <span className="brand-logo-text">PresuApp</span>
          </div>
          <div className="landing-nav-actions">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ marginRight: '10px' }}>
                  Dashboard
                </Button>
                <Button variant="primary" onClick={() => { logout(); navigate('/login'); }}>
                  Cerrar sesión
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')} style={{ marginRight: '10px' }}>
                  Iniciar sesión
                </Button>
                <Button variant="primary" onClick={() => navigate('/register')}>
                  Registrarse
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Encontrá el Profesional Ideal</h1>
          <p className="hero-subtitle">
            Buscá electricistas, plomeros, gasistas y técnicos independientes registrados en todo el país.
          </p>
        </div>
      </section>

      {/* Search and Filters Section */}
      <section className="search-section-wrapper">
        <div className="search-box-card">
          <div className="main-search-input-wrapper">
            <span className="search-box-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre, profesión, ciudad o localidad..."
              className="main-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <p className="search-helper-text">
            Buscá y filtrá dinámicamente. Tip: Escribí "VIP" o el nombre de una localidad como "CABA".
          </p>
        </div>
      </section>

      {/* Results Section */}
      <section className="results-grid-section">
        {loading ? (
          <Loading message="Buscando profesionales disponibles..." />
        ) : professionals.length === 0 ? (
          <div className="no-results-card">
            <div className="no-results-icon">🔍</div>
            <h3>No se encontraron profesionales para tu búsqueda.</h3>
            <p>Intentá modificando los filtros o buscando palabras clave más directas.</p>
          </div>
        ) : (
          <div className="professionals-cards-grid">
            {professionals.map((prof) => (
              <Card key={prof.id} className={`professional-result-card ${prof.userType === 'VIP' ? 'vip-starred' : ''}`}>
                
                {/* Header elements */}
                <div className="prof-card-top">
                  <div className="avatar-section">
                    <div className={`prof-large-avatar ${prof.userType === 'VIP' ? 'vip-avatar-border' : ''}`}>
                      {prof.name[0].toUpperCase()}
                    </div>
                    {prof.userType === 'VIP' && (
                      <span className="badge-vip-shield">👑 VIP</span>
                    )}
                  </div>
                  <div className="prof-name-info">
                    <h3 className="prof-card-name">{prof.name}</h3>
                    <div className="prof-residence-row">
                      <span className="residence-pin">📍</span>
                      <span className="residence-text">
                        {prof.locality || prof.city ? `${prof.locality || ''}, ${prof.city || ''}` : 'Residencia no especificada'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body elements */}
                <div className="prof-card-body">
                  {/* Professions list */}
                  <div className="professions-tags-wrapper">
                    {prof.professions && prof.professions.length > 0 ? (
                      prof.professions.map((p) => (
                        <span key={p.id} className="profession-tag">🏅 {p.name}</span>
                      ))
                    ) : (
                      <span className="profession-tag tag-empty">Servicios independientes</span>
                    )}
                  </div>

                  {/* Description preview */}
                  <p className="prof-bio-preview">
                    {prof.professions?.[0]?.description || 
                     `Especialista en servicios de ${prof.professions?.[0]?.name || 'rubros generales'}. Consultá por presupuestos sin cargo.`}
                  </p>
                </div>

                {/* Footer action button */}
                <div className="prof-card-footer">
                  <Button 
                    variant={prof.userType === 'VIP' ? 'primary' : 'secondary'} 
                    fullWidth 
                    onClick={() => handleOpenProfile(prof)}
                  >
                    Ver Perfil
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Modal detail */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Perfil del Profesional"
        size="md"
      >
        {selectedProfessional && (
          <div className="professional-detail-modal-body">
            <div className="modal-profile-header">
              <div className={`modal-large-avatar ${selectedProfessional.userType === 'VIP' ? 'vip' : ''}`}>
                {selectedProfessional.name[0].toUpperCase()}
              </div>
              <div className="modal-header-text">
                <h2>{selectedProfessional.name}</h2>
                {selectedProfessional.userType === 'VIP' && (
                  <span className="modal-vip-badge">Membresía VIP ⭐</span>
                )}
              </div>
            </div>

            <div className="profile-details-list">
              <div className="detail-item">
                <span className="detail-label">Localidad / Ubicación:</span>
                <span className="detail-value">
                  {selectedProfessional.locality || selectedProfessional.city 
                    ? `${selectedProfessional.locality || ''}, ${selectedProfessional.city || ''}` 
                    : 'No provisto'}
                </span>
              </div>
              
              {selectedProfessional.email && (
                <div className="detail-item">
                  <span className="detail-label">Correo Electrónico:</span>
                  <span className="detail-value">
                    <a href={`mailto:${selectedProfessional.email}`}>{selectedProfessional.email}</a>
                  </span>
                </div>
              )}

              {selectedProfessional.phone && (
                <div className="detail-item">
                  <span className="detail-label">Teléfono de Contacto:</span>
                  <span className="detail-value">
                    <a href={`tel:${selectedProfessional.phone}`}>{selectedProfessional.phone}</a>
                  </span>
                </div>
              )}

              <div className="detail-item">
                <span className="detail-label">Rubros Registrados:</span>
                <div className="professions-tags-wrapper" style={{ marginTop: '8px' }}>
                  {selectedProfessional.professions && selectedProfessional.professions.length > 0 ? (
                    selectedProfessional.professions.map((p) => (
                      <span key={p.id} className="profession-tag">🏅 {p.name}</span>
                    ))
                  ) : (
                    <span className="profession-tag tag-empty">Servicios generales</span>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <Button variant="primary" fullWidth onClick={() => setModalOpen(false)}>
                Cerrar Perfil
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
