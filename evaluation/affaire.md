Agis en tant qu'expert développeur Full-Stack React senior. Je possède déjà une application fonctionnelle avec une intégration de l'API REST de GLPI (via un composant central 'apiGlpi' qui prend des chaînes de caractères sérialisées et gère l'authentification). 

Tu devez générer, compléter et structurer l'application en respectant STRICTEMENT les consignes techniques et fonctionnelles suivantes.

===========================================================
⚠️ RÈGLE D'OR ABSOLUE : SÉCURITÉ DU CODE EXISTANT
===========================================================
- Ne modifie JAMAIS le fonctionnement ou la signature des fonctions existantes (comme apiGlpi, createDetailedGlpiItem, linkItemToTicket, etc.).
- Ne supprime aucun code existant. Ajoute uniquement les nouveaux composants ou étends le routeur React Router sans altérer le reste.

===========================================================
🎨 CHARTE GRAPHIQUE & UI (DESIGN PROFESSIONNEL SOMBRE)
===========================================================
- Applique un design haut de gamme, moderne et strictement PROFESSIONNEL.
- ENTIÈREMENT SANS ÉMOJIS : Aucun émoji ne doit être présent dans l'interface (remplace-les par du texte clair, des puces ou des bordures graphiques).
- Palette de couleurs unique : Fond sombre (Noir / Anthracite `#121212`, `#1e1e1e`), accents Bleu Ciel (`#00d2ff` ou `#38bdf8`), textes clairs (`#f8fafc`, `#cbd5e1`), et des bordures subtiles (`#334155`).

===========================================================
🛡️ FONCTIONNALITÉS COMPOSANTS ET PAGES À GÉNÉRER
===========================================================

1. BACKOFFICE : CONNEXION ET SÉCURITÉ
- Composant 'LoginBack.jsx' : Pas de champ "Login". Uniquement un champ unique "Code Unique / Mot de passe".
- Par défaut, pré-remplis temporairement le champ du formulaire avec la valeur actuelle de test pour faciliter le développement.
- Gestion de la session via localStorage.getItem('adminSession').
- Sécurise les nouvelles routes d'administration via le composant wrapper <ProtectedAdmin>.

2. BACKOFFICE : PAGE DÉDIÉE À LA RÉINITIALISATION
- Crée une page distincte et isolée 'ResetData.jsx' (protégée par <ProtectedAdmin>).
- Cette page contient uniquement un espace de confirmation et un bouton d'action global pour remettre l'application à zéro.
- Ce bouton appelle directement le service ou le composant existant 'GlpiReset' (ou la fonction de purge associée) pour vider proprement les tables et réinitialiser le système sans casser les configurations structurelles de l'API.

3. BACKOFFICE : PAGE D'IMPORTATION (CSV ET ZIP IMAGES)
- Une page d'importation dédiée 'ImportData.jsx' (protégée par <ProtectedAdmin>).
- Formulaire permettant d'importer simultanément 4 fichiers distincts(reference -> csvDynamiqueTester) :
  * 3 fichiers CSV pour le contenu structurel (Import-data-juin-26).
  * 1 fichier ZIP destiné aux images (lié aux documents GLPI).

4. BACKOFFICE : DASHBOARD (INDICATEURS)
- Composant 'GlpiDashboard.jsx' en mode sombre.
- Affiche le nombre d'éléments général du parc avec une répartition détaillée par type (Computer, Monitor, NetworkEquipment, Peripheral).
- Affiche le nombre général de tickets avec le détail exact par type (Incident vs Demande).
- Utilise des barres de progression personnalisées en CSS aux couleurs bleu ciel et anthracite.

5. BACKOFFICE : LISTE ET FICHE TECHNIQUE DES TICKETS
- Composant 'TicketsList.jsx' divisé en deux sections (Panneau gauche : Liste / Panneau droit : Fiche).
- Charge toutes les données (Tickets, Item_Ticket, TicketCost) en une seule fois au montage via un `Promise.all` global, puis effectue un filtrage local en JavaScript instantané lors du clic pour éviter toute latence de l'API.
- La fiche technique doit afficher : les métadonnées globales du ticket, les matériels du parc associés et le suivi détaillé des coûts analytiques (avec calcul de la somme totale cumulée affichée en Ariary MGA).

6. FRONTOFFICE : LISTE DES ÉLÉMENTS ET RECHERCHE MULTI-CRITÈRES
- Composant 'GlpiItemList.jsx' affichant l'ensemble du parc informatique public.
- Intègre une barre de recherche multi-critères dynamique (filtrage instantané par nom, par type d'équipement, par fabricant ou par numéro de série/inventaire).

7. FRONTOFFICE : CRÉATION DE TICKET MULTI-ÉLÉMENTS
- Composant 'CreateTicket.jsx' permettant à un utilisateur de déclarer un problème.
- L'interface doit permettre de sélectionner et d'ASSOCIER PLUSIEURS ÉLÉMENTS du parc à un seul et unique ticket avant de soumettre le formulaire (gestion d'un tableau d'ID d'équipements liés via l'API Item_Ticket).

===========================================================
LIVRABLES ATTENDUS
===========================================================
Fournis le code React JS (JSX) complet, documenté et utilisant du style inline CSS ou CSS standard respectant rigoureusement la palette de couleurs sombres et l'absence totale d'émojis.