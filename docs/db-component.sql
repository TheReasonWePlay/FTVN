-- Création de la base de données
CREATE DATABASE IF NOT EXISTS gestion_inventoring;
USE gestion_inventoring;

-- =========================
-- Table Salle
-- =========================
CREATE TABLE Salle (
    refSalle VARCHAR(10) PRIMARY KEY,
    nomSalle VARCHAR(50) NOT NULL,
    etage INT NOT NULL,
    site VARCHAR(50) NOT NULL
);

-- =========================
-- Table Personne
-- =========================
CREATE TABLE Personne (
    matricule VARCHAR(8) PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    tel VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    poste VARCHAR(50),
    projet VARCHAR(50)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Trigger to ensure email is stored in lowercase
DELIMITER //
CREATE TRIGGER before_personne_insert
BEFORE INSERT ON Personne
FOR EACH ROW
BEGIN
    SET NEW.email = LOWER(TRIM(NEW.email));
    SET NEW.nom = TRIM(NEW.nom);
    SET NEW.prenom = TRIM(NEW.prenom);
    SET NEW.tel = TRIM(NEW.tel);
    SET NEW.poste = TRIM(NEW.poste);
    SET NEW.projet = TRIM(NEW.projet);
END;
//

CREATE TRIGGER before_personne_update
BEFORE UPDATE ON Personne
FOR EACH ROW
BEGIN
    SET NEW.email = LOWER(TRIM(NEW.email));
    SET NEW.nom = TRIM(NEW.nom);
    SET NEW.prenom = TRIM(NEW.prenom);
    SET NEW.tel = TRIM(NEW.tel);
    SET NEW.poste = TRIM(NEW.poste);
    SET NEW.projet = TRIM(NEW.projet);
END;
//
DELIMITER ;

-- =========================
-- Table Utilisateur
-- =========================
CREATE TABLE Utilisateur (
    matricule VARCHAR(8) PRIMARY KEY,
    nomUser VARCHAR(50) NOT NULL UNIQUE,
    motDePasse VARCHAR(255) NOT NULL,
    role ENUM('Administrateur', 'Responsable') NOT NULL DEFAULT 'Responsable',
    CONSTRAINT fk_utilisateur_personne
        FOREIGN KEY (matricule) REFERENCES Personne(matricule)
        ON DELETE CASCADE
);

-- =========================
-- Table Position
-- =========================
CREATE TABLE Position (
    refPosition VARCHAR(20) PRIMARY KEY,
    designPosition VARCHAR(50) NOT NULL,
    port VARCHAR(20),
    occupation BOOLEAN DEFAULT FALSE,
    refSalle VARCHAR(10) NOT NULL,
    CONSTRAINT fk_position_salle
        FOREIGN KEY (refSalle) REFERENCES Salle(refSalle)
        ON DELETE CASCADE
);

-- =========================
-- Table Affectation
-- =========================
CREATE TABLE Affectation (
    refAffectation INT AUTO_INCREMENT PRIMARY KEY,
    dateDebut DATE NOT NULL,
    dateFin DATE,
    matricule VARCHAR(8) NOT NULL,
    refPosition VARCHAR(20) NOT NULL,
    CONSTRAINT fk_affectation_personne
        FOREIGN KEY (matricule) REFERENCES Personne(matricule),
    CONSTRAINT fk_affectation_position
        FOREIGN KEY (refPosition) REFERENCES Position(refPosition),
    CONSTRAINT chk_dates_affectation
        CHECK (dateFin IS NULL OR dateFin >= dateDebut)
);

-- =========================
-- Table Materiel
-- =========================
CREATE TABLE Materiel (
    numSerie VARCHAR(50) PRIMARY KEY,
    marque VARCHAR(50) NOT NULL,
    modele VARCHAR(80) NOT NULL,
    status ENUM('Disponible', 'Affecté', 'En panne', 'Hors service') NOT NULL,
    categorie VARCHAR(50) NOT NULL,
    dateAjout DATE NOT NULL,
    refAffectation INT,
    CONSTRAINT fk_materiel_affectation
        FOREIGN KEY (refAffectation) REFERENCES Affectation(refAffectation)
        ON DELETE SET NULL
);

-- =========================
-- Table Ordinateur
-- =========================
CREATE TABLE Ordinateur (
    numSerie VARCHAR(50) PRIMARY KEY,
    nomPC VARCHAR(50),
    ram FLOAT,
    disque FLOAT,
    processeur VARCHAR(50),
    systemeExploitation VARCHAR(50),
    CONSTRAINT fk_ordinateur_materiel
        FOREIGN KEY (numSerie) REFERENCES Materiel(numSerie)
        ON DELETE CASCADE
);

-- =========================
-- Table Inventaire
-- =========================
CREATE TABLE Inventaire (
    refInventaire INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    debut TIME,
    fin TIME,
    observation TEXT,
    refSalle VARCHAR(10) NOT NULL,
    matricule VARCHAR(8) NOT NULL,
    CONSTRAINT fk_inventaire_salle
        FOREIGN KEY (refSalle) REFERENCES Salle(refSalle),
    CONSTRAINT fk_inventaire_personne
        FOREIGN KEY (matricule) REFERENCES Personne(matricule)
);

-- =========================
-- Table Incident
-- =========================
CREATE TABLE Incident (
    refIncident INT AUTO_INCREMENT PRIMARY KEY,
    typeIncident VARCHAR(50) NOT NULL,
    statutIncident ENUM('Ouvert', 'En cours', 'Résolu', 'Clos') NOT NULL,
    description TEXT,
    dateInc TIMESTAMP NOT NULL,
    refInventaire INT,
    matricule VARCHAR(8) NOT NULL,
    numSerie VARCHAR(50) NOT NULL,
    CONSTRAINT fk_incident_inventaire
        FOREIGN KEY (refInventaire) REFERENCES Inventaire(refInventaire)
        ON DELETE SET NULL,
    CONSTRAINT fk_incident_personne
        FOREIGN KEY (matricule) REFERENCES Personne(matricule),
    CONSTRAINT fk_incident_materiel
        FOREIGN KEY (numSerie) REFERENCES Materiel(numSerie)
);

