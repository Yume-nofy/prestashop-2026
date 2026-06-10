import React from 'react';
import { Link } from 'react-router-dom';

const FrontOfficeLayout = ({ children }) => {
  return (
    <div style={styles.container}>
      {/* Barre latérale gauche */}
      <aside style={styles.sidebar}>
        <div style={styles.logoContainer}>
          <h2 style={styles.logoText}>GLPI Support</h2>
          <span style={styles.logoSub}>Frontoffice / Espace Public</span>
        </div>
        
        <nav style={styles.nav}>
            <Link to="/ticketKanban" style={styles.navLink}>Liste tickets (Kanban)</Link>
          <Link to="/list" style={styles.navLink}>Vue du parc matériel</Link>
          <Link to="/ticket" style={styles.navLinkAction}>＋ Déclarer un ticket</Link>
          
        </nav>

        <div style={styles.footerInfo}>
          <Link to="/admin" style={styles.adminAccessBtn}>
            Accès Administration →
          </Link>
        </div>
      </aside>

      {/* Zone de contenu principale */}
      <main style={styles.mainContent}>
        <div style={styles.contentWrapper}>
          {children}
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
  sidebar: { width: '260px', backgroundColor: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', padding: '24px', position: 'fixed', height: '100vh', boxSizing: 'border-box', zIndex: 100 },
  logoContainer: { marginBottom: '32px', borderBottom: '1px solid #334155', paddingBottom: '16px' },
  logoText: { margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#38bdf8', letterSpacing: '0.5px' },
  logoSub: { fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 },
  navLink: { color: '#cbd5e1', textDecoration: 'none', fontSize: '14px', fontWeight: '500', padding: '10px 14px', borderRadius: '6px', transition: 'all 0.2s' },
  navLinkAction: { color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.06)', textDecoration: 'none', fontSize: '14px', fontWeight: '600', padding: '12px 14px', borderRadius: '6px', transition: 'all 0.2s', marginTop: '8px', border: '1px dashed #10b981', textAlign: 'center' },
  footerInfo: { borderTop: '1px solid #334155', paddingTop: '16px', display: 'flex', flexDirection: 'column' },
  adminAccessBtn: { color: '#94a3b8', textDecoration: 'none', fontSize: '12px', fontWeight: '500', transition: 'color 0.2s', textAlign: 'center' },
  mainContent: { flexGrow: 1, marginLeft: '260px', padding: '40px', boxSizing: 'border-box', minWidth: 0, backgroundColor: '#0f172a' },
  contentWrapper: { maxWidth: '1200px', margin: '0 auto' }
};

export default FrontOfficeLayout;