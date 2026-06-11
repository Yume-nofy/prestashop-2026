import React, { useState, useEffect } from 'react';
import { apiLocalStatus } from '../api/configApi';

const StatusConfigPage = () => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editingStatus, setEditingStatus] = useState(null);
  
  // INITIALISATION DE LA LANGUE VIA LOCALSTORAGE (Défaut : 'fr')
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('kanban_lang') || 'fr';
  });

  // RECHARGER LES STATUTS À CHAQUE FOIS QUE LA LANGUE CHANGE
  useEffect(() => {
    loadStatuses();
  }, [currentLang]);

  // Passe la langue choisie à l'API SQLite
  const loadStatuses = async () => {
    setLoading(true);
    try {
      const res = await apiLocalStatus(`status?lang=${currentLang}`); 
      setStatuses(res);
    } catch (err) {
      setMessage({ text: "Impossible de charger les statuts depuis SQLite.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // HANDLER POUR CHANGER LA LANGUE
  const handleLangChange = (lang) => {
    setCurrentLang(lang);
    localStorage.setItem('kanban_lang', lang);
  };

  const handleEditClick = (status) => {
    // Si l'API retourne uniquement {id, couleur, name}, on garde l'ancienne structure adaptative
    setEditingStatus({
      id: status.id,
      couleur: status.couleur || '#00d2ff',
      name_fr: status.name_fr || status.name || '', 
      name_mg: status.name_mg || status.name || ''
    });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingStatus) return;

    try {
      await apiLocalStatus(`status/${editingStatus.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingStatus)
      });

      setMessage({ text: "Configuration mise à jour avec succès !", type: 'success' });
      setEditingStatus(null);
      loadStatuses(); // Rafraîchit la liste avec la langue en cours
    } catch (err) {
      setMessage({ text: `Erreur de modification : ${err.message}`, type: 'error' });
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Connexion à la base de données locale...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      
      {/* HEADER AVEC LE SÉLECTEUR DE LANGUE */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Personnalisation du Tableau Kanban</h2>
          <p style={styles.subtitle}>Modifiez librement la couleur ou les traductions de vos colonnes.</p>
        </div>
        
        {/* 🌟 ZONE DES BOUTONS DE LANGUE */}
        <div style={styles.langSelectorContainer}>
          <span style={styles.langLabel}>Langue active :</span>
          <button 
            onClick={() => handleLangChange('fr')} 
            style={currentLang === 'fr' ? styles.btnLangActive : styles.btnLangInactive}
          >
            Français
          </button>
          <button 
            onClick={() => handleLangChange('mg')} 
            style={currentLang === 'mg' ? styles.btnLangActive : styles.btnLangInactive}
          >
            Malagasy
          </button>
        </div>
      </div>

      {message.text && (
        <div style={message.type === 'success' ? styles.alertSuccess : styles.alertError}>
          {message.text}
        </div>
      )}

      <div style={styles.layout}>
        {/* LISTE DES STATUTS ACTUELS */}
        <div style={styles.listContainer}>
          <h3 style={styles.sectionTitle}>Statuts Enregistrés ({currentLang.toUpperCase()})</h3>
          <div style={styles.grid}>
            {statuses.map(s => (
              <div key={s.id} style={{ ...styles.statusCard, borderLeft: `6px solid ${s.couleur}` }}>
                <div style={styles.cardInfo}>
                  <div style={styles.statusName}>
                    Nom : {s.name || '-'}
                  </div>
                  <div style={styles.colorPreview}>
                    <span style={{ ...styles.colorDot, backgroundColor: s.couleur }} />
                    <code>{s.couleur}</code>
                  </div>
                </div>
                <button onClick={() => handleEditClick(s)} style={styles.btnEdit}>
                  Configurer
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FORMULAIRE DE MODIFICATION */}
        {editingStatus && (
          <div style={styles.formContainer}>
            <h3 style={styles.sectionTitle}>Modifier le Statut #{editingStatus.id}</h3>
            <form onSubmit={handleUpdateSubmit} style={styles.form}>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Couleur de fond / Thème</label>
                <div style={styles.colorPickerWrapper}>
                  <input 
                    type="color" 
                    value={editingStatus.couleur.startsWith('#') ? editingStatus.couleur : '#00d2ff'} 
                    onChange={(e) => setEditingStatus(prev => ({ ...prev, couleur: e.target.value }))}
                    style={styles.colorPicker}
                  />
                  <input 
                    type="text" 
                    value={editingStatus.couleur} 
                    onChange={(e) => setEditingStatus(prev => ({ ...prev, couleur: e.target.value }))}
                    style={styles.input}
                    placeholder="#00d2ff"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Nom en Français</label>
                <input 
                  type="text" 
                  value={editingStatus.name_fr} 
                  onChange={(e) => setEditingStatus(prev => ({ ...prev, name_fr: e.target.value }))}
                  style={styles.input}
                  placeholder="Ex: Nouveau"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Nom en Malgache</label>
                <input 
                  type="text" 
                  value={editingStatus.name_mg} 
                  onChange={(e) => setEditingStatus(prev => ({ ...prev, name_mg: e.target.value }))}
                  style={styles.input}
                  placeholder="Ex: Vaovao"
                />
              </div>

              <div style={styles.actions}>
                <button type="button" onClick={() => setEditingStatus(null)} style={styles.btnCancel}>
                  Annuler
                </button>
                <button type="submit" style={styles.btnSave}>
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

// Objets de styles augmentés pour le sélecteur de langue
const styles = {
  page: { backgroundColor: '#121212', minHeight: '100vh', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', padding: '30px' },
  header: { marginBottom: '24px', borderBottom: '1px solid #223049', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '22px', fontWeight: '700', color: '#00d2ff', margin: '0 0 6px 0' },
  subtitle: { fontSize: '13px', color: '#cbd5e1', margin: 0 },
  
  // Nouveaux styles pour les langues
  langSelectorContainer: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#1e1e1e', padding: '6px 12px', borderRadius: '6px', border: '1px solid #2d3748' },
  langLabel: { fontSize: '12px', color: '#94a3b8', fontWeight: '600' },
  btnLangActive: { backgroundColor: '#00d2ff', border: 'none', color: '#121212', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' },
  btnLangInactive: { backgroundColor: '#121212', border: '1px solid #334155', color: '#cbd5e1', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },

  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#121212' },
  loadingText: { color: '#00d2ff', fontFamily: 'monospace' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'flex-start' },
  listContainer: { backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #2d3748' },
  formContainer: { backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #334155' },
  sectionTitle: { fontSize: '15px', color: '#00d2ff', fontWeight: '700', margin: '0 0 16px 0', textTransform: 'uppercase' },
  grid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  statusCard: { backgroundColor: '#121212', padding: '14px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #2d3748' },
  cardInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  statusName: { fontSize: '13px', fontWeight: '600' },
  colorPreview: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' },
  colorDot: { width: '12px', height: '12px', borderRadius: '50%', display: 'inline-block' },
  btnEdit: { backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', color: '#cbd5e1', fontWeight: '600' },
  input: { backgroundColor: '#121212', border: '1px solid #334155', color: '#f8fafc', padding: '10px', borderRadius: '6px', fontSize: '13px', outline: 'none', flexGrow: 1 },
  colorPickerWrapper: { display: 'flex', gap: '10px', alignItems: 'center' },
  colorPicker: { border: 'none', width: '40px', height: '38px', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' },
  btnCancel: { backgroundColor: 'transparent', border: '1px solid #334155', color: '#cbd5e1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  btnSave: { backgroundColor: '#00d2ff', border: 'none', color: '#121212', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' },
  alertSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px' },
  alertError: { backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px' }
};

export default StatusConfigPage;