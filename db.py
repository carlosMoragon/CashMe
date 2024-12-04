import sqlite3

# Ruta a tu base de datos
db_path = './cashme.db'

# Función para obtener las tablas
def get_tables():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Consultar las tablas en la base de datos
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()

    print("Tablas en la base de datos:")
    for table in tables:
        print(table[0])
    
    conn.close()

if __name__ == '__main__':
    # Obtener las tablas de la base de datos
    get_tables()
