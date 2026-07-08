import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '80vh',
      padding: '20px',
      color: 'var(--text-primary)',
      textAlign: 'center'
    }}>
      <Card style={{
        maxWidth: '480px',
        width: '100%',
        padding: '40px 24px',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        background: 'rgba(239, 68, 68, 0.02)',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{
          fontSize: '4.5rem',
          marginBottom: '16px',
          filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.3))'
        }}>
          🚫
        </div>
        <h1 style={{
          fontSize: '1.6rem',
          fontWeight: 800,
          color: '#ef4444',
          marginBottom: '12px',
          letterSpacing: '-0.025em'
        }}>
          Acceso Denegado
        </h1>
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          marginBottom: '28px',
          maxWidth: '360px'
        }}>
          No tiene permisos para acceder a esta sección. Si creés que esto es un error, por favor contactate con soporte o volvé al inicio.
        </p>
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
          style={{
            borderColor: 'rgba(239, 68, 68, 0.4)',
            color: '#ef4444',
            padding: '10px 24px',
            fontSize: '0.92rem',
            fontWeight: 600,
            background: 'rgba(239, 68, 68, 0.05)'
          }}
        >
          ← Volver al Dashboard
        </Button>
      </Card>
    </div>
  );
}
