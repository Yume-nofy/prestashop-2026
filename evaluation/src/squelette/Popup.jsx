import React from 'react';

const Popup = ({ isOpen, onClose, title, children }) => {
  // Si la popup n'est pas ouverte, on ne renvoie rien
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>{title}</h3>
          <button onClick={onClose} style={styles.closeBtn}>&times;</button>
        </div>
        <div style={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'absolute', // Reste dans le parent positionné
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: '8px', // Optionnel : pour matcher les bords du parent
  },
  modal: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    width: '80%',
    maxWidth: '300px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  title: { margin: 0, fontSize: '1.1rem' },
  closeBtn: { border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' },
  content: { fontSize: '0.9rem', color: '#444' }
};

export default Popup;