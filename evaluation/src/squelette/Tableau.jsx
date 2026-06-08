import React from 'react';

const TableauSquelette = () => {
  // 1. Données adaptées pour l'équipe technique de l'infrastructure informatique
  const techniciens = [
    { id: 1, nom: 'Alice Martin', email: 'a.martin@company.local', role: 'Administrateur', affectation: 'Réseau & Sécurité' },
    { id: 2, nom: 'Bob Durand', email: 'b.durand@company.local', role: 'Technicien', affectation: 'Support Parc Client' },
    { id: 3, nom: 'Charlie Lecomte', email: 'c.lecomte@company.local', role: 'Superviseur', affectation: 'Supervision GLPI' },
  ];

  // Configuration des styles des badges selon le rôle technique
  const roleStyles = {
    'Administrateur': { color: '#00d2ff', bg: 'rgba(0, 210, 255, 0.08)', border: '#00d2ff' },
    'Superviseur': { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.08)', border: '#a855f7' },
    'Technicien': { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.08)', border: '#38bdf8' }
  };

  return (
    <div style={styles.container}>
      {/* En-tête du module */}
      <div style={styles.header}>
        <h2 style={styles.mainTitle}>Équipe Technique & Intervenants</h2>
        <p style={styles.subtitle}>Registre des techniciens accrédités, affectations et niveaux d'accès système.</p>
      </div>
      
      {/* Table des enregistrements */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          {/* En-tête du tableau */}
          <thead>
            <tr style={styles.thRow}>
              <th style={{ ...styles.th, width: '60px' }}>ID</th>
              <th style={styles.th}>Nom complet</th>
              <th style={styles.th}>Adresse Email</th>
              <th style={styles.th}>Unité d'affectation</th>
              <th style={{ ...styles.th, width: '140px' }}>Accès</th>
            </tr>
          </thead>
          
          {/* Corps du tableau */}
          <tbody>
            {techniciens.map((tech) => {
              const currentBadge = roleStyles[tech.role] || { color: '#94a3b8', bg: '#121212', border: '#334155' };
              
              return (
                <tr 
                  key={tech.id} 
                  style={styles.tr}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={styles.tdId}>#{tech.id}</td>
                  <td style={styles.tdName}>{tech.nom}</td>
                  <td style={styles.tdEmail}>{tech.email}</td>
                  <td style={styles.td}>{tech.affectation}</td>
                  <td style={styles.td}>
                    <span style={{
                      color: currentBadge.color,
                      backgroundColor: currentBadge.bg,
                      border: `1px solid ${currentBadge.border}`,
                      ...styles.badge
                    }}>
                      {tech.role}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  container: { 
    maxWidth: '900px', 
    margin: '40px auto', 
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#f8fafc',
    padding: '0 20px',
    boxSizing: 'border-box'
  },
  header: { 
    borderBottom: '1px solid #334155', 
    paddingBottom: '16px', 
    marginBottom: '24px' 
  },
  mainTitle: { 
    fontSize: '22px', 
    fontWeight: '700', 
    color: '#00d2ff', 
    margin: '0 0 6px 0' 
  },
  subtitle: { 
    fontSize: '13px', 
    color: '#cbd5e1', 
    margin: 0 
  },
  tableWrapper: {
    backgroundColor: '#1e1e1e',
    border: '1px solid #334155',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
  },
  table: { 
    width: '100%', 
    borderCollapse: 'collapse', 
    textAlign: 'left' 
  },
  thRow: { 
    backgroundColor: '#121212', 
    borderBottom: '1px solid #334155' 
  },
  th: { 
    padding: '14px 16px', 
    fontWeight: '600', 
    fontSize: '12px', 
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tr: { 
    borderBottom: '1px solid #2a2a2a', 
    backgroundColor: 'transparent',
    transition: 'background-color 0.15s ease' 
  },
  tdId: {
    padding: '14px 16px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#64748b',
    fontFamily: 'monospace'
  },
  tdName: {
    padding: '14px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#f8fafc'
  },
  tdEmail: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#cbd5e1',
    fontFamily: 'monospace'
  },
  td: { 
    padding: '14px 16px', 
    fontSize: '13px', 
    color: '#cbd5e1' 
  },
  badge: { 
    padding: '4px 8px', 
    borderRadius: '4px', 
    fontSize: '11px', 
    fontWeight: '700',
    display: 'inline-block',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }
};

export default TableauSquelette;