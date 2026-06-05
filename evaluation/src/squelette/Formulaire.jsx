import React, { useState } from 'react';

const FormulaireSquelette = () => {
  // 1. Initialisation de l'état pour les deux champs
  const [formData, setFormData] = useState({
    nom: '',
    email: ''
  });

  // 2. Gestion des changements dans les champs de saisie
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value // Met à jour dynamiquement le champ modifié
    });
  };

  // 3. Gestion de la soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault(); // Empêche le rechargement de la page
    
    // Traitement des données (ex: envoi à une API)
    console.log('Données soumises :', formData);
    
    // Optionnel : Réinitialiser le formulaire après soumission
    // setFormData({ nom: '', email: '' });
  };

  return (
    <div style={styles.container}>
      <h2>Formulaire de Contact</h2>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Champ 1 : Nom */}
        <div style={styles.inputGroup}>
          <label htmlFor="nom" style={styles.label}>Nom :</label>
          <input
            type="text"
            id="nom"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            placeholder="Votre nom"
            required
            style={styles.input}
          />
        </div>

        {/* Champ 2 : Email */}
        <div style={styles.inputGroup}>
          <label htmlFor="email" style={styles.label}>Email :</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="votre@email.com"
            required
            style={styles.input}
          />
        </div>

        {/* Bouton de soumission */}
        <button type="submit" style={styles.button}>
          Envoyer
        </button>
      </form>
    </div>
  );
};

// Petits styles en ligne pour rendre le squelette propre
const styles = {
  container: { maxWidth: '400px', margin: '20px auto', fontFamily: 'Arial, sans-serif' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontWeight: 'bold', fontSize: '14px' },
  input: { padding: '8px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' },
  button: { padding: '10px', fontSize: '16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

export default FormulaireSquelette;