import React from 'react';

const TableauSquelette = () => {
  // 1. Données de test (généralement récupérées via une API ou passées en props)
  const utilisateurs = [
    { id: 1, nom: 'Alice Martin', email: 'alice@example.com', role: 'Administrateur' },
    { id: 2, nom: 'Bob Durand', email: 'bob@example.com', role: 'Utilisateur' },
    { id: 3, nom: 'Charlie Lecomte', email: 'charlie@example.com', role: 'Modérateur' },
  ];

  return (
    <div style={styles.container}>
      <h2>Liste des Utilisateurs</h2>
      
      <table style={styles.table}>
        {/* En-tête du tableau */}
        <thead>
          <tr style={styles.thRow}>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Nom</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Rôle</th>
          </tr>
        </thead>
        
        {/* Corps du tableau */}
        <tbody>
          {utilisateurs.map((user) => (
            <tr key={user.id} style={styles.tr}>
              <td style={styles.td}>{user.id}</td>
              <td style={styles.td}>{user.nom}</td>
              <td style={styles.td}>{user.email}</td>
              <td style={styles.td}>
                <span style={styles.badge}>{user.role}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Styles en ligne pour un rendu propre et moderne
const styles = {
  container: { maxWidth: '800px', margin: '20px auto', fontFamily: 'Arial, sans-serif' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px', textAlign: 'left' },
  thRow: { backgroundColor: '#f4f4f4', borderBottom: '2px solid #ddd' },
  th: { padding: '12px', fontWeight: 'bold', fontSize: '14px', color: '#333' },
  tr: { borderBottom: '1px solid #eee', transition: 'background-color 0.2s' },
  td: { padding: '12px', fontSize: '14px', color: '#555' },
  badge: { 
    padding: '4px 8px', 
    borderRadius: '12px', 
    backgroundColor: '#e1f5fe', 
    color: '#0288d1', 
    fontSize: '12px', 
    fontWeight: 'bold' 
  }
};

export default TableauSquelette;