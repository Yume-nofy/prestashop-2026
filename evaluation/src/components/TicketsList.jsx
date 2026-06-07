import React, { useState, useEffect } from 'react';
import { fetchGlpiTickets, deleteGlpiTicket } from '../services/CrudService';
import { apiGlpi } from '../api/apiGlpi';

const TicketsList = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Stockage global de toutes les liaisons et coûts pour filtrage local instantané
  const [allLinks, setAllLinks] = useState([]);
  const [allCosts, setAllCosts] = useState([]);

  // Dictionnaires de correspondance GLPI
  const priorityLabels = { 1: 'Très basse', 2: 'Basse', 3: 'Moyenne', 4: 'Haute', 5: 'Très haute' };
  const typeLabels = { 1: 'Incident ⚠️', 2: 'Demande 🙋‍♂️' };
  const statusConfig = {
    1: { label: 'Nouveau', color: '#17a2b8', bg: '#e2f7f9' },
    2: { label: 'En cours (Attribué)', color: '#007bff', bg: '#e8f0fe' },
    3: { label: 'Planifié', color: '#6f42c1', bg: '#f1e6ff' },
    4: { label: 'En attente', color: '#ffc107', bg: '#fff9e6' },
    5: { label: 'Résolu', color: '#28a745', bg: '#e6f4ea' },
    6: { label: 'Clos', color: '#6c757d', bg: '#f1f3f4' },
  };

  // Chargement global de toutes les données au montage du composant
  useEffect(() => {
    loadAllTicketsData();
  }, []);

  const loadAllTicketsData = async () => {
    setLoading(true);
    try {
      // Chargement en parallèle de TOUTES les données initiales indispensables
      const [ticketsRes, linksRes, costsRes] = await Promise.all([
        fetchGlpiTickets(),
        apiGlpi('Item_Ticket'),
        apiGlpi('TicketCost')
      ]);

      const cleanTickets = Array.isArray(ticketsRes) ? ticketsRes : [];
      // Trier du plus récent au plus ancien
      cleanTickets.sort((a, b) => b.id - a.id);
      
      setTickets(cleanTickets);
      setAllLinks(Array.isArray(linksRes) ? linksRes : []);
      setAllCosts(Array.isArray(costsRes) ? costsRes : []);

    } catch (err) {
      console.error("Erreur lors de l'initialisation des données GLPI:", err);
      setMessage({ text: "Impossible de charger les données du support.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ticketId) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le ticket #${ticketId} ?`)) return;
    
    setActionLoading(true);
    try {
      await deleteGlpiTicket(ticketId);
      setMessage({ text: `🎉 Ticket #${ticketId} supprimé avec succès.`, type: 'success' });
      setSelectedTicket(null);
      // Recharger tout le paquet de données proprement
      await loadAllTicketsData();
    } catch (err) {
      setMessage({ text: `❌ Échec de la suppression : ${err.message}`, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Formatage de la durée (minutes -> Heures/Minutes)
  const formatDuration = (minutes) => {
    if (!minutes || minutes === 0) return "Non spécifiée";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  };

  // FILTRAGE LOCAL ET INSTANTANÉ (0ms de latence au clic)
  const linkedItems = allLinks.filter(item => parseInt(item.tickets_id, 10) === selectedTicket?.id);
  const ticketCosts = allCosts.filter(cost => parseInt(cost.tickets_id, 10) === selectedTicket?.id);
  const totalTicketCost = ticketCosts.reduce((sum, item) => sum + parseFloat(item.totalcost || 0), 0);

  if (loading) {
    return <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>⏳ Chargement instantané des tickets et du matériel...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1300px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #dee2e6', paddingBottom: '10px' }}>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>🎫 Gestion des Tickets d'Assistance</h2>
        <button onClick={loadAllTicketsData} style={{ padding: '8px 15px', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', fontWeight: 'bold' }}>🔄 Rafraîchir</button>
      </div>

      {message.text && (
        <div style={{ padding: '12px', borderRadius: '4px', marginBottom: '20px', backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da', color: message.type === 'success' ? '#155724' : '#721c24', border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}` }}>
          {message.text}
        </div>
      )}

      {/* DISPOSITION EN DEUX COLONNES (TABLEAU A GAUCHE / FICHE A DROITE) */}
      <div style={{ display: 'table', width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: '20px 0' }}>
        <div style={{ display: 'table-row' }}>
          
          {/* COLONNE GAUCHE : LISTE DES TICKETS */}
          <div style={{ display: 'table-cell', width: '55%', verticalAlign: 'top' }}>
            <div style={{ backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '12px', width: '60px' }}>ID</th>
                    <th style={{ padding: '12px' }}>Titre / Incident</th>
                    <th style={{ padding: '12px', width: '110px' }}>Statut</th>
                    <th style={{ padding: '12px', width: '100px' }}>Urgence</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(ticket => {
                    const status = statusConfig[ticket.status] || { label: `Code ${ticket.status}`, color: '#333', bg: '#eee' };
                    const isSelected = selectedTicket?.id === ticket.id;

                    return (
                      <tr 
                        key={ticket.id} 
                        onClick={() => setSelectedTicket(ticket)}
                        style={{ 
                          borderBottom: '1px solid #eee', 
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#eef6ff' : 'transparent',
                          transition: 'background 0.15s'
                        }}
                        onMouseOver={(e) => !isSelected && (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                        onMouseOut={(e) => !isSelected && (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#6c757d' }}>#{ticket.id}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 'bold', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>{ticket.name}</div>
                          <small style={{ color: '#888' }}>{typeLabels[ticket.type] || 'Ticket'}</small>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ backgroundColor: status.bg, color: status.color, padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' }}>
                            {status.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: '#495057' }}>
                          {priorityLabels[ticket.urgency] || 'Moyenne'}
                        </td>
                      </tr>
                    );
                  })}
                  {tickets.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>Aucun ticket trouvé dans GLPI.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* COLONNE DROITE : FICHE TECHNIQUE DU TICKET */}
          <div style={{ display: 'table-cell', width: '45%', verticalAlign: 'top' }}>
            {selectedTicket ? (
              <div style={{ backgroundColor: '#fff', border: '1px solid #ced4da', borderRadius: '8px', padding: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'sticky', top: '20px' }}>
                
                {/* En-tête de la Fiche */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#007bff', textTransform: 'uppercase' }}>Fiche Intervenant</span>
                    <h3 style={{ margin: '5px 0', color: '#212529', fontSize: '20px' }}>#{selectedTicket.id} - {selectedTicket.name}</h3>
                    <small style={{ color: '#6c757d' }}>Créé le : {selectedTicket.date || 'Inconnue'}</small>
                  </div>
                  <span style={{ 
                    backgroundColor: (statusConfig[selectedTicket.status] || {}).bg || '#eee', 
                    color: (statusConfig[selectedTicket.status] || {}).color || '#333', 
                    padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' 
                  }}>
                    {(statusConfig[selectedTicket.status] || {}).label || selectedTicket.status}
                  </span>
                </div>

                {/* Métadonnées de base */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6c757d', display: 'block', fontWeight: 'bold' }}>Type :</label>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{typeLabels[selectedTicket.type] || 'Non défini'}</span>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6c757d', display: 'block', fontWeight: 'bold' }}>Urgence :</label>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{priorityLabels[selectedTicket.urgency] || 'Moyenne'}</span>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6c757d', display: 'block', fontWeight: 'bold' }}>Temps passé :</label>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{formatDuration(selectedTicket.actiontime)}</span>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6c757d', display: 'block', fontWeight: 'bold' }}>Référence :</label>
                    <span style={{ fontSize: '14px', fontFamily: 'monospace' }}>{selectedTicket.external_id || 'Aucune'}</span>
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '13px', color: '#495057', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>📝 Description :</label>
                  <div 
                    style={{ backgroundColor: '#fff', border: '1px solid #e9ecef', padding: '12px', borderRadius: '6px', fontSize: '14px', color: '#333', whiteSpace: 'pre-line', maxHeight: '120px', overflowY: 'auto' }}
                    dangerouslySetInnerHTML={{ __html: selectedTicket.content }}
                  />
                </div>

                {/* BLOC ÉLÉMENTS ASSOCIES (FILTRAGE LOCAL IMMEDIAT) */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '13px', color: '#495057', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>📦 Matériels du parc impactés :</label>
                  {linkedItems.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {linkedItems.map((item, idx) => (
                        <span key={idx} style={{ backgroundColor: '#e8f0fe', color: '#1a73e8', padding: '5px 10px', borderRadius: '4px', fontSize: '13px', border: '1px solid #d2e3fc', fontWeight: '500' }}>
                          🖥️ {item.itemtype} (ID: {item.items_id})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>Aucun matériel lié à ce ticket.</span>
                  )}
                </div>

                {/* BLOC DES COÛTS ANALYTIQUES (FILTRAGE LOCAL IMMEDIAT) */}
                <div style={{ marginBottom: '25px', borderTop: '1px dashed #dee2e6', paddingTop: '15px' }}>
                  <label style={{ fontSize: '13px', color: '#495057', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>💰 Suivi des Coûts :</label>
                  {ticketCosts.length > 0 ? (
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '6px', padding: '12px' }}>
                      {ticketCosts.map((cost, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', borderBottom: idx !== ticketCosts.length - 1 ? '1px solid #f1f1f1' : 'none' }}>
                          <span style={{ color: '#5f6368' }}>{cost.name || 'Coût intervention'}</span>
                          <strong style={{ color: '#3c4043' }}>{parseFloat(cost.totalcost).toFixed(2)} MGA</strong>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '2px solid #343a40', fontWeight: 'bold', fontSize: '14px', color: '#202124' }}>
                        <span>Coût Total :</span>
                        <span style={{ color: '#28a745' }}>{totalTicketCost.toFixed(2)} MGA</span>
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>Aucun coût financier imputé à ce ticket.</span>
                  )}
                </div>

                {/* Boutons d'action */}
                <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #eee', paddingTop: '25px' }}>
                  <button
                    onClick={() => handleDelete(selectedTicket.id)}
                    disabled={actionLoading}
                    style={{ flexGrow: 1, backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: actionLoading ? 'not-allowed' : 'pointer' }}
                  >
                    {actionLoading ? 'Suppression...' : '🗑️ Purger le Ticket'}
                  </button>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    style={{ backgroundColor: '#6c757d', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Fermer
                  </button>
                </div>

              </div>
            ) : (
              <div style={{ border: '2px dashed #ced4da', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#6c757d', fontStyle: 'italic', backgroundColor: '#fafafa' }}>
                Sélectionnez un ticket dans la liste pour afficher sa fiche technique détaillée.
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};

export default TicketsList;