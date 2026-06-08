import React, { useState } from 'react';

const FormulaireSquelette = () => {
  // 1. Initialisation de l'état adapté pour la création d'un incident GLPI
  const [formData, setFormData] = useState({
    title: '',
    category: 'Computer',
    content: ''
  });

  // 2. Gestion dynamique et générique des changements de saisie
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // 3. Gestion de la soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Traitement ou routage vers ton service CrudService (ex: createGlpiTicket)
    console.log('Payload du ticket soumis à l\'API :', formData);
    
    // Réinitialisation optionnelle du formulaire aux valeurs d'usine
    // setFormData({ title: '', category: 'Computer', content: '' });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.mainTitle}>Ouverture d'un Ticket d'Assistance</h2>
        <p style={styles.subtitle}>Déclaration immédiate d'une anomalie ou d'un besoin matériel.</p>
      </div>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Champ 1 : Intitulé ou Titre de l'incident */}
        <div style={styles.inputGroup}>
          <label htmlFor="title" style={styles.label}>Intitulé de l'incident / Demande :</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Ex: Dysfonctionnement de la carte réseau ou écran noir"
            required
            style={styles.input}
          />
        </div>

        {/* Champ 2 : Catégorie d'équipement impacté */}
        <div style={styles.inputGroup}>
          <label htmlFor="category" style={styles.label}>Catégorie de l'élément :</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            style={styles.select}
          >
            <option value="Computer">Computer (Ordinateur)</option>
            <option value="Monitor">Monitor (Écran)</option>
            <option value="NetworkEquipment">NetworkEquipment (Réseau)</option>
            <option value="Peripheral">Peripheral (Périphérique)</option>
          </select>
        </div>

        {/* Champ 3 : Description détaillée */}
        <div style={styles.inputGroup}>
          <label htmlFor="content" style={styles.label}>Description textuelle de l'anomalie :</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Veuillez décrire précisément les symptômes constatés, les codes d'erreur ou la référence du matériel..."
            required
            rows="5"
            style={styles.textarea}
          />
        </div>

        {/* Bouton d'exécution de la requête */}
        <button type="submit" style={styles.button}>
          Soumettre le ticket au support
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: { 
    maxWidth: '600px', 
    margin: '40px auto', 
    backgroundColor: '#1e1e1e', 
    border: '1px solid #334155', 
    borderRadius: '8px', 
    padding: '32px', 
    boxSizing: 'border-box',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#f8fafc' 
  },
  header: { 
    borderBottom: '1px solid #334155', 
    paddingBottom: '16px', 
    marginBottom: '24px' 
  },
  mainTitle: { 
    fontSize: '20px', 
    fontWeight: '700', 
    color: '#00d2ff', 
    margin: '0 0 6px 0' 
  },
  subtitle: { 
    fontSize: '13px', 
    color: '#cbd5e1', 
    margin: 0 
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
    transition: 'border-color 0.2s' 
  },
  select: { 
    width: '100%', 
    padding: '12px', 
    fontSize: '14px', 
    backgroundColor: '#121212', 
    border: '1px solid #334155', 
    borderRadius: '6px', 
    color: '#f8fafc', 
    boxSizing: 'border-box', 
    outline: 'none' 
  },
  textarea: { 
    width: '100%', 
    padding: '12px', 
    fontSize: '14px', 
    backgroundColor: '#121212', 
    border: '1px solid #334155', 
    borderRadius: '6px', 
    color: '#f8fafc', 
    boxSizing: 'border-box', 
    outline: 'none', 
    resize: 'vertical', 
    lineHeight: '1.5',
    fontFamily: 'inherit'
  },
  button: { 
    width: '100%', 
    padding: '14px', 
    fontSize: '13px', 
    fontWeight: '700', 
    backgroundColor: '#00d2ff', 
    color: '#121212', 
    border: 'none', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    transition: 'background 0.2s', 
    textTransform: 'uppercase', 
    letterSpacing: '0.5px',
    marginTop: '8px'
  }
};

export default FormulaireSquelette;