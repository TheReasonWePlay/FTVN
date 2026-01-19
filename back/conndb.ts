import mysql from 'mysql2/promise';

//Configuration de la connexion MySQL
export const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gestion_inventoring',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

//Test de connexion à la base de données
(async () => {
    try {
        const connexion = await db.getConnection();
        console.log('Connexion à la base de données réussie');
        connexion.release();
    } catch (err) {
        console.error('Erreur de connexion à la base de données :', err);
    }
})();