# 🖥️ Documentation API GLPI : Gestion du Parc Matériel et des Groupes

Dans GLPI, les équipements d'infrastructure possèdent chacun leur propre ressource dédiée pour le CRUD (Create, Read, Update, Delete). Pour associer ces matériels à un ticket d'assistance, on passe par l'endpoint d'intersection général **`Item_Ticket`**.

---

## 1. Endpoints des Équipements du Parc

Voici les endpoints natifs pour interagir directement avec l'inventaire de chaque type de matériel :

### A. Ordinateurs (`Computer`)
Gère les serveurs, postes fixes et ordinateurs portables.
* **Endpoint global :** `/Computer`
* **Endpoint spécifique :** `/Computer/{computer_id}`

### B. Écrans (`Monitor`)
Gère le parc d'affichage et moniteurs indépendants.
* **Endpoint global :** `/Monitor`
* **Endpoint spécifique :** `/Monitor/{monitor_id}`

### C. Téléphones (`Phone`)
Gère la flotte mobile, les postes IP (VoIP) et la téléphonie fixe.
* **Attention au nommage de l'API :** La ressource s'appelle **`Phone`** (et non *Telephone*).
* **Endpoint global :** `/Phone`
* **Endpoint spécifique :** `/Phone/{phone_id}`

---

## 2. Liaison d'un Équipement à un Ticket (`Item_Ticket`)

Pour lier un ordinateur, un écran ou un téléphone à un ticket (par exemple lors de la déclaration d'un incident), vous devez effectuer un `POST` sur l'endpoint de liaison.

* **Endpoint global :** `/Item_Ticket`
* **Endpoint lié :** `/Ticket/{ticket_id}/Item_Ticket`

Le payload nécessite de spécifier explicitement le type de l'objet via la clé **`itemtype`** :

### 🔹 Associer un Ordinateur à un Ticket (Exemple)
**`POST`** `/Ticket/{ticket_id}/Item_Ticket`
```json
{
  "input": {
    "tickets_id": 123,
    "itemtype": "Computer",
    "items_id": 45 
  }
}

Récupérer les membres d'un groupe spécifique (Group_User)

Si vous avez besoin de savoir quels utilisateurs appartiennent à un groupe (pour filtrer les techniciens assignables par exemple) :

    Endpoint lié : /Group/{group_id}/Group_User