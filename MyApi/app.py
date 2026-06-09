from flask import Flask, request, jsonify
import sqlite3
from flask_cors import CORS
app = Flask(__name__)
CORS(app)
# Fonction pour initialiser la base et ajouter la colonne si elle n'existe pas
def init_db():
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    
    # On garde PRIMARY KEY mais sans AUTOINCREMENT pour pouvoir forcer les ID de GLPI (1, 2, 5)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS status (
            id INTEGER PRIMARY KEY,
            couleur TEXT,
            name_fr TEXT,
            name_en TEXT,
            name_mg TEXT
        )
    """)
    
    cursor.execute("SELECT COUNT(*) FROM status")
    count = cursor.fetchone()[0]
    
    if count == 0:
        # Ici, le premier élément du tuple est directement l'ID GLPI
        default_statuses = [
            (1, '#00d2ff', 'Nouveau', ' ', 'Vaovao'),
            (2, '#38bdf8', 'En cours', ' ', 'Efa manao'),
            (6, '#10b981', 'Résolu', ' ', 'Vita')
        ]
        
        cursor.executemany("""
            INSERT INTO status (id, couleur, name_fr, name_en, name_mg) 
            VALUES (?, ?, ?, ?, ?)
        """, default_statuses)
        
        print("-> Base SQLite initialisée avec les ID GLPI (1, 2, 5) et les traductions.")
    
    conn.commit()
    conn.close()

init_db()

@app.route("/status", methods=["GET"])
def get_status():
    lang = request.args.get("lang", "fr").lower()
    
    # Mapping des colonnes selon la langue choisie
    if lang == "en":
        column_name = "name_en"
    elif lang == "mg":
        column_name = "name_mg"
    else:
        column_name = "name_fr"

    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    query = f"SELECT id, couleur, {column_name} FROM status"
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()

    status_list = []
    for row in rows:
        status_list.append({
            "id": row[0],
            "couleur": row[1],
            "name": row[2] or "Sans nom" # Fallback si la traduction est vide
        })
    return jsonify(status_list)

@app.route("/status", methods=["POST"])
def add_status():
    data = request.get_json()
    couleur = data.get("couleur")
    name_fr = data.get("name_fr")
    name_en = data.get("name_en")
    name_mg = data.get("name_mg")

    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO status (couleur, name_fr, name_en, name_mg) VALUES (?, ?, ?, ?)", 
        (couleur, name_fr, name_en, name_mg)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Status added"}), 201

# Route optionnelle pour mettre à jour un statut existant (très utile pour la page de configuration)
@app.route("/status/<int:status_id>", methods=["PUT"])
def update_status(status_id):
    data = request.get_json()
    couleur = data.get("couleur")
    name_fr = data.get("name_fr")
    name_en = data.get("name_en")
    name_mg = data.get("name_mg")

    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE status SET couleur = ?, name_fr = ?, name_en = ?, name_mg = ? WHERE id = ?",
        (couleur, name_fr, name_en, name_mg, status_id)
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Status updated"}), 200

if __name__ == "__main__":
    app.run(port=5000, debug=True)