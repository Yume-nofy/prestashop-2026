import React, { useState, useEffect } from 'react';
import { fetchGlpiItems, linkItemToTicket } from '../services/CrudService';
import { apiGlpi } from '../api/apiGlpi';

const CreateTicket = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [urgency, setUrgency] = useState('3'); 

  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]); 
  
  const [loading, setLoading] = useState(false);
  const [loadingParc, setLoadingParc] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadParcItems();
  }, []);

  const loadParcItems = async () => {
    try {
      const typesToFetch = ['Computer', 'Monitor', 'NetworkEquipment', 'Peripheral'];
      const promises = typesToFetch.map(async (type) => {
        try {
          const res = await fetchGlpiItems(type);
          const clean = Array.isArray(res) ? res : [];
          return clean.map(item => ({
            id: item.id,
            name: item.name || `${type} #${item.id}`,
            itemtype: type,
            serial: item.serial || ''
          }));
        } catch {
          return [];
        }
      });

      const results = await Promise.all(promises);
      setAvailableItems(results.flat());
    } catch (err) {
      console.error("Erreur lors du chargement des elements du parc", err);
    } finally {
      setLoadingParc(false);
    }
  };

  const handleAddItem = (e) => {
    const value = e.target.value;
    if (!value) return;

    const [itemtype, id] = value.split('-');
    const itemToAdd = availableItems.find(i => i.id === parseInt(id) && i.itemtype === itemtype);

    if (itemToAdd && !selectedItems.some(i => i.id === itemToAdd.id && i.itemtype === itemToAdd.itemtype)) {
      setSelectedItems([...selectedItems, itemToAdd]);
    }
    
    e.target.value = '';
  };

  const handleRemoveItem = (itemtype, id) => {
    setSelectedItems(selectedItems.filter(i => !(i.id === id && i.itemtype === itemtype)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) {
      setMessage({ text: 'Veuillez remplir le titre et la description.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const cleanContent = content.trim().replace(/[\r\n]+/g, '\\n');

      const ticketResponse = await apiGlpi('Ticket', {
        method: 'POST',
        body: JSON.stringify({
          input: {
            name: title.trim(),
            content: cleanContent,
            urgency: parseInt(urgency, 10)
          }
        })
      });

      let createdTicketId = null;
      if (ticketResponse) {
        if (ticketResponse.id) {
          createdTicketId = ticketResponse.id;
        } else if (Array.isArray(ticketResponse) && ticketResponse[0]?.id) {
          createdTicketId = ticketResponse[0].id;
        }
      }

      if (!createdTicketId) {
        throw new Error("L'API GLPI a accepte le JSON mais n'a pas retourne d'ID valide.");
      }

      if (selectedItems.length > 0) {
        const linkPromises = selectedItems.map(item => 
          linkItemToTicket(createdTicketId, item.itemtype, item.id)
        );
        await Promise.all(linkPromises);
      }

      setMessage({ text: `Ticket #${createdTicketId} cree et materiels associes avec succes.`, type: 'success' });
      
      setTitle('');
      setContent('');
      setUrgency('3');
      setSelectedItems([]);

    } catch (err) {
      console.error("Details de l'erreur GLPI Payload:", err);
      setMessage({ text: `Echec de la creation du ticket : ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.mainTitle}>Ouverture d'un Incident</h2>
        <p style={styles.subtitle}>Enregistrez une nouvelle declaration d'anomalie dans le systeme de centralisation GLPI.</p>
      </div>

      {message.text && (
        <div style={message.type === 'success' ? styles.alertSuccess : styles.alertError}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        
        {/* Titre */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Intitule de l'incident</label>
          <input 
            type="text"
            placeholder="Ex: Defaillance d'affichage ou rupture de liaison reseau"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
          />
        </div>

        {/* Urgence */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Niveau d'urgence declare</label>
          <select 
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
            style={styles.select}
          >
            <option value="5">5 - Tres haute</option>
            <option value="4">4 - Haute</option>
            <option value="3">3 - Moyenne</option>
            <option value="2">2 - Basse</option>
            <option value="1">1 - Tres basse</option>
          </select>
        </div>

        {/* Description */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Description detaillee des symptomes</label>
          <textarea 
            rows="5"
            placeholder="Saisissez les precisions techniques concernant le dysfonctionnement..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={styles.textarea}
          />
        </div>

        {/* Association de materiels */}
        <div style={styles.parcSection}>
          <label style={styles.parcTitle}>Liaison d'equipements du parc (Optionnel)</label>
          
          {loadingParc ? (
            <p style={styles.loadingText}>Indexation des elements du parc en cours...</p>
          ) : (
            <select 
              onChange={handleAddItem}
              defaultValue=""
              style={styles.select}
            >
              <option value="" disabled>-- Selectionner un equipement a lier --</option>
              {availableItems.map(item => (
                <option key={`${item.itemtype}-${item.id}`} value={`${item.itemtype}-${item.id}`}>
                  [{item.itemtype}] {item.name} {item.serial && `(S/N: ${item.serial})`}
                </option>
              ))}
            </select>
          )}

          {/* Liste des badges d'association */}
          <div style={styles.badgeContainer}>
            {selectedItems.map(item => (
              <span key={`${item.itemtype}-${item.id}`} style={styles.badge}>
                <strong style={styles.badgeType}>{item.itemtype}:</strong> {item.name}
                <button 
                  type="button"
                  onClick={() => handleRemoveItem(item.itemtype, item.id)}
                  style={styles.badgeRemoveBtn}
                >
                  &times;
                </button>
              </span>
            ))}
            {selectedItems.length === 0 && (
              <span style={styles.emptyBadgeText}>Aucune liaison active pour ce ticket.</span>
            )}
          </div>
        </div>

        {/* Bouton de validation */}
        <button 
          type="submit"
          disabled={loading}
          style={loading ? styles.btnDisabled : styles.btnActive}
        >
          {loading ? 'Enregistrement du ticket...' : 'Valider et creer le ticket'}
        </button>

      </form>
    </div>
  );
};

const styles = {
  page: { backgroundColor: '#121212', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { borderBottom: '1px solid #334155', paddingBottom: '16px', marginBottom: '24px' },
  mainTitle: { fontSize: '22px', fontWeight: '700', color: '#00d2ff', margin: '0 0 6px 0' },
  subtitle: { fontSize: '13px', color: '#cbd5e1', margin: 0 },
  alertSuccess: { padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', fontWeight: '600', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981' },
  alertError: { padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', fontWeight: '600', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#cbd5e1' },
  input: { width: '100%', padding: '10px 12px', backgroundColor: '#1e1e1e', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px 12px', backgroundColor: '#1e1e1e', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 12px', backgroundColor: '#1e1e1e', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' },
  parcSection: { backgroundColor: '#1e1e1e', border: '1px solid #334155', padding: '20px', borderRadius: '8px' },
  parcTitle: { display: 'block', fontSize: '13px', fontWeight: '700', color: '#00d2ff', marginBottom: '12px' },
  loadingText: { fontSize: '12px', color: '#64748b', margin: 0, fontFamily: 'monospace' },
  badgeContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' },
  badge: { backgroundColor: '#121212', color: '#cbd5e1', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '10px', border: '1px solid #334155' },
  badgeType: { color: '#00d2ff' },
  badgeRemoveBtn: { border: 'none', background: 'none', color: '#ef4444', fontWeight: '700', cursor: 'pointer', fontSize: '14px', padding: 0 },
  emptyBadgeText: { fontSize: '12px', color: '#64748b', fontStyle: 'italic' },
  btnActive: { backgroundColor: '#00d2ff', color: '#121212', border: 'none', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: 'background 0.2s', marginTop: '8px', alignSelf: 'flex-start' },
  btnDisabled: { backgroundColor: '#1e293b', color: '#64748b', border: '1px solid #334155', padding: '12px 24px', borderRadius: '6px', cursor: 'not-allowed', fontWeight: '700', fontSize: '14px', marginTop: '8px', alignSelf: 'flex-start' }
};

export default CreateTicket;