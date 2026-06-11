# 🛠️ Référence des Champs de l'API GLPI & Métadonnées

Ce guide liste les structures de données réelles pour concevoir tes formulaires React, tes validations avant envoi, et comprendre les réponses de l'API GLPI.

---

## 1. Structure complète d'un Ticket (`Ticket`)

Voici les principaux champs exploitables lors d'un `POST` ou d'un `PUT` sur `/Ticket`.

| Champ | Type | Obligatoire | Description / Valeurs possibles |
| :--- | :--- | :---: | :--- |
| **`name`** | `String` | **Oui** | L'intitulé ou titre du ticket. |
| **`content`** | `String` | **Oui** | La description détaillée (accepte le HTML ou du texte brut). |
| **`status`** | `Integer` | Non | Statut du cycle de vie (Défaut : `1`). Voir la table des statuts ci-dessous. |
| **`type`** | `Integer` | Non | `1`: Incident, `2`: Demande (Défaut : `1`). |
| **`urgency`** | `Integer` | Non | Échelle de `1` (Très basse) à `5` (Très haute). Évaluée par l'utilisateur. |
| **`impact`** | `Integer` | Non | Échelle de `1` (Très bas) à `5` (Très haut). Évalué par le technicien. |
| **`priority`** | `Integer` | Non | Calculée automatiquement par GLPI en combinant `urgency` et `impact`. |
| **`itilcategories_id`** | `Integer` | Non | ID de la catégorie GLPI (ex: Réseau, Logiciel, Mail). |
| **`locations_id`** | `Integer` | Non | ID du lieu physique lié à l'incident (ex: Bureau 102). |
| **`date`** | `DateTime` | Non | Date de création (Générée automatiquement si omise). |
| **`closedate`** | `DateTime` | Non | Remplie automatiquement lorsque le statut passe à Clos (`6`). |
| **`actiontime`** | `Integer` | Non | Temps total passé sur le ticket (en minutes). |

### 📋 Table de correspondance des Statuts GLPI Standards
Si ton API locale SQLite n'a pas encore surchargé ces valeurs, voici les IDs natifs :
* **`1`** : Nouveau (*New*)
* **`2`** : En cours (Assigné) (*In Progress*)
* **`3`** : En attente (*Planned*)
* **`4`** : Résolu (*Solved*)
* **`5`** : Clos (*Closed*)

---

## 2. Structure d'un Utilisateur (`User`)

Utile pour cartographier tes listes de techniciens ou de demandeurs.

| Champ | Type | Description |
| :--- | :--- | :--- |
| **`id`** | `Integer` | ID unique de l'utilisateur. |
| **`name`** | `String` | Identifiant de connexion / Username (ex: `jdoe`). |
| **`realname`** | `String` | Nom de famille. |
| **`firstname`** | `String` | Prénom. |
| **`email`** | `String` | Adresse email principale. |
| **`phone`** | `String` | Numéro de téléphone professionnel. |
| **`is_active`** | `Boolean` | `1` si le compte est actif, `0` si désactivé. |

---

## 3. Structure d'un Équipement (`Computer`, `Monitor`, `Phone`)

Bien que ces objets soient différents, ils partagent tous une base de champs identiques dans l'API GLPI :

| Champ | Type | Description |
| :--- | :--- | :--- |
| **`id`** | `Integer` | ID unique de l'équipement dans son inventaire. |
| **`name`** | `String` | Le nom de la machine ou de l'appareil (ex: `PC-PROD-01`). |
| **`serial`** | `String` | Le numéro de série constructeur (S/N). |
| **`otherserial`** | `String` | Numéro d'inventaire interne ou tag d'immobilisation. |
| **`contact`** | `String` | Personne physiquement responsable de l'appareil. |
| **`computertypes_id`** | `Integer` | ID du type (ex: Laptop, Tour, Serveur) — *Spécifique à Computer*. |
| **`manufacturers_id`** | `Integer` | ID de la marque (ex: Dell, HP, Cisco). |
| **`computermodels_id`**| `Integer` | ID du modèle précis de l'appareil. |

---

## 4. 💡 L'astuce ultime : Comment voir TOUS les champs disponibles ?

L'API de GLPI possède un endpoint magique caché qui te donne la liste de tous les champs existants pour n'importe quelle ressource, directement depuis ton navigateur ou Postman.

Il suffit de faire un `GET` sur l'endpoint global en ajoutant `/listSearchOptions` :

* **Pour voir tous les champs possibles d'un Ticket :**
  > **`GET`** `/Ticket/listSearchOptions`
* **Pour voir tous les champs d'un Ordinateur :**
  > **`GET`** `/Computer/listSearchOptions`

L'API te renverra un gros objet JSON structuré comme ceci :
```json
{
  "1": {
    "name": "Nom",
    "table": "glpi_tickets",
    "field": "name",
    "datatype": "string"
  },
  "2": {
    "name": "Statut",
    "table": "glpi_tickets",
    "field": "status",
    "datatype": "status"
  }
}