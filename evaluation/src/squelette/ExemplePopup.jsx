import React, { useState } from 'react';
import Popup from './Popup';

const MonComposant = () => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div style={styles.parent}>
      <h1>Espace de travail</h1>
      <p>La popup s'affichera uniquement dans ce cadre bleu.</p>
      
      <button onClick={() => setShowPopup(true)}>Ouvrir la popup</button>

      {/* Appel de la Popup */}
      <Popup 
        isOpen={showPopup} 
        onClose={() => setShowPopup(false)} 
        title="Confirmation"
      >
        <p>Voulez-vous vraiment enregistrer ces modifications ?</p>
        <button onClick={() => setShowPopup(false)}>Oui, je suis sûr</button>
      </Popup>
    </div>
  );
};

const styles = {
  parent: {
    position: 'relative', // INDISPENSABLE pour que la popup soit contenue ici
    width: '500px',
    height: '300px',
    border: '2px dashed #007bff',
    padding: '20px',
    margin: '50px auto',
    overflow: 'hidden' // Empêche le dépassement visuel
  }
};

export default MonComposant;