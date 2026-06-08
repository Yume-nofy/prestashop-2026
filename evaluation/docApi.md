group:{
  "id": 5,
  "name": "Direction Générale - Antananarivo",
  "comment": "Généré automatiquement par l'analyseur de masse",
  "groups_id": 0,
  "completename": "Direction Générale - Antananarivo",
  "ancestors_cache": "[]",
  "sons_cache": "[]",
  "date_mod": "2026-06-08 08:44:12",
  "date_creation": "2026-06-08 08:44:12",
  "links": [
    { "rel": "Ticket", "href": "http://localhost/glpi/apirest.php/Group/5/Ticket" }
  ]
}
user:{
  "id": 42,
  "name": "yume06644",
  "realname": "Arnaud",
  "firstname": "Nofin'aina",
  "password": "",
  "phone": null,
  "phone2": null,
  "mobile": null,
  "locations_id": 0,
  "language": "fr_FR",
  "is_active": 1,
  "auths_id": 0,
  "authtype": 0,
  "last_login": "2026-06-08 08:50:00",
  "date_mod": "2026-06-08 08:44:13",
  "date_creation": "2026-06-08 08:44:13",
  "is_deleted": 0,
  "is_dynamic": 0,
  "groups_id": 5,
  "emails": [
    { "id": 10, "email": "user@example.com", "is_default": 1 }
  ]
}
Computer:{
  "id": 12,
  "name": "PC-ADM-001",
  "entities_id": 0,
  "is_recursive": 0,
  "locations_id": 0,
  "domains_id": 0,
  "contact": "",
  "contact_num": "",
  "users_id": 42,
  "groups_id": 5,
  "states_id": 2,
  "ticket_tco": "0.0000",
  "uuid": null,
  "computermodels_id": 3,
  "computertypes_id": 0,
  "manufacturers_id": 1,
  "is_deleted": 0,
  "is_dynamic": 0,
  "serial": "SN-ACER-99812",
  "otherserial": "INV-2026-001",
  "networks_id": 0,
  "comment": "Importé via CsvDynamicTester",
  "date_mod": "2026-06-08 08:44:13",
  "date_creation": "2026-06-08 08:44:13",
  "autoupdatesystems_id": 0
}
ticket:{
  "id": 83,
  "entities_id": 0,
  "is_recursive": 0,
  "name": "Panne d'affichage sur écran secondaire",
  "date": "2026-06-08 08:44:14",
  "closedate": null,
  "solvedate": null,
  "date_mod": "2026-06-08 08:55:04",
  "date_creation": "2026-06-08 08:44:14",
  "status": 1,
  "users_id_lastupdater": 2,
  "users_id_recipient": 42,
  "requesttypes_id": 1,
  "content": "L'écran MN-FORM-002 reste noir après démarrage du poste principal.",
  "urgency": 3,
  "impact": 3,
  "priority": 3,
  "itilcategories_id": 0,
  "type": 1,
  "global_validation": 1,
  "slas_id_ttr": 0,
  "slas_id_tto": 0,
  "slas_tto_expiry": null,
  "slas_ttr_expiry": null,
  "actiontime": 600,
  "is_deleted": 0,
  "external_id": "1",
  "locations_id": 0
}
item_ticket:{
  "id": 154,
  "tickets_id": 83,
  "items_id": 12,
  "itemtype": "Computer",
  "date_creation": "2026-06-08 08:44:14"
}
ticketCost:{
  "id": 5,
  "tickets_id": 83,
  "name": "Coût analytique d'importation",
  "comment": null,
  "cost_time": "8.7000",
  "cost_fixed": "50.0000",
  "cost_material": "0.0000",
  "actiontime": 600,
  "totalcost": "51.4500",
  "budgets_id": 0,
  "date_mod": "2026-06-08 08:55:04",
  "date_creation": "2026-06-08 08:55:04"
}
group_user:{
  "id": 89,
  "users_id": 42,
  "groups_id": 5,
  "is_dynamic": 0,
  "is_manager": 0,
  "is_userdelegate": 0
}
user_profil:{
  "id": 42,
  "users_id": 42,
  "profiles_id": 2,
  "entities_id": 0,
  "is_recursive": 1,
  "is_dynamic": 0
}
Document_items:{
  "id": 210,
  "documents_id": 204,
  "items_id": 12,
  "itemtype": "Computer",
  "entities_id": 0,
  "is_recursive": 0,
  "date_mod": "2026-06-08 08:44:16",
  "date_creation": "2026-06-08 08:44:16",
  "users_id": 2,
  "timeline_of_items_id": 0
}
