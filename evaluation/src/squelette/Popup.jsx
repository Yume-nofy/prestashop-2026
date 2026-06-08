import React from 'react';

const Popup = ({ isOpen, onClose, title, children }) => {
  // Si la popup n'est pas activée, le rendu est intercepté et renvoie null
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* En-tête de la fenêtre modale */}
        <div style={styles.header}>
          <h3 style={styles.title}>{title}</h3>
          <button 
            onClick={onClose} 
            style={styles.closeBtn}
            onMouseOver={(e) => e.target.style.color = '#ef4444'}
            onMouseOut={(e) => e.target.style.color = '#64748b'}
          >
            &times;
          </button>
        </div>
        
        {/* Zone d'injection du contenu enfant */}
        <div style={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'absolute', // Structurel : reste strictement bridé au parent conteneur possédant une position relative
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18, 18, 18, 0.85)', // Assombrissement en accord avec le thème dark
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    borderRadius: '6px', // Aligné sur le rayon de courbure du parent
    backdropFilter: 'blur(2px)' // Léger flou d'arrière-plan pour isoler la modale
  },
  modal: {
    backgroundColor: '#121212',
    border: '1px solid #334155',
    padding: '20px',
    borderRadius: '6px',
    width: '85%',
    maxWidth: '340px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
    boxSizing: 'border-box'
  },
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '16px',
    borderBottom: '1px solid #1e1e1e',
    paddingBottom: '8px'
  },
  title: { 
    margin: 0, 
    fontSize: '14px', 
    fontWeight: '700', 
    color: '#00d2ff',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  closeBtn: { 
    border: 'none', 
    background: 'none', 
    fontSize: '22px', 
    lineHeight: '1',
    color: '#64748b', 
    cursor: 'pointer',
    padding: '0 4px',
    transition: 'color 0.2s',
    marginTop: '-4px'
  },
  content: { 
    fontSize: '13px', 
    color: '#cbd5e1',
    lineHeight: '1.5'
  }
};

export default Popup;