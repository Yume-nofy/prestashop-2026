import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginBack = () => {
  const [formData, setFormData] = useState({
    nom: ''
  });
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (error) setError(false); // Réinitialise l'erreur dès que l'utilisateur saisit à nouveau
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.nom === "admin1234") {
      localStorage.setItem('adminSession', 'admin');
      navigate("/admin");
    } else {
      setError(true);
      setFormData({ nom: '' }); // Efface le mauvais mot de passe
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>GLPI Admin</h2>
          <p style={styles.subtitle}>Authentification requise pour l'accès au Backoffice</p>
        </div>
        
        {error && (
          <div style={styles.alertError}>
            Code d'accès administrateur invalide.
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Champ unique : Clé d'accès */}
          <div style={styles.inputGroup}>
            <label htmlFor="nom" style={styles.label}>Clé d'accès unique :</label>
            <input
              type="password"
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              placeholder="••••••••••••"
              required
              style={styles.input}
            />
          </div>

          {/* Bouton de soumission */}
          <button type="submit" style={styles.button}>
            Se connecter au terminal
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  page: {
    backgroundColor: '#121212',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '20px',
    boxSizing: 'border-box'
  },
  container: {
    maxWidth: '400px',
    width: '100%',
    backgroundColor: '#1e1e1e',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '32px',
    boxSizing: 'border-box'
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px'
  },
  title: {
    margin: '0 0 6px 0',
    fontSize: '22px',
    fontWeight: '700',
    color: '#00d2ff',
    letterSpacing: '0.5px'
  },
  subtitle: {
    margin: 0,
    fontSize: '13px',
    color: '#cbd5e1',
    lineHeight: '1.4'
  },
  alertError: {
    padding: '10px 12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    color: '#ef4444',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    backgroundColor: '#121212',
    border: '1px solid #334155',
    borderRadius: '6px',
    color: '#f8fafc',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'monospace',
    transition: 'border-color 0.2s'
  },
  button: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '700',
    backgroundColor: '#00d2ff',
    color: '#121212',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    letterSpacing: '0.5px'
  }
};

export default LoginBack;