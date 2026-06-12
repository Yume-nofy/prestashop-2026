import React, { useState, useEffect } from 'react';
import { fetchGlpiTickets, deleteGlpiTicket } from '../services/CrudService'; 
import { apiGlpi } from '../api/apiGlpi';
import { apiLocalStatus } from '../api/configApi'; 

const TicketsListKanban = () => {
  const [tickets, setTickets] = useState([]);
  const [kanbanStatuses, setKanbanStatuses] = useState([]); 
  const [technicians, setTechnicians] = useState([]); 
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [allLinks, setAllLinks] = useState([]);
  const [allCosts, setAllCosts] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // ÉTATS POUR LA MODALE DE SÉLECTION DU TECHNICIEN
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [pendingDropData, setPendingDropData] = useState(null);

  const [newTicket, setNewTicket] = useState({
    name: '',
    content: '',
    type: '1',      
    urgency: '3',    
    status: 1       
  });

  const priorityLabels = { 1: 'Très basse', 2: 'Basse', 3: 'Moyenne', 4: 'Haute', 5: 'Très haute' };
  const typeLabels = { 1: 'Incident', 2: 'Demande' };

  const CURRENT_LANG = localStorage.getItem('kanban_lang') || 'fr'; 

  const STATUS_NEW = 1;
  const STATUS_IN_PROGRESS = 2; 
  const STATUS_CLOSED = 6;      

  useEffect(() => {
    loadAllTicketsData();
  }, []);

  const loadAllTicketsData = async () => {
    setLoading(true);
    try {
      const localStatuses = await apiLocalStatus(`status?lang=${CURRENT_LANG}`);
      
      const formattedStatuses = localStatuses.map(status => ({
        id: status.id, 
        label: status.name,
        color: status.couleur,
        border: status.couleur,
        bg: status.couleur.startsWith('#') ? `${status.couleur}0D` : 'rgba(0, 210, 255, 0.05)' 
      }));

      setKanbanStatuses(formattedStatuses);
      const validStatusIds = formattedStatuses.map(s => s.id);

      const [ticketsRes, linksRes, costsRes, usersRes] = await Promise.all([
        fetchGlpiTickets(),
        apiGlpi('Item_Ticket'),
        apiGlpi('TicketCost'),
        apiGlpi('User') 
      ]);
      
      const cleanTickets = Array.isArray(ticketsRes) ? ticketsRes : [];
      const kanbanTickets = cleanTickets.filter(t => validStatusIds.includes(parseInt(t.status, 10)));
      kanbanTickets.sort((a, b) => b.id - a.id);
      
      setTickets(kanbanTickets);
      setAllLinks(Array.isArray(linksRes) ? linksRes : []);
      setAllCosts(Array.isArray(costsRes) ? costsRes : []);

      const cleanUsers = Array.isArray(usersRes) ? usersRes : [];
      setTechnicians(cleanUsers.map(u => ({ id: u.id, name: u.name || u.realname || u.name })));

    } catch (err) {
      console.error("Erreur d'initialisation Kanban:", err);
      setMessage({ text: "Impossible de charger le flux ou les configurations.", type: 'error' });
    } finally {
      setLoading(false);
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
    if (!draggedTicket) return;

    const currentStatusId = parseInt(draggedTicket.status, 10);
    if (currentStatusId === targetStatusId) return;

    // --- RÈGLE 1 : INTERCEPTION POUR ASSIGNATION D'UN TECHNICIEN ---
    if (currentStatusId === STATUS_NEW && targetStatusId === STATUS_IN_PROGRESS) {
      if (technicians.length === 0) {
        alert("Aucun technicien disponible dans le système GLPI.");
        return;
      }
      // On stocke les informations du drag et on ouvre la modale personnalisée
      setPendingDropData({ ticketId, targetStatusId, currentStatusId, draggedTicket });
      setSelectedTechId(technicians[0]?.id || '');
      setIsTechModalOpen(true);
      return; 
    }

    // Si ce n'est pas une assignation de technicien, on continue vers le traitement standard (ex: clôture)
    processTicketUpdate(ticketId, targetStatusId, currentStatusId, draggedTicket, null);
  };

  // Validation finale après choix du technicien dans la liste déroulante
  const handleTechSelectSubmit = (e) => {
    e.preventDefault();
    if (!selectedTechId) return;
    
    const { ticketId, targetStatusId, currentStatusId, draggedTicket } = pendingDropData;
    setIsTechModalOpen(false);
    processTicketUpdate(ticketId, targetStatusId, currentStatusId, draggedTicket, parseInt(selectedTechId, 10));
  };

 const processTicketUpdate = async (ticketId, targetStatusId, currentStatusId, draggedTicket, technicianId) => {
  let updatePayload = { input: { id: ticketId, status: targetStatusId } };
  let rawComment = ""; // On stocke le commentaire brut ici

  // --- RÈGLE 2 : COMMENTAIRE OBLIGATOIRE DE CLÔTURE OU RÉOUVERTURE ---
  if (targetStatusId === STATUS_CLOSED) {
    const reason = window.prompt(`Clôture du ticket #${ticketId}\nVeuillez spécifier le rapport de résolution :`);
    if (reason === null) return; 
    if (!reason.trim()) {
      alert("La justification est obligatoire pour fermer une tâche.");
      return;
    }
    rawComment = `<b>[Clôture ticket] :</b> ${reason.trim()}`;
  } else if (currentStatusId === STATUS_CLOSED && targetStatusId !== STATUS_CLOSED) {
    const reason = window.prompt(`Réouverture du ticket #${ticketId}\nPourquoi réouvrez-vous cette tâche ? :`);
    if (reason === null) return;
    if (!reason.trim()) {
      alert("La justification est obligatoire pour réouvrir une tâche.");
      return;
    }
    rawComment = `<b>[Réouverture du ticket] :</b> ${reason.trim()}`;
  }

  const previousTickets = [...tickets];
  
  // UI Optimiste
  setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: targetStatusId } : t));

  try {
    // 1. Mise à jour du statut du Ticket sur GLPI (sans toucher au champ 'content')
    await apiGlpi(`Ticket/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify(updatePayload)
    });

    // 2. NOUVEAU : Si un commentaire de réouverture/clôture existe, on l'ajoute comme SUIVI (ITILFollowup)
    if (rawComment) {
      await apiGlpi(`Ticket/${ticketId}/ITILFollowup`, {
        method: 'POST',
        body: JSON.stringify({
          input: {
            items_id: ticketId,
            itemtype: 'Ticket',
            content: rawComment, // Le commentaire s'écrira proprement dans l'historique du ticket
            is_private: 0        // 0 = Public (visible par le demandeur), 1 = Privé
          }
        })
      });
    }

    // 3. Attribution du technicien choisi depuis la liste si présent
    if (technicianId) {
      await apiGlpi(`Ticket/${ticketId}/Ticket_User`, {
        method: 'POST',
        body: JSON.stringify({
          input: {
            tickets_id: ticketId,
            users_id: technicianId,
            type: 2 
          }
        })
      });
    }

    setMessage({ text: `Ticket #${ticketId} mis à jour avec succès.`, type: 'success' });
    await loadAllTicketsData(); 
  } catch (err) {
    setTickets(previousTickets); 
    console.error(err);
    setMessage({ text: `Erreur de traitement GLPI : ${err.message}`, type: 'error' });
  }
};

  const openCreateModalForColumn = (statusId) => {
    setNewTicket({ name: '', content: '', type: '1', urgency: '3', status: statusId });
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
        urgency: parseInt(newTicket.urgency, 10)
      };
      await apiGlpi('Ticket', { method: 'POST', body: JSON.stringify({ input: payload }) });
      setMessage({ text: "Nouveau ticket injecté avec succès.", type: 'success' });
      setIsCreateModalOpen(false);
      await loadAllTicketsData();
    } catch (err) {
      setMessage({ text: `Erreur d'injection : ${err.message}`, type: 'error' });
    } finally {
      setActionLoading(false);
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

              {column.id === 1 && (
                <button                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  utton 
                  onClick={() => openCreateModalForColumn(column.id)} 
                  style={{ ...styles.addTicketColumnBtn, border: `1px dashed ${column.border}`, color: column.color }}
                >
                  ＋ Ajouter ({column.label})
                
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL DE SÉLECTION DU TECHNICIEN (LISTE DÉROULANTE) */}
      {isTechModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '450px' }}>
            <form onSubmit={handleTechSelectSubmit}>
              <div style={styles.modalHeader}>
                <div>
                  <span style={styles.cardMetaTag}>Attribution Responsable</span>
                  <h3 style={styles.modalTitle}>Assigner un technicien</h3>
                </div>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Choisir dans la liste des techniciens GLPI :</label>
                  <select 
                    value={selectedTechId} 
                    onChange={(e) => setSelectedTechId(e.target.value)} 
                    style={styles.formSelect}
                    required
                  >
                    {technicians.map(tech => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name} (ID: {tech.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button type="button" style={styles.btnCloseModal} onClick={() => setIsTechModalOpen(false)}>
                  Annuler l'attribution
                </button>
                <button type="submit" style={styles.btnSubmitActive}>
                  Confirmer et Assigner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRÉATION TICKET */}
      {isCreateModalOpen &&  (
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
                    <select value={newTicket.urgency} onChange={(e) => setNewTicket(prev => ({ ...prev, urgency: e.target.value }))} style={styles.formSelect}>
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
              <div style={styles.sectionBlock}>
                <label style={styles.sectionTitle}>Description & Historique</label>
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