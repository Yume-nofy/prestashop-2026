import React, { useState, useEffect } from 'react';
import { fetchGlpiTickets, deleteGlpiTicket } from '../services/CrudService';
import { apiGlpi } from '../api/apiGlpi';

const TicketsList = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [allLinks, setAllLinks] = useState([]);
  const [allCosts, setAllCosts] = useState([]);

  const priorityLabels = { 1: 'Très basse', 2: 'Basse', 3: 'Moyenne', 4: 'Haute', 5: 'Très haute' };
  const typeLabels = { 1: 'Incident', 2: 'Demande' };
  
  const statusConfig = {
    1: { label: 'Nouveau', color: '#00d2ff', bg: 'rgba(0, 210, 255, 0.1)', border: '#00d2ff' },
    2: { label: 'En cours (Attribué)', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.1)', border: '#38bdf8' },
    3: { label: 'Planifié', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', border: '#a855f7' },
    4: { label: 'En attente', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b' },
    5: { label: 'Résolu', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981' },
    6: { label: 'Clos', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', border: '#94a3b8' },
  };

  useEffect(() => {
    loadAllTicketsData();
  }, []);

  const loadAllTicketsData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, linksRes, costsRes] = await Promise.all([
        fetchGlpiTickets(),
        apiGlpi('Item_Ticket'),
        apiGlpi('TicketCost')
      ]);

      const cleanTickets = Array.isArray(ticketsRes) ? ticketsRes : [];
      cleanTickets.sort((a, b) => b.id - a.id);
      
      setTickets(cleanTickets);
      setAllLinks(Array.isArray(linksRes) ? linksRes : []);
      setAllCosts(Array.isArray(costsRes) ? costsRes : []);

    } catch (err) {
      console.error("Erreur lors de l'initialisation des données GLPI:", err);
      setMessage({ text: "Impossible de charger les données du support informatique.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ticketId) => {
    if (!window.confirm(`Confirmez-vous la suppression définitive du ticket #${ticketId} ?`)) return;
    
    setActionLoading(true);
    try {
      await deleteGlpiTicket(ticketId);
      setMessage({ text: `Ticket #${ticketId} purgé avec succès du système.`, type: 'success' });
      setSelectedTicket(null);
      await loadAllTicketsData();
    } catch (err) {
      setMessage({ text: `Échec de l'opération de purge : ${err.message}`, type: 'error' });
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
  const totalTicketCost = ticketCosts.reduce((sum, item) => sum + parseFloat(item.totalcost || 0), 0);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Indexation et synchronisation des tickets d'assistance...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      
      {/* EN-TÊTE PRINCIPAL */}
      <div style={styles.topHeader}>
        <div>
          <h2 style={styles.mainTitle}>Gestion des Tickets d'Assistance</h2>
          <p style={styles.subtitle}>Suivi opérationnel, imputation analytique des coûts et liaison matérielle.</p>
        </div>
        <button onClick={loadAllTicketsData} style={styles.refreshBtn}>Sychroniser</button>
      </div>

      {message.text && (
        <div style={message.type === 'success' ? styles.alertSuccess : styles.alertError}>
          {message.text}
        </div>
      )}

      {/* BLOC LAYOUT DEUX COLONNES DYNAMIQUE */}
      <div style={styles.layoutGrid}>
        
        {/* PANNEAU GAUCHE : TABLEAU DES ENREGISTREMENTS */}
        <div style={styles.leftColumn}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={{ ...styles.th, width: '60px' }}>ID</th>
                  <th style={styles.th}>Intitulé / Type</th>
                  <th style={{ ...styles.th, width: '130px' }}>Statut</th>
                  <th style={{ ...styles.th, width: '100px' }}>Urgence</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => {
                  const status = statusConfig[ticket.status] || { label: `Code ${ticket.status}`, color: '#94a3b8', bg: '#1e293b', border: '#334155' };
                  const isSelected = selectedTicket?.id === ticket.id;

                  return (
                    <tr 
                      key={ticket.id} 
                      onClick={() => setSelectedTicket(ticket)}
                      style={{ 
                        ...styles.tr,
                        backgroundColor: isSelected ? 'rgba(0, 210, 255, 0.04)' : 'transparent',
                        borderColor: isSelected ? '#00d2ff' : '#1e1e1e'
                      }}
                      onMouseOver={(e) => !isSelected && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)')}
                      onMouseOut={(e) => !isSelected && (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={styles.tdId}>#{ticket.id}</td>
                      <td style={styles.tdContent}>
                        <div style={styles.ticketName} title={ticket.name}>{ticket.name}</div>
                        <span style={styles.ticketTypeLabel}>{typeLabels[ticket.type] || 'Ticket'}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ 
                          backgroundColor: status.bg, 
                          color: status.color, 
                          border: `1px solid ${status.border}`,
                          ...styles.statusBadge 
                        }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={styles.tdUrgency}>
                        {priorityLabels[ticket.urgency] || 'Moyenne'}
                      </td>
                    </tr>
                  );
                })}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan="4" style={styles.emptyTableTd}>Aucun flux de ticket détecté dans l'instance GLPI.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PANNEAU DROIT : DOSSIER TECHNIQUE INDIVIDUEL */}
        <div style={styles.rightColumn}>
          {selectedTicket ? (
            <div style={styles.detailsCard}>
              
              {/* En-tête Dossier */}
              <div style={styles.cardHeader}>
                <div>
                  <span style={styles.cardMetaTag}>Fiche Technique Intervenant</span>
                  <h3 style={styles.cardMainTitle}>#{selectedTicket.id} - {selectedTicket.name}</h3>
                  <div style={styles.cardDate}>Indexation initiale : {selectedTicket.date || 'Donnée non synchronisée'}</div>
                </div>
                <span style={{ 
                  backgroundColor: (statusConfig[selectedTicket.status] || {}).bg || '#1e293b', 
                  color: (statusConfig[selectedTicket.status] || {}).color || '#94a3b8', 
                  border: `1px solid ${(statusConfig[selectedTicket.status] || {}).border || '#334155'}`,
                  ...styles.statusBadge
                }}>
                  {(statusConfig[selectedTicket.status] || {}).label || selectedTicket.status}
                </span>
              </div>

              {/* Grille des Métadonnées Critiques */}
              <div style={styles.metaDataGrid}>
                <div style={styles.metaItem}>
                  <label style={styles.metaLabel}>Classification</label>
                  <span style={styles.metaValue}>{typeLabels[selectedTicket.type] || 'Non identifié'}</span>
                </div>
                <div style={styles.metaItem}>
                  <label style={styles.metaLabel}>Niveau d'urgence</label>
                  <span style={styles.metaValue}>{priorityLabels[selectedTicket.urgency] || 'Moyenne'}</span>
                </div>
                <div style={styles.metaItem}>
                  <label style={styles.metaLabel}>Temps d'action cumulé</label>
                  <span style={styles.metaValue}>{formatDuration(selectedTicket.actiontime)}</span>
                </div>
                <div style={styles.metaItem}>
                  <label style={styles.metaLabel}>Identifiant externe</label>
                  <span style={{ ...styles.metaValue, fontFamily: 'monospace' }}>{selectedTicket.external_id || 'Aucune référence'}</span>
                </div>
              </div>

              {/* Bloc Description textuelle brute */}
              <div style={styles.sectionBlock}>
                <label style={styles.sectionTitle}>Description textuelle de l'incident</label>
                <div 
                  style={styles.descriptionBox}
                  dangerouslySetInnerHTML={{ __html: selectedTicket.content }}
                />
              </div>

              {/* Bloc Liaisons Matérielles */}
              <div style={styles.sectionBlock}>
                <label style={styles.sectionTitle}>Éléments d'infrastructure impactés</label>
                {linkedItems.length > 0 ? (
                  <div style={styles.badgeContainer}>
                    {linkedItems.map((item, idx) => (
                      <span key={idx} style={styles.hardwareBadge}>
                        {item.itemtype} (Ref-ID: {item.items_id})
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={styles.emptyInlineText}>Aucune attribution de matériel pour ce ticket.</span>
                )}
              </div>

              {/* Bloc Suivi des Coûts Analytiques (MGA) */}
              <div style={styles.costSection}>
                <label style={styles.sectionTitle}>Synthèse financière de l'intervention</label>
                {ticketCosts.length > 0 ? (
                  <div style={styles.costBox}>
                    {ticketCosts.map((cost, idx) => (
                      <div key={idx} style={{ 
                        ...styles.costRow, 
                        borderBottom: idx !== ticketCosts.length - 1 ? '1px solid #334155' : 'none' 
                      }}>
                        <span style={styles.costName}>{cost.name || 'Frais de maintenance'}</span>
                        <strong style={styles.costValue}>{parseFloat(cost.totalcost).toFixed(2)} MGA</strong>
                      </div>
                    ))}
                    <div style={styles.totalCostRow}>
                      <span>Impact budgétaire total :</span>
                      <span style={styles.totalCostValue}>{totalTicketCost.toFixed(2)} MGA</span>
                    </div>
                  </div>
                ) : (
                  <span style={styles.emptyInlineText}>Aucune imputation de coût enregistrée.</span>
                )}
              </div>

              {/* Actions de traitement du cycle de vie */}
              <div style={styles.cardActions}>
                <button
                  onClick={() => handleDelete(selectedTicket.id)}
                  disabled={actionLoading}
                  style={actionLoading ? styles.btnDeleteDisabled : styles.btnDeleteActive}
                >
                  {actionLoading ? 'Purge en cours...' : 'Purger le ticket'}
                </button>
                <button onClick={() => setSelectedTicket(null)} style={styles.btnClose}>
                  Masquer le dossier
                </button>
              </div>

            </div>
          ) : (
            <div style={styles.emptyStateBox}>
              Sélectionnez un ticket d'assistance dans le registre pour initialiser l'affichage de sa fiche d'intervention.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

const styles = {
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#121212' },
  loadingText: { color: '#00d2ff', fontSize: '14px', fontFamily: 'monospace' },
  page: { backgroundColor: '#121212', minHeight: '100vh', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
  topHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #334155', paddingBottom: '16px' },
  mainTitle: { fontSize: '22px', fontWeight: '700', color: '#00d2ff', margin: '0 0 6px 0' },
  subtitle: { fontSize: '13px', color: '#cbd5e1', margin: 0 },
  refreshBtn: { backgroundColor: '#1e1e1e', border: '1px solid #334155', color: '#cbd5e1', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' },
  alertSuccess: { padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', fontWeight: '600', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981' },
  alertError: { padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', fontWeight: '600', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444' },
  layoutGrid: { display: 'flex', width: '100%', gap: '24px', alignItems: 'flex-start' },
  leftColumn: { width: '55%', flexShrink: 0 },
  rightColumn: { width: '45%', flexGrow: 1, position: 'sticky', top: '20px' },
  tableWrapper: { backgroundColor: '#1e1e1e', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' },
  thRow: { backgroundColor: '#121212', borderBottom: '1px solid #334155' },
  th: { padding: '14px 16px', color: '#cbd5e1', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #2a2a2a', cursor: 'pointer', transition: 'background 0.15s' },
  tdId: { padding: '14px 16px', fontWeight: '700', color: '#64748b', fontFamily: 'monospace' },
  tdContent: { padding: '14px 16px', maxWidth: '240px' },
  ticketName: { fontWeight: '600', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  ticketTypeLabel: { color: '#64748b', fontSize: '11px', display: 'block', marginTop: '2px' },
  td: { padding: '14px 16px' },
  tdUrgency: { padding: '14px 16px', color: '#cbd5e1' },
  statusBadge: { padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', display: 'inline-block', textTransform: 'uppercase', letterSpacing: '0.5px' },
  emptyTableTd: { padding: '24px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' },
  detailsCard: { backgroundColor: '#1e1e1e', border: '1px solid #334155', borderRadius: '8px', padding: '24px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #334155', paddingBottom: '16px', marginBottom: '20px' },
  cardMetaTag: { fontSize: '11px', fontWeight: '700', color: '#00d2ff', textTransform: 'uppercase', letterSpacing: '0.5px' },
  cardMainTitle: { margin: '6px 0', color: '#f8fafc', fontSize: '18px', fontWeight: '700', lineHeight: '1.4' },
  cardDate: { fontSize: '12px', color: '#64748b' },
  metaDataGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px', backgroundColor: '#121212', padding: '16px', borderRadius: '6px', border: '1px solid #334155' },
  metaItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  metaLabel: { fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  metaValue: { fontSize: '13px', color: '#cbd5e1', fontWeight: '500' },
  sectionBlock: { marginBottom: '20px' },
  sectionTitle: { fontSize: '12px', color: '#cbd5e1', fontWeight: '700', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  descriptionBox: { backgroundColor: '#121212', border: '1px solid #334155', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#cbd5e1', whiteSpace: 'pre-line', maxHeight: '140px', overflowY: 'auto', lineHeight: '1.5' },
  badgeContainer: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  hardwareBadge: { backgroundColor: 'rgba(0, 210, 255, 0.05)', color: '#00d2ff', padding: '5px 10px', borderRadius: '4px', fontSize: '12px', border: '1px solid rgba(0, 210, 255, 0.2)', fontWeight: '600' },
  emptyInlineText: { fontSize: '12px', color: '#64748b', fontStyle: 'italic' },
  costSection: { marginBottom: '24px', borderTop: '1px dashed #334155', paddingTop: '16px' },
  costBox: { backgroundColor: '#121212', border: '1px solid #334155', borderRadius: '6px', padding: '14px' },
  costRow: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0' },
  costName: { color: '#cbd5e1' },
  costValue: { color: '#f8fafc', fontFamily: 'monospace' },
  totalCostRow: { display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #334155', fontWeight: '700', fontSize: '13px', color: '#f8fafc' },
  totalCostValue: { color: '#10b981', fontFamily: 'monospace' },
  cardActions: { display: 'flex', gap: '12px', borderTop: '1px solid #334155', paddingTop: '20px' },
  btnDeleteActive: { flexGrow: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px 16px', borderRadius: '6px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s', textTransform: 'uppercase', letterSpacing: '0.5px' },
  btnDeleteDisabled: { flexGrow: 1, backgroundColor: '#1e293b', border: '1px solid #334155', color: '#64748b', padding: '10px 16px', borderRadius: '6px', fontWeight: '700', fontSize: '13px', cursor: 'not-allowed' },
  btnClose: { backgroundColor: '#121212', border: '1px solid #334155', color: '#cbd5e1', padding: '10px 16px', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s' },
  emptyStateBox: { border: '2px dashed #334155', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#64748b', fontStyle: 'italic', backgroundColor: '#1e1e1e', fontSize: '13px' }
};

export default TicketsList;