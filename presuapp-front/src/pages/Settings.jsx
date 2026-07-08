import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';
import Card from '../components/Card';

const THEMES_LIST = [
  { id: 'light', name: '☀️ Claro', class: 'theme-light', primaryColor: '#2563eb', bgPreview: '#f1f5f9', borderInfo: '#cbd5e1' },
  { id: 'dark', name: '🌙 Oscuro', class: 'theme-dark', primaryColor: '#6366f1', bgPreview: '#0f0f13', borderInfo: 'rgba(255, 255, 255, 0.07)' },
  { id: 'blue', name: '💙 Azul', class: 'theme-blue', primaryColor: '#0284c7', bgPreview: '#0b1329', borderInfo: 'rgba(147, 197, 253, 0.1)' },
  { id: 'green', name: '💚 Verde', class: 'theme-green', primaryColor: '#059669', bgPreview: '#06120e', borderInfo: 'rgba(167, 243, 208, 0.08)' },
  { id: 'purple', name: '🟣 Violeta', class: 'theme-purple', primaryColor: '#7c3aed', bgPreview: '#0c051a', borderInfo: 'rgba(221, 214, 254, 0.08)' },
  { id: 'orange', name: '🟧 Naranja', class: 'theme-orange', primaryColor: '#ea580c', bgPreview: '#140a05', borderInfo: 'rgba(254, 215, 170, 0.08)' },
  { id: 'black', name: '⚫ Negro', class: 'theme-black', primaryColor: '#e5e7eb', bgPreview: '#000000', borderInfo: '#262626' }
];

export default function Settings() {
  const { theme, changeTheme } = useAuth();

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, fontSize: '2rem' }}>
          ⚙️ Configuración
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.95rem' }}>
          Personalizá tu experiencia en PresuApp.
        </p>
      </div>

      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <span style={{ fontSize: '1.5rem' }}>🎨</span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Apariencia</h2>
        </div>

        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
          Seleccioná el tema de color que mejor se adapte a tu estilo de trabajo. Los cambios se aplicarán instantáneamente en toda la aplicación.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '8px'
        }}>
          {THEMES_LIST.map((themeItem) => {
            const isSelected = theme === themeItem.id;
            return (
              <div
                key={themeItem.id}
                onClick={() => changeTheme(themeItem.id)}
                style={{
                  border: isSelected ? '2px solid var(--brand-primary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-surface)',
                  transition: 'all var(--transition)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                  transform: isSelected ? 'scale(1.02)' : 'none'
                }}
                onMouseOver={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'var(--border-hover)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.transform = 'none';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {themeItem.name}
                  </span>
                  {isSelected && (
                    <span style={{
                      color: 'var(--brand-primary)',
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
                    }}>
                      ✓
                    </span>
                  )}
                </div>

                {/* Theme Palette Preview Box */}
                <div style={{
                  height: '60px',
                  borderRadius: '6px',
                  backgroundColor: themeItem.bgPreview,
                  border: `1px solid ${themeItem.borderInfo}`,
                  display: 'flex',
                  gap: '6px',
                  padding: '8px',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between'
                }}>
                  {/* Miniature representation */}
                  <div style={{
                    width: '30%',
                    height: '100%',
                    borderRadius: '4px',
                    backgroundColor: themeItem.primaryColor,
                    opacity: 0.85
                  }} />
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    width: '60%',
                    height: '100%',
                    justifyContent: 'center'
                  }}>
                    <div style={{ height: '4px', borderRadius: '2px', backgroundColor: themeItem.primaryColor, width: '100%' }} />
                    <div style={{ height: '4px', borderRadius: '2px', backgroundColor: themeItem.primaryColor, width: '60%', opacity: 0.6 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
