import React, { useState, useEffect } from 'react';
import { fetchGlpiItems, fetchGlpiTickets } from '../services/CrudService';

const GlpiDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [itemStats, setItemStats] = useState({
    total: 0,
    byType: { Computer: 0, Monitor: 0, NetworkEquipment: 0, Peripheral: 0 }
  });

  const [ticketStats, setTicketStats] = useState({
    total: 0,
    byType: { Incident: 0, Request: 0 } // GLPI sépare principalement en Incident (1) et Demande/Request (2)
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const itemTypes = ['Computer', 'Monitor', 'NetworkEquipment', 'Peripheral'];
      const itemPromises = itemTypes.map(async (type) => {
        try {
          const res = await fetchGlpiItems(type);
          return { type, count: Array.isArray(res) ? res.length : 0 };
        } catch {
          return { type, count: 0 };
        }
      });

      const itemResults = await Promise.all(itemPromises);
      
      let totalItemsCount = 0;
      const itemsByType = {};
      itemResults.forEach(res => {
        itemsByType[res.type] = res.count;
        totalItemsCount += res.count;
      });

      setItemStats({
        total: totalItemsCount,
        byType: itemsByType
      });

      try {
        const tickets = await fetchGlpiTickets();
        const cleanTickets = Array.isArray(tickets) ? tickets : [];
        
        let incidents = 0;
        let requests = 0;

        cleanTickets.forEach(ticket => {
          if (Number(ticket.type) === 2) {
            requests++;
          } else {
            incidents++; // Par défaut ou type 1
          }
        });

        setTicketStats({
          total: cleanTickets.length,
          byType: {
            Incident: incidents,
            Request: requests
          }
        });

      } catch (e) {
        console.warn("Impossible de charger les statistiques des tickets :", e);
      }

    } catch (err) {
      setError(`Erreur lors du calcul des statistiques : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>📊 Chargement des indicateurs du tableau de bord...</div>;
  if (error) return <div style={{ padding: '30px', color: 'red', fontFamily: 'sans-serif' }}>⚠️ {error}</div>;

  const itemTypeConfig = {
    Computer: { label: 'Ordinateurs', icon: '💻', color: '#007bff' },
    Monitor: { label: 'Écrans', icon: '🖥️', color: '#28a745' },
    NetworkEquipment: { label: 'Matériels Réseau', icon: '🌐', color: '#fd7e14' },
    Peripheral: { label: 'Périphériques', icon: '🖨️', color: '#6f42c1' }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #dee2e6', paddingBottom: '15px', marginBottom: '30px' }}>
        <h2 style={{ margin: 0, color: '#343a40' }}>📊 Tableau de Bord - Vue Générale du Parc</h2>
        <button 
          onClick={loadDashboardData} 
          style={{ padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#e9ecef'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#fff'}
        >
          🔄 Actualiser
        </button>
      </div>

      {/* ================= SECTION 1 : LES TOTAUX GÉNÉRAUX ================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        
        {/* KPI Global Éléments */}
        <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '6px solid #007bff' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#6c757d', textTransform: 'uppercase' }}>Éléments Globaux</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#212529' }}>{itemStats.total}</span>
            <span style={{ fontSize: '40px' }}>📦</span>
          </div>
        </div>

        {/* KPI Global Tickets */}
        <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '6px solid #dc3545' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#6c757d', textTransform: 'uppercase' }}>Tickets Totaux</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#212529' }}>{ticketStats.total}</span>
            <span style={{ fontSize: '40px' }}>🎫</span>
          </div>
        </div>

      </div>

      {/* ================= SECTION 2 : LES DÉTAILS PAR TYPE ================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '30px' }}>
        
        {/* Bloc Détails du Parc */}
        <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#495057', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>📦 Répartition des Éléments</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {Object.keys(itemStats.byType).map(type => {
              const config = itemTypeConfig[type] || { label: type, icon: '⚙️', color: '#6c757d' };
              const percentage = itemStats.total > 0 ? Math.round((itemStats.byType[type] / itemStats.total) * 100) : 0;
              
              return (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '24px', width: '35px', textAlign: 'center' }}>{config.icon}</span>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                      <span style={{ color: '#495057' }}>{config.label}</span>
                      <span style={{ color: '#212529' }}>{itemStats.byType[type]} <span style={{ fontWeight: 'normal', color: '#868e96', fontSize: '12px' }}>({percentage}%)</span></span>
                    </div>
                    {/* Barre de progression personnalisée */}
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: config.color, borderRadius: '4px' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bloc Détails des Tickets */}
        <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#495057', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>🎫 Répartition des Tickets</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', height: '80%' }}>
            
            {/* Ligne Incidents */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#fff5f5', borderRadius: '8px', border: '1px solid #ffe3e3' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#c92a2a' }}>Incidents</div>
                  <div style={{ fontSize: '12px', color: '#868e96' }}>Dysfonctionnements signalés</div>
                </div>
              </div>
              <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#c92a2a' }}>{ticketStats.byType.Incident}</span>
            </div>

            {/* Ligne Demandes */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#eef6ff', borderRadius: '8px', border: '1px solid #d0ebff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🙋‍♂️</span>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#1c7ed6' }}>Demandes de services</div>
                  <div style={{ fontSize: '12px', color: '#868e96' }}>Besoins, accès ou installations</div>
                </div>
              </div>
              <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#1c7ed6' }}>{ticketStats.byType.Request}</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default GlpiDashboard;