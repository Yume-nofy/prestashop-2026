from flask import Flask, request, jsonify
import sqlite3

app = Flask(__name__)

# 🔹 Initialiser la base (une seule fois)
def init_db():
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT
        );
    """)
    conn.commit()
    conn.close()

init_db()

# 🔹 GET → récupérer tous les utilisateurs
@app.route("/users", methods=["GET"])
def get_users():
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users")
    rows = cursor.fetchall()
    conn.close()

    users = []
    for row in rows:
        users.append({"id": row[0], "name": row[1]})

    return jsonify(users)

# 🔹 POST → ajouter un utilisateur
@app.route("/users", methods=["POST"])
def add_user():
    data = request.get_json()
    name = data.get("name")

    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute("INSERT INTO users (name) VALUES (?)", (name,))
    conn.commit()
    conn.close()

    return jsonify({"message": "User added"}), 201
@app.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return jsonify({"id": row[0], "name": row[1]})
    else:
        return jsonify({"message": "User not found"}), 404
@app.route("/users/search", methods=["GET"])
def search_user():
    name = request.args.get("name")

    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE name LIKE ?", ('%' + name + '%',))
    rows = cursor.fetchall()
    conn.close()

    users = []
    for row in rows:
        users.append({"id": row[0], "name": row[1]})

    return jsonify(users)
@app.route("/users/filter", methods=["GET"])
def filter_users():
    name = request.args.get("name")
    min_id = request.args.get("min_id")

    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()

    query = "SELECT * FROM users WHERE 1=1"
    params = []

    if name:
        query += " AND name LIKE ?"
        params.append('%' + name + '%')

    if min_id:
        query += " AND id >= ?"
        params.append(min_id)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return jsonify([{"id": r[0], "name": r[1]} for r in rows])
# 🔹 Lancer le serveur
if __name__ == "__main__":
    app.run(debug=True)