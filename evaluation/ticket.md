# 📖 Documentation API GLPI : Gestion des Acteurs et Flux de Tickets

Dans l'architecture GLPI, les acteurs (Demandeurs, Observateurs, Techniciens) ne sont pas des colonnes directes de la table `Ticket`. Ils sont gérés via des tables de liaison relationnelles, principalement **`Ticket_User`** pour les individus et **`Group_Ticket`** pour les équipes.

---

## 1. La gestion des Acteurs Individuels (`Ticket_User`)

Pour ajouter, modifier ou lister les utilisateurs liés à un ticket, vous devez intercepter ou requêter l'endpoint suivant :
* **Endpoint global :** `/Ticket_User` ou `/Item_Ticket`
* **Endpoint lié :** `/Ticket/{ticket_id}/Ticket_User`

Le rôle de l'utilisateur est déterminé par l'attribut numérique **`type`** dans le payload :

| Valeur de `type` | Rôle GLPI | Description |
| :--- | :--- | :--- |
| **`1`** | **Demandeur** (*Requester*) | L'utilisateur qui a ouvert le ticket ou pour qui le ticket a été créé. |
| **`2`** | **Technicien assigné** (*Assignee*) | Le technicien ou spécialiste en charge de la résolution du ticket. |
| **`3`** | **Observateur** (*Observer / Watcher*) | Une tierce personne (manager, collègue) qui suit l'avancement sans interagir directement. |

### 🔹 Ajouter un Observateur (Exemple de Payload)
**`POST`** `/Ticket/{ticket_id}/Ticket_User`
```json
{
  "input": {
    "tickets_id": 123,
    "users_id": 45,
    "type": 3
  }
}