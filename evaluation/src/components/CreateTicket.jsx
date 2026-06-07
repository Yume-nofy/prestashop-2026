import React, { useState, useEffect } from 'react';
import { fetchGlpiItems, linkItemToTicket } from '../services/CrudService';
import { apiGlpi } from '../api/apiGlpi';

const CreateTicket = () => {
  // États du formulaire de ticket
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [urgency, setUrgency] = useState('3'); 

  // États pour la liste du parc et la sélection
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]); // Tableau d'objets [{id, itemtype, name}]
  
  const [loading, setLoading] = useState(false);
  const [loadingParc, setLoadingParc] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadParcItems();
  }, []);

  // Charger tous les éléments disponibles pour pouvoir les associer au ticket
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
      console.error("Erreur lors du chargement des éléments du parc", err);
    } finally {
      setLoadingParc(false);
    }
  };

  // Gérer l'ajout d'un élément à la liste des éléments associés
  const handleAddItem = (e) => {
    const value = e.target.value;
    if (!value) return;

    // La valeur contient "itemtype-id"
    const [itemtype, id] = value.split('-');
    const itemToAdd = availableItems.find(i => i.id === parseInt(id) && i.itemtype === itemtype);

    if (itemToAdd && !selectedItems.some(i => i.id === itemToAdd.id && i.itemtype === itemToAdd.itemtype)) {
      setSelectedItems([...selectedItems, itemToAdd]);
    }
    
    // Réinitialiser le select
    e.target.value = '';
  };

  // Retirer un élément de la liste des associations
  const handleRemoveItem = (itemtype, id) => {
    setSelectedItems(selectedItems.filter(i => !(i.id === id && i.itemtype === itemtype)));
  };

  // Soumission du ticket
 const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) {
      setMessage({ text: 'Veuillez remplir le titre et la description.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Nettoyage du contenu pour éviter les caractères invisibles de coupure JSON
      const cleanContent = content.trim().replace(/[\r\n]+/g, '\\n');

      // 1. Création du Ticket principal dans GLPI
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

      // GLPI renvoie généralement une structure du type { id: 123, message: "..." }
      // ou un tableau contenant un objet [{ id: 123, ... }]
      let createdTicketId = null;
      if (ticketResponse) {
        if (ticketResponse.id) {
          createdTicketId = ticketResponse.id;
        } else if (Array.isArray(ticketResponse) && ticketResponse[0]?.id) {
          createdTicketId = ticketResponse[0].id;
        }
      }

      if (!createdTicketId) {
        throw new Error("L'API GLPI a accepté le JSON mais n'a pas retourné d'ID valide.");
      }

      // 2. Association de chaque élément sélectionné au ticket créé
      if (selectedItems.length > 0) {
        const linkPromises = selectedItems.map(item => 
          linkItemToTicket(createdTicketId, item.itemtype, item.id)
        );
        await Promise.all(linkPromises);
      }

      setMessage({ text: `Ticket #${createdTicketId} créé et matériels associés avec succès !`, type: 'success' });
      
      // Réinitialisation du formulaire
      setTitle('');
      setContent('');
      setUrgency('3');
      setSelectedItems([]);

    } catch (err) {
      console.error("Détails de l'erreur GLPI Payload:", err);
      setMessage({ text: `Échec de la création du ticket : ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ borderBottom: '2px solid #28a745', paddingBottom: '10px' }}>Créer un nouveau Ticket d'incident</h2>

      {message.text && (
        <div style={{
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          fontWeight: 'bold',
          backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
          color: message.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Titre du ticket */}
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Titre de l'incident</label>
          <input 
            type="text"
            placeholder="Ex: Écran noir ou problème réseau informatique"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>

        {/* Degré d'urgence */}
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Urgence</label>
          <select 
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff' }}
          >
            <option value="5">Très haute</option>
            <option value="4">Haute</option>
            <option value="3">Moyenne</option>
            <option value="2">Basse</option>
            <option value="1">Très basse</option>
          </select>
        </div>

        {/* Description de l'incident */}
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Description détaillée</label>
          <textarea 
            rows="5"
            placeholder="Décrivez précisément le problème rencontré..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
        </div>

        {/* 🛠️ SÉLECTION ET ASSOCIATION MULTIPLE DE MATÉRIELS */}
        <div style={{ border: '1px solid #e0e0e0', padding: '15px', borderRadius: '6px', backgroundColor: '#f9f9f9' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>🚀 Associer des éléments du parc (Optionnel)</label>
          
          {loadingParc ? (
            <p style={{ fontSize: '13px', color: '#666' }}>Chargement des matériels disponibles...</p>
          ) : (
            <select 
              onChange={handleAddItem}
              defaultValue=""
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', marginBottom: '10px' }}
            >
              <option value="" disabled>-- Sélectionner un équipement à lier --</option>
              {availableItems.map(item => (
                <option key={`${item.itemtype}-${item.id}`} value={`${item.itemtype}-${item.id}`}>
                  [{item.itemtype}] {item.name} {item.serial && `(S/N: ${item.serial})`}
                </option>
              ))}
            </select>
          )}

          {/* Badge list des matériels actuellement ajoutés au panier de liaison */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
            {selectedItems.map(item => (
              <span key={`${item.itemtype}-${item.id}`} style={{
                backgroundColor: '#e2e3e5',
                color: '#383d41',
                padding: '5px 10px',
                borderRadius: '15px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #d6d8db'
              }}>
                <strong>{item.itemtype}:</strong> {item.name}
                <button 
                  type="button"
                  onClick={() => handleRemoveItem(item.itemtype, item.id)}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#721c24',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '0 2px'
                  }}
                >
                  &times;
                </button>
              </span>
            ))}
            {selectedItems.length === 0 && (
              <span style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>Aucun matériel lié pour le moment.</span>
            )}
          </div>
        </div>

        {/* Bouton de validation */}
        <button 
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: loading ? '#6c757d' : '#28a745',
            color: '#fff',
            padding: '12px',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            marginTop: '10px'
          }}
        >
          {loading ? '⏳ Enregistrement du ticket...' : 'Créer le Ticket d\'incident'}
        </button>

      </form>
    </div>
  );
};

export default CreateTicket;