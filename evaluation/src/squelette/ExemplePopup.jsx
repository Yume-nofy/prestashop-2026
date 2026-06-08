import React, { useState } from 'react';
import Popup from './Popup';

const MonComposant = () => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div style={styles.parent}>
      <div style={styles.header}>
        <h3 style={styles.title}>Zone de test isolée</h3>
        <span style={styles.badge}>Conteneur</span>
      </div>
      
      <p style={styles.description}>
        Le cycle de rendu de la fenêtre modale est restreint aux limites de ce cadre technique.
      </p>
      
      <button 
        onClick={() => setShowPopup(true)} 
        style={styles.openBtn}
        onMouseOver={(e) => e.target.style.backgroundColor = '#00bfe6'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#00d2ff'}
      >
        Initialiser la popup
      </button>

      {/* Instance de la Popup bridée au parent */}
      <Popup 
        isOpen={showPopup} 
        onClose={() => setShowPopup(false)} 
        title="Validation Système"
      >
        <p style={styles.popupText}>Confirmez-vous l'application immédiate de ces paramètres sur l'instance en cours ?</p>
        <button 
          onClick={() => setShowPopup(false)} 
          style={styles.confirmBtn}
          onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0, 210, 255, 0.15)'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(0, 210, 255, 0.05)'}
        >
          Exécuter la directive
        </button>
      </Popup>
    </div>
  );
};

const styles = {
  parent: {
    position: 'relative', // Structurellement indispensable pour contenir le positionnement absolu de la popup
    width: '500px',
    height: '320px',
    backgroundColor: '#1e1e1e',
    border: '2px dashed #334155',
    borderRadius: '8px',
    padding: '24px',
    margin: '50px auto',
    boxSizing: 'border-box',
    overflow: 'hidden', // Sécurité : empêche tout débordement visuel du sous-composant
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #334155',
    paddingBottom: '12px'
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: '0.5px'
  },
  badge: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#64748b',
    border: '1px solid #334155',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase'
  },
  description: {
    fontSize: '13px',
    color: '#cbd5e1',
    lineHeight: '1.5',
    margin: '16px 0'
  },
  openBtn: {
    backgroundColor: '#00d2ff',
    color: '#121212',
    border: 'none',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    width: '100%',
    textAlign: 'center'
  },
  popupText: {
    fontSize: '13px',
    color: '#cbd5e1',
    lineHeight: '1.5',
    margin: '0 0 16px 0'
  },
  confirmBtn: {
    backgroundColor: 'rgba(0, 210, 255, 0.05)',
    border: '1px solid #00d2ff',
    color: '#00d2ff',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    width: '100%'
  }
};

export default MonComposant;