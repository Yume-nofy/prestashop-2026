import React, { useState, useEffect } from 'react';
import { fetchGlpiTickets, deleteGlpiTicket } from '../services/CrudService'; 
import { apiGlpi } from '../api/apiGlpi';
// Import de ton nouveau service d'API locale
import { apiLocalStatus } from '../api/configApi'; 

const TicketsListKanban = () => {
  const [tickets, setTickets] = useState([]);
  const [kanbanStatuses, setKanbanStatuses] = useState([]); // Remplacera la constante statique
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [allLinks, setAllLinks] = useState([]);
  const [allCosts, setAllCosts] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [newTicket, setNewTicket] = useState({
    name: '',
    content: '',
    type: '1',      
    urgency: '3',    
    status: 1       
  });

  const priorityLabels = { 1: 'Très basse', 2: 'Basse', 3: 'Moyenne', 4: 'Haute', 5: 'Très haute' };
  const typeLabels = { 1: 'Incident', 2: 'Demande' };

  // Définir la langue ici : 'mg', 'fr' ou 'en'
  const CURRENT_LANG = 'mg'; 

  useEffect(() => {
    loadAllTicketsData();
  }, []);

  const loadAllTicketsData = async () => {
    setLoading(true);
    try {
      // 1. Charger les statuts personnalisés depuis SQLite (localhost:5000)
      const localStatuses = await apiLocalStatus(`status?lang=${CURRENT_LANG}`);
      
      // On formate l'objet pour ajouter dynamiquement la couleur de bordure et le fond transparent
      const formattedStatuses = localStatuses.map(status => ({
        id: status.id, // Correspondra à 1, 2 ou 5 (ID GLPI)
        label: status.name,
        color: status.couleur,
        border: status.couleur,
        // Si c'est un hexadécimal, on applique une opacité en CSS ou on garde la couleur pure
        bg: status.couleur.startsWith('#') ? `${status.couleur}0D` : 'rgba(0, 210, 255, 0.05)' 
      }));

      setKanbanStatuses(formattedStatuses);

      // Récupération des ID valides pour filtrer les tickets GLPI
      const validStatusIds = formattedStatuses.map(s => s.id);

      // 2. Charger les données GLPI
      const [ticketsRes, linksRes, costsRes] = await Promise.all([
        fetchGlpiTickets(),
        apiGlpi('Item_Ticket'),
        apiGlpi('TicketCost')
      ]);
      
      const cleanTickets = Array.isArray(ticketsRes) ? ticketsRes : [];
      // Filtrage dynamique basé sur les ID reçus de SQLite
      const kanbanTickets = cleanTickets.filter(t => validStatusIds.includes(parseInt(t.status, 10)));
      kanbanTickets.sort((a, b) => b.id - a.id);
      
      setTickets(kanbanTickets);
      setAllLinks(Array.isArray(linksRes) ? linksRes : []);
      setAllCosts(Array.isArray(costsRes) ? costsRes : []);
    } catch (err) {
      console.error("Erreur d'initialisation Kanban:", err);
      setMessage({ text: "Impossible de charger le flux ou les configurations des colonnes.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openCreateModalForColumn = (statusId) => {
    setNewTicket({
      name: '',
      content: '',
      type: '1',
      urgency: '3',
      status: statusId
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newTicket.name.trim()) return;

    setActionLoading(true);
    try {
      const payload = {
        name: newTicket.name.trim(),
        content: newTicket.content.trim() || 'Aucune description fournie.',
        status: newTicket.status, 
        type: parseInt(newTicket.type, 10),
        priority: parseInt(newTicket.urgency, 10)
      };

      await apiGlpi('Ticket', { method: 'POST', body: JSON.stringify({input:payload})});
      setMessage({ text: "Nouveau ticket injecté avec succès.", type: 'success' });
      
      setIsCreateModalOpen(false);
      await loadAllTicketsData();
    } catch (err) {
      setMessage({ text: `Erreur d'injection : ${err.message}`, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDragStart = (e, ticketId) => {
    e.dataTransfer.setData('text/plain', ticketId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatusId) => {
    e.preventDefault();
    const ticketId = parseInt(e.dataTransfer.getData('text/plain'), 10);
    
    const draggedTicket = tickets.find(t => t.id === ticketId);
    if (!draggedTicket || parseInt(draggedTicket.status, 10) === targetStatusId) return;

    let resolutionComment = "";
    if (targetStatusId === 5) {
      resolutionComment = window.prompt(
        ` Clôture technique de l'incident #${ticketId}\nVeuillez saisir le rapport de résolution ou la justification de fermeture :`
      );
      if (resolutionComment === null) return; 
    }

    const previousTickets = [...tickets];
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: targetStatusId } : t));

    try {
      const updatePayload ={input:{ id: ticketId, status: targetStatusId }};
      if (resolutionComment) {
        updatePayload.content = draggedTicket.content + `<br/><br/><b>[Résolution Kanban] :</b> ${resolutionComment}`;
      }

      await apiGlpi(`Ticket/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify(updatePayload)
      });

      setMessage({ text: `Ticket #${ticketId} déplacé avec succès.`, type: 'success' });
      await loadAllTicketsData();
    } catch (err) {
      setTickets(previousTickets);
      setMessage({ text: `Impossible de modifier le statut sur le serveur GLPI : ${err.message}`, type: 'error' });
    }
  };

  const handleDelete = async (ticketId) => {
    if (!window.confirm(`Confirmez-vous la suppression définitive du ticket #${ticketId} ?`)) return;
    
    setActionLoading(true);
    try {
      await deleteGlpiTicket(ticketId);
      setMessage({ text: `Ticket #${ticketId} purgé avec succès.`, type: 'success' });
      setSelectedTicket(null);
      setIsModalOpen(false);
      await loadAllTicketsData();
    } catch (err) {
      setMessage({ text: `Échec de la purge : ${err.message}`, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes === 0) return "Non spécifiée";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  };

  const linkedItems = allLinks.filter(item => parseInt(item.tickets_id, 10) === selectedTicket?.id);
  const ticketCosts = allCosts.filter(cost => parseInt(cost.tickets_id, 10) === selectedTicket?.id);
  
  const totalTicketCost = ticketCosts.reduce((sum, item) => {
    const fixed = parseFloat(item.cost_fixed) || 0;
    const material = parseFloat(item.cost_material) || 0;
    const time = parseFloat(item.cost_time) || 0;
    const minutes = parseInt(item.actiontime, 10) || 0;
    return sum + fixed + material + (time * (minutes / 60));
  }, 0);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Indexation et synchronisation du Kanban GLPI...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      
      <div style={styles.topHeader}>
        <div>
          <h2 style={styles.mainTitle}>Tableau de Bord Kanban - Support</h2>
          <p style={styles.subtitle}>Glissez-déposez les cartes. Traduction active : {CURRENT_LANG.toUpperCase()}</p>
        </div>
        <button onClick={loadAllTicketsData} style={styles.refreshBtn}>Synchroniser</button>
      </div>

      {message.text && (
        <div style={message.type === 'success' ? styles.alertSuccess : styles.alertError}>
          {message.text}
        </div>
      )}

      {/* SURFACE DU KANBAN BASÉE SUR LES STATUTS DE SQLITE */}
      <div style={styles.kanbanBoard}>
        {kanbanStatuses.map(column => {
          const columnTickets = tickets.filter(t => parseInt(t.status, 10) === column.id);

          return (
            <div 
              key={column.id} 
              style={{ ...styles.kanbanColumn, backgroundColor: column.bg }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div style={{ ...styles.columnHeader, borderTop: `3px solid ${column.border}` }}>
                <span style={{ color: column.color }}>{column.label}</span>
                <span style={styles.columnCounter}>{columnTickets.length}</span>
              </div>

              <div style={styles.cardsContainer}>
                {columnTickets.length === 0 ? (
                  <div style={styles.emptyColumnText}>Aucun ticket actif</div>
                ) : (
                  columnTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ticket.id)}
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setIsModalOpen(true);
                      }}
                      style={styles.ticketCard}
                    >
                      <div style={styles.ticketCardName}>{ticket.name}</div>
                    </div>
                  ))
                )}
              </div>

              <button 
                onClick={() => openCreateModalForColumn(column.id)} 
                style={{ ...styles.addTicketColumnBtn, border: `1px dashed ${column.border}`, color: column.color }}
              >
                ＋ Ajouter ({column.label})
              </button>
            </div>
          );
        })}
      </div>

      {/* MODAL CRÉATION TICKET */}
      {isCreateModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreateSubmit}>
              <div style={styles.modalHeader}>
                <div>
                  <span style={styles.cardMetaTag}>Nouveau Ticket d'Assistance</span>
                  <h3 style={styles.modalTitle}>
                    Initialiser dans : {kanbanStatuses.find(s => s.id === newTicket.status)?.label}
                  </h3>
                </div>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Intitulé / Titre du ticket *</label>
                  <input 
                    type="text" required
                    placeholder="Ex: Écran noir ou Panne switch compta"
                    value={newTicket.name}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, name: e.target.value }))}
                    style={styles.formInput}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Classification / Type</label>
                    <select value={newTicket.type} onChange={(e) => setNewTicket(prev => ({ ...prev, type: e.target.value }))} style={styles.formSelect}>
                      <option value="1">Incident</option>
                      <option value="2">Demande de service</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Niveau d'urgence</label>
                    <select value={newTicket.urgency} onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value }))} style={styles.formSelect}>
                      <option value="1">1 - Très Basse</option>
                      <option value="2">2 - Basse</option>
                      <option value="3">3 - Moyenne</option>
                      <option value="4">4 - Haute</option>
                      <option value="5">5 - Très Haute</option>
                    </select>
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Description textuelle / Contenu</label>
                  <textarea rows="4" placeholder="Description..." value={newTicket.content} onChange={(e) => setNewTicket(prev => ({ ...prev, content: e.target.value }))} style={styles.formTextarea} />
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button type="button" style={styles.btnCloseModal} onClick={() => setIsCreateModalOpen(false)}>Annuler</button>
                <button type="submit" disabled={actionLoading} style={actionLoading ? styles.btnSubmitDisabled : styles.btnSubmitActive}>
                  {actionLoading ? 'Injection...' : 'Créer et Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TIROIR DÉTAILS */}
      {isModalOpen && selectedTicket && (
        <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.cardMetaTag}>Dossier Incident Spécifique</span>
                <h3 style={styles.modalTitle}>#{selectedTicket.id} - {selectedTicket.name}</h3>
              </div>
              <span style={{ 
                backgroundColor: (kanbanStatuses.find(s => s.id === parseInt(selectedTicket.status)) || {}).bg || '#1e293b', 
                color: (kanbanStatuses.find(s => s.id === parseInt(selectedTicket.status)) || {}).color || '#94a3b8', 
                border: `1px solid ${(kanbanStatuses.find(s => s.id === parseInt(selectedTicket.status)) || {}).border || '#334155'}`,
                ...styles.statusBadge
              }}>
                {(kanbanStatuses.find(s => s.id === parseInt(selectedTicket.status)) || {}).label || 'Inconnu'}
              </span>
            </div>
            <div style={styles.modalBody}>
              {/* Reste du tiroir inchangé */}
              <div style={styles.sectionBlock}>
                <label style={styles.sectionTitle}>Description</label>
                <div style={styles.descriptionBox} dangerouslySetInnerHTML={{ __html: selectedTicket.content }} />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button type="button" onClick={() => handleDelete(selectedTicket.id)} disabled={actionLoading} style={actionLoading ? styles.btnDeleteDisabled : styles.btnDeleteActive}>Supprimer</button>
              <button type="button" style={styles.btnCloseModal} onClick={() => setIsModalOpen(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles inchangés (utilisant CSS Grid 3 colonnes comme validé précédemment)
const styles = {
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#121212' },
  loadingText: { color: '#00d2ff', fontSize: '14px', fontFamily: 'monospace' },
  page: { backgroundColor: '#121212', minHeight: '100vh', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', padding: '25px' },
  topHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #223049', paddingBottom: '16px' },
  mainTitle: { fontSize: '22px', fontWeight: '700', color: '#00d2ff', margin: '0 0 6px 0' },
  subtitle: { fontSize: '13px', color: '#cbd5e1', margin: 0 },
  refreshBtn: { backgroundColor: '#1e1e1e', border: '1px solid #334155', color: '#cbd5e1', padding: '10px 18px', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  kanbanBoard: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'flex-start' },
  kanbanColumn: { borderRadius: '8px', border: '1px solid #2d3748', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', height: 'fit-content' },
  columnHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4px 8px 4px', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  columnCounter: { backgroundColor: '#121212', border: '1px solid #334155', color: '#cbd5e1', padding: '2px 8px', borderRadius: '20px', fontSize: '12px' },
  cardsContainer: { display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' },
  emptyColumnText: { textAlign: 'center', color: '#4a5568', fontStyle: 'italic', fontSize: '12px', padding: '20px 0' },
  addTicketColumnBtn: { width: '100%', backgroundColor: 'rgba(18, 18, 18, 0.4)', padding: '10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'background-color 0.2s', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: '10px' },
  ticketCard: { backgroundColor: '#1e1e1e', border: '1px solid #2d3748', borderRadius: '6px', padding: '14px', cursor: 'grab' },
  ticketCardName: { fontSize: '13px', fontWeight: '600', color: '#f8fafc' },
  formGroup: { marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' },
  formLabel: { fontSize: '12px', fontWeight: '600', color: '#cbd5e1', textTransform: 'uppercase' },
  formInput: { backgroundColor: '#121212', border: '1px solid #334155', color: '#f8fafc', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', outline: 'none' },
  formSelect: { backgroundColor: '#121212', border: '1px solid #334155', color: '#f8fafc', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', outline: 'none' },
  formTextarea: { backgroundColor: '#121212', border: '1px solid #334155', color: '#f8fafc', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', outline: 'none', resize: 'none' },
  btnSubmitActive: { backgroundColor: '#00d2ff', border: 'none', color: '#121212', padding: '8px 20px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' },
  btnSubmitDisabled: { backgroundColor: '#1e293b', color: '#64748b', padding: '8px 20px', borderRadius: '6px', cursor: 'not-allowed', fontSize: '13px' },
  statusBadge: { padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', display: 'inline-block' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#1e1e1e', border: '1px solid #334155', borderRadius: '8px', width: '95%', maxWidth: '900px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px', borderBottom: '1px solid #334155' },
  modalTitle: { margin: '4px 0', color: '#00d2ff', fontSize: '17px', fontWeight: '700' },
  cardMetaTag: { fontSize: '10px', fontWeight: '700', color: '#00d2ff', textTransform: 'uppercase' },
  modalBody: { padding: '24px', overflowY: 'auto', flexGrow: 1 },
  sectionBlock: { marginBottom: '16px' },
  sectionTitle: { fontSize: '12px', color: '#cbd5e1', fontWeight: '700', display: 'block', marginBottom: '8px', textTransform: 'uppercase' },
  descriptionBox: { backgroundColor: '#121212', border: '1px solid #334155', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#cbd5e1', maxHeight: '120px', overflowY: 'auto' },
  modalFooter: { padding: '16px 24px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', gap: '12px', backgroundColor: '#121212' },
  btnDeleteActive: { backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' },
  btnDeleteDisabled: { backgroundColor: '#1e293b', border: '1px solid #334155', color: '#64748b', padding: '8px 16px', borderRadius: '6px', cursor: 'not-allowed', fontSize: '13px' },
  btnCloseModal: { backgroundColor: '#1e1e1e', border: '1px solid #334155', color: '#cbd5e1', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  alertSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px' },
  alertError: { backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px' }
};

export default TicketsListKanban;