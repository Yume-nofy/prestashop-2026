import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    navigate('/LoginBack');
  };

  return (
    <div style={styles.container}>
      {/* Barre latérale gauche */}
      <aside style={styles.sidebar}>
        <div style={styles.logoContainer}>
          <h2 style={styles.logoText}>GLPI Admin</h2>
          <span style={styles.logoSub}>Backoffice</span>
        </div>
        
        <nav style={styles.nav}>
          <Link to="/admin" style={styles.navLink}>Tableau de bord</Link>
          <Link to="/ticket" style={styles.navLink}>Créer un ticket</Link>
          <Link to="/statusConfig" style={styles.navLink}>config status ticket</Link>
          <Link to="/adminTicket" style={styles.navLink}>Gestion des tickets</Link>
          <Link to="/ticketKanban" style={styles.navLink}>liste tickets</Link>
          <Link to="/testCsv" style={styles.navLink}>Importation de données</Link>
          <Link to="/admin/reset" style={styles.navLink}>Réinitialisation</Link>
          <Link to="/list" style={styles.navLinkPublic}>Vue publique du parc</Link>
        </nav>

        <button 
          onClick={handleLogout} 
          style={styles.logoutBtn}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
        >
          Déconnexion
        </button>
      </aside>

      {/* Zone de contenu principale à droite */}
      <main style={styles.mainContent}>
        <div style={styles.contentWrapper}>
          {children}
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#121212', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
  sidebar: { width: '260px', backgroundColor: '#1e1e1e', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', padding: '24px', position: 'fixed', height: '100vh', boxSizing: 'border-box', zIndex: 100 },
  logoContainer: { marginBottom: '32px', borderBottom: '1px solid #334155', paddingBottom: '16px' },
  logoText: { margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#00d2ff', letterSpacing: '0.5px' },
  logoSub: { fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 },
  navLink: { color: '#cbd5e1', textDecoration: 'none', fontSize: '14px', fontWeight: '500', padding: '10px 14px', borderRadius: '6px', transition: 'all 0.2s', borderLeft: '3px solid transparent', backgroundColor: 'transparent' },
  navLinkPublic: { color: '#00d2ff', textDecoration: 'none', fontSize: '14px', fontWeight: '600', padding: '10px 14px', borderRadius: '6px', transition: 'all 0.2s', borderLeft: '3px solid #00d2ff', backgroundColor: 'rgba(0, 210, 255, 0.02)', marginTop: '12px' },
  logoutBtn: { backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', transition: 'background 0.2s', textTransform: 'uppercase', letterSpacing: '0.5px' },
  mainContent: { flexGrow: 1, marginLeft: '260px', padding: '40px', boxSizing: 'border-box', minWidth: 0, backgroundColor: '#121212' },
  contentWrapper: { maxWidth: '1200px', margin: '0 auto' }
};

export default AdminLayout;