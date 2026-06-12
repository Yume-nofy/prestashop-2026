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
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS status (
            id INTEGER PRIMARY KEY,
            couleur TEXT,
            name_fr TEXT,
            name_en TEXT,
            name_mg TEXT
        ); 
        CREATE TABLE IF NOT EXISTS costItem (
            id INTEGER PRIMARY KEY,
            item_id TEXT,
            cost INT DEFAULT 0,
            prix INT DEFAULT 0,
            id_ticket INT
        );
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
@app.route("/cost", methods=["POST"])
def add_cost():
    data = request.get_json()
    item_id = data.get("item_id")
    cost = data.get("cost")
    ticket= data.get("ticket_id")
    
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO costItem (item_id, cost,id_ticket) VALUES (?, ?,?)", 
        (item_id, cost,ticket)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Status added"}), 201
@app.route("/costPrix", methods=["POST"])
def add_Prix():
    data = request.get_json()
    item_id = data.get("item_id")
    ticket=data.get("ticket_id")
    cost = data.get("cost")
    
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO costItem (item_id, prix,id_ticket) VALUES (?, ?,?)", 
        (item_id, cost,ticket)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Status added"}), 201
@app.route("/cost/<int:ticket_id>", methods=["DELETE"])
def delete(ticket_id):
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute("DELETE  FROM costItem WHERE id_ticket = ? ",(ticket_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Status updated successfully"}), 200
@app.route("/costLast",methods=["GET"])
def getLast():
    item = request.args.get("itemtype")
    id_ticket=request.args.get("id_ticket")
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute("SELECT cost FROM costItem WHERE item_id=? and id_ticket=? ",(item,id_ticket))
    rows = cursor.fetchall()
    cost_list = []
    for row in rows:
        cost_list.append({
            "cost": row[0]
        })
    return jsonify(cost_list)
@app.route("/cost", methods=["GET"])
def get_cost():
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    
    cursor.execute("SELECT item_id, SUM(cost),SUM(prix) FROM costItem GROUP BY item_id")
    rows = cursor.fetchall()
    conn.close()

    cost_list = []
    for row in rows:
        cost_list.append({
            "item_id": row[0],
            "cost": row[1],
            "prix": row[2]
        })
    return jsonify(cost_list)

@app.route("/status/<int:status_id>", methods=["PUT"])
def update_status(status_id):
    data = request.get_json()
    
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    
    # 1. On récupère d'abord les valeurs actuelles en base de données
    cursor.execute("SELECT couleur, name_fr, name_en, name_mg FROM status WHERE id = ?", (status_id,))
    current_status = cursor.fetchone()
    
    if not current_status:
        conn.close()
        return jsonify({"message": "Status not found"}), 404
        
    # 2. Si le champ envoyé est vide/nul, on reprend l'ancienne valeur
    couleur = data.get("couleur") if data.get("couleur") else current_status[0]
    name_fr = data.get("name_fr") if data.get("name_fr") else current_status[1]
    name_en = data.get("name_en") if data.get("name_en") else current_status[2]
    name_mg = data.get("name_mg") if data.get("name_mg") else current_status[3]

    # 3. On applique la mise à jour avec les valeurs fusionnées
    cursor.execute("""
        UPDATE status 
        SET couleur = ?, name_fr = ?, name_en = ?, name_mg = ? 
        WHERE id = ?
    """, (couleur, name_fr, name_en, name_mg, status_id))
    
    conn.commit()
    conn.close()
    return jsonify({"message": "Status updated successfully"}), 200

@app.route("/costAll", methods=["GET"])
def get_Allcost():
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    
    cursor.execute("SELECT item_id, cost,id_ticket,prix FROM costItem ")
    rows = cursor.fetchall()
    conn.close()

    cost_list = []
    for row in rows:
        cost_list.append({
            "item_id": row[0],
            "cost": row[1],
            "id_ticket":row[2],
            "prix":row[3]
        })
    return jsonify(cost_list)

if __name__ == "__main__":
    app.run(port=5000, debug=True)