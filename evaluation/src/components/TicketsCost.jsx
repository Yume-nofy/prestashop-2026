import React, { useState, useEffect } from 'react';
import { fetchGlpiTickets } from '../services/CrudService';
import { apiGlpi } from '../api/apiGlpi';
import { apiLocalStatus } from '../api/configApi';

const TicketsCost = () => {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Données brutes des APIs
  const [tickets, setTickets] = useState([]);
  const [allLinks, setAllLinks] = useState([]);
  const [allCostsGlpi, setAllCostsGlpi] = useState([]);
  const [allSuperCostsLocal, setAllSuperCostsLocal] = useState([]);

  const [hardwareSummary, setHardwareSummary] = useState([]);

  useEffect(() => {
    loadAllCostData();
  }, []);

  const loadAllCostData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, linksRes, costsGlpiRes, costsLocalRes] = await Promise.all([
        fetchGlpiTickets(),
        apiGlpi('Item_Ticket'),
        apiGlpi('TicketCost'),
        apiLocalStatus('cost')
      ]);

      const cleanTickets = Array.isArray(ticketsRes) ? ticketsRes : [];
      const cleanLinks = Array.isArray(linksRes) ? linksRes : [];
      const cleanCostsGlpi = Array.isArray(costsGlpiRes) ? costsGlpiRes : [];
      const cleanCostsLocal = Array.isArray(costsLocalRes) ? costsLocalRes : [];

      setTickets(cleanTickets);
      setAllLinks(cleanLinks);
      setAllCostsGlpi(cleanCostsGlpi);
      setAllSuperCostsLocal(cleanCostsLocal);

      calculateHardwareCosts(cleanLinks, cleanCostsGlpi, cleanCostsLocal);

    } catch (err) {
      console.error("Erreur lors du calcul de la synthèse financière :", err);
      setMessage({ text: "Impossible de charger la synthèse analytique du parc.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const calculateHardwareCosts = (links, glpiCosts, localCosts) => {
    const summary = {
      Computer: { count: 0, glpiCost: 0, superCost: 0, reouverture: 0 },
      Phone: { count: 0, glpiCost: 0, superCost: 0, reouverture: 0 },
      Monitor: { count: 0, glpiCost: 0, superCost: 0, reouverture: 0 }
    };

    links.forEach(link => {
      const type = link.itemtype; 
      const ticketId = parseInt(link.tickets_id, 10);

      if (!summary[type]) {
        summary[type] = { count: 0, glpiCost: 0, superCost: 0, reouverture: 0 };
      }

      summary[type].count += 1;

      const costsForTicket = glpiCosts.filter(c => parseInt(c.tickets_id, 10) === ticketId);
      let ticketGlpiTotal = costsForTicket.reduce((sum, item) => {
        const fixed = parseFloat(item.cost_fixed) || 0;
        const material = parseFloat(item.cost_material) || 0;
        const time = parseFloat(item.cost_time) || 0;
        const minutes = parseInt(item.actiontime, 10) || 0;
        return sum + fixed + material + (time * (minutes / 3600));
      }, 0);

      const totalItemsOnTicket = links.filter(l => parseInt(l.tickets_id, 10) === ticketId).length;
      summary[type].glpiCost += totalItemsOnTicket > 0 ? (ticketGlpiTotal / totalItemsOnTicket) : ticketGlpiTotal;
    });

    localCosts.forEach(entry => {
      const type = entry.item_id; 
      const costValue = parseFloat(entry.cost) || 0;
      const reouvertureValue = parseFloat(entry.prix) || 0; 

      if (summary[type]) {
        summary[type].superCost += costValue;
        summary[type].reouverture += reouvertureValue; 
      } else {
        summary[type] = { count: 0, glpiCost: 0, superCost: costValue, reouverture: reouvertureValue };
      }
    });

    // 3. Formatage final des lignes du tableau
    const formattedData = Object.keys(summary).map(key => ({
      hardwareType: key,
      count: summary[key].count,
      glpiCost: summary[key].glpiCost,
      superCost: summary[key].superCost,
      reouverture: summary[key].reouverture, 
      totalCost: summary[key].glpiCost + summary[key].superCost + summary[key].reouverture
    }));

    setHardwareSummary(formattedData);
  };

  const grandTotalReouverture = hardwareSummary.reduce((sum, item) => sum + item.reouverture, 0);
  const grandTotalGlpi = hardwareSummary.reduce((sum, item) => sum + item.glpiCost, 0);
  const grandTotalSuper = hardwareSummary.reduce((sum, item) => sum + item.superCost, 0);
  const grandTotalAll = hardwareSummary.reduce((sum, item) => sum + item.totalCost, 0);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Calcul analytique et distribution des coûts d'infrastructure...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      
      <div style={styles.topHeader}>
        <div>
          <h2 style={styles.mainTitle}>Comptabilité Analytique par Parc Matériel</h2>
          <p style={styles.subtitle}>Répartition des charges financières : GLPI vs Base Locale SQLite</p>
        </div>
        <button onClick={loadAllCostData} style={styles.refreshBtn}>Actualiser les coûts</button>
      </div>

      {message.text && (
        <div style={message.type === 'success' ? styles.alertSuccess : styles.alertError}>
          {message.text}
        </div>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Type d'infrastructure</th>
              <th style={{ ...styles.th, textAlign: 'right', color: '#64748b' }}>Réouverture (Local)</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Coût GLPI (Native)</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Super Coût (Clôture)</th>
              <th style={{ ...styles.th, textAlign: 'right', color: '#00d2ff' }}>Coût Total Brut</th>
            </tr>
          </thead>
          <tbody>
            {hardwareSummary.map((item, idx) => (
              <tr key={idx} style={styles.tr}>
                <td style={styles.tdHardware}>
                  {item.hardwareType}
                </td>
                {/* Formatage propre en MGA de ta valeur de réouverture */}
                <td style={{ ...styles.tdCost, color: '#e2e8f0', textAlign: 'right' }}>
                  {item.reouverture.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA
                </td>
                <td style={{ ...styles.tdCost, color: '#f8fafc' }}>
                  {item.glpiCost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA
                </td>
                <td style={{ ...styles.tdCost, color: '#38bdf8' }}>
                  {item.superCost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA
                </td>
                <td style={{ ...styles.tdCost, fontWeight: '700', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.02)' }}>
                  {item.totalCost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA
                </td>
              </tr>
            ))}

            {/* LIGNE DE TOTAL GLOBAL */}
            <tr style={styles.totalRow}>
              <td style={styles.tdTotalLabel}>TOTAL PARC INFORMATIQUE</td>
              <td style={{ ...styles.tdTotalValue, color: '#cbd5e1' }}>
                {grandTotalReouverture.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA
              </td>
              <td style={styles.tdTotalValue}>
                {grandTotalGlpi.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA
              </td>
              <td style={{ ...styles.tdTotalValue, color: '#38bdf8' }}>
                {grandTotalSuper.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA
              </td>
              <td style={{ ...styles.tdTotalValue, color: '#121212', backgroundColor: '#10b981', textAlign: 'right' }}>
                {grandTotalAll.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#121212' },
  loadingText: { color: '#00d2ff', fontSize: '14px', fontFamily: 'monospace' },
  page: { backgroundColor: '#121212', minHeight: '100vh', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '25px' },
  topHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #334155', paddingBottom: '16px' },
  mainTitle: { fontSize: '22px', fontWeight: '700', color: '#00d2ff', margin: '0 0 6px 0' },
  subtitle: { fontSize: '13px', color: '#cbd5e1', margin: 0 },
  refreshBtn: { backgroundColor: '#1e1e1e', border: '1px solid #334155', color: '#cbd5e1', padding: '10px 18px', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  alertError: { padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', fontWeight: '600', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444' },
  tableWrapper: { backgroundColor: '#1e1e1e', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' },
  thRow: { backgroundColor: '#121212', borderBottom: '1px solid #334155' },
  th: { padding: '16px', color: '#cbd5e1', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #2a2a2a', '&:hover': { backgroundColor: '#252525' } },
  tdHardware: { padding: '16px', fontWeight: '700', color: '#f8fafc', textTransform: 'capitalize' },
  tdCost: { padding: '16px', textAlign: 'right', fontFamily: 'monospace', fontSize: '14px' },
  totalRow: { backgroundColor: '#161616', borderTop: '3px solid #334155' },
  tdTotalLabel: { padding: '18px 16px', fontWeight: '800', color: '#10b981', letterSpacing: '0.5px', textTransform: 'uppercase' },
  tdTotalValue: { padding: '18px 16px', textAlign: 'right', fontFamily: 'monospace', fontSize: '15px', fontWeight: '800' }
};

export default TicketsCost;