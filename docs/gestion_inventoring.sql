-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : ven. 16 jan. 2026 à 06:06
-- Version du serveur : 8.3.0
-- Version de PHP : 8.2.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `gestion_inventoring`
--

-- --------------------------------------------------------

--
-- Structure de la table `affectation`
--

DROP TABLE IF EXISTS `affectation`;
CREATE TABLE IF NOT EXISTS `affectation` (
  `refAffectation` int NOT NULL AUTO_INCREMENT,
  `dateDebut` date NOT NULL,
  `dateFin` date DEFAULT NULL,
  `matricule` varchar(8) NOT NULL,
  `refPosition` varchar(20) NOT NULL,
  PRIMARY KEY (`refAffectation`),
  KEY `fk_affectation_personne` (`matricule`),
  KEY `fk_affectation_position` (`refPosition`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `affectation`
--

INSERT INTO `affectation` (`refAffectation`, `dateDebut`, `dateFin`, `matricule`, `refPosition`) VALUES
(1, '2025-01-05', NULL, 'P0000003', 'POS001'),
(2, '2025-01-10', NULL, 'P0000002', 'POS003');

-- --------------------------------------------------------

--
-- Structure de la table `incident`
--

DROP TABLE IF EXISTS `incident`;
CREATE TABLE IF NOT EXISTS `incident` (
  `refIncident` int NOT NULL AUTO_INCREMENT,
  `typeIncident` varchar(50) NOT NULL,
  `statutIncident` enum('Ouvert','En cours','Résolu','Clos') DEFAULT NULL,
  `description` text,
  `dateInc` timestamp NOT NULL,
  `refInventaire` int DEFAULT NULL,
  `matricule` varchar(8) NOT NULL,
  `numSerie` varchar(50) NOT NULL,
  PRIMARY KEY (`refIncident`),
  KEY `fk_incident_inventaire` (`refInventaire`),
  KEY `fk_incident_personne` (`matricule`),
  KEY `fk_incident_materiel` (`numSerie`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `incident`
--

INSERT INTO `incident` (`refIncident`, `typeIncident`, `statutIncident`, `description`, `dateInc`, `refInventaire`, `matricule`, `numSerie`) VALUES
(1, 'Panne matérielle', 'Ouvert', 'L’ordinateur ne démarre plus', '2026-01-11 14:41:06', 1, 'P0000003', 'SN-PC-001'),
(2, 'Imprimante', 'En cours', 'Bourrage papier fréquent', '2026-01-11 14:41:06', NULL, 'P0000001', 'SN-IMP-001'),
(3, 'Panne PC', 'Ouvert', 'PC agent ne démarre plus en début de shift', '2026-01-11 14:50:13', NULL, 'C003', 'PC-CX-001'),
(4, 'Casque audio', 'En cours', 'Micro ne fonctionne pas pendant les appels', '2026-01-11 14:50:13', NULL, 'C004', 'HEAD001');

-- --------------------------------------------------------

--
-- Structure de la table `inventaire`
--

DROP TABLE IF EXISTS `inventaire`;
CREATE TABLE IF NOT EXISTS `inventaire` (
  `refInventaire` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `debut` time DEFAULT NULL,
  `fin` time DEFAULT NULL,
  `observation` text,
  `refSalle` varchar(10) NOT NULL,
  `matricule` varchar(8) NOT NULL,
  PRIMARY KEY (`refInventaire`),
  KEY `fk_inventaire_salle` (`refSalle`),
  KEY `fk_inventaire_personne` (`matricule`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `inventaire`
--

INSERT INTO `inventaire` (`refInventaire`, `date`, `debut`, `fin`, `observation`, `refSalle`, `matricule`) VALUES
(1, '2025-02-01', '08:00:00', '11:30:00', 'Inventaire trimestriel salle informatique', 'S001', 'P0000001'),
(2, '2025-02-03', '09:00:00', '10:45:00', 'Vérification matériel support', 'S003', 'P0000002');

-- --------------------------------------------------------

--
-- Structure de la table `materiel`
--

DROP TABLE IF EXISTS `materiel`;
CREATE TABLE IF NOT EXISTS `materiel` (
  `numSerie` varchar(50) NOT NULL,
  `marque` varchar(50) NOT NULL,
  `modele` varchar(80) NOT NULL,
  `status` enum('Disponible','Affecté','En panne','Hors service') NOT NULL,
  `categorie` varchar(50) NOT NULL,
  `dateAjout` date NOT NULL,
  `refAffectation` int DEFAULT NULL,
  PRIMARY KEY (`numSerie`),
  KEY `fk_materiel_affectation` (`refAffectation`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `materiel`
--

INSERT INTO `materiel` (`numSerie`, `marque`, `modele`, `status`, `categorie`, `dateAjout`, `refAffectation`) VALUES
('SN-PC-001', 'Dell', 'OptiPlex 7090', 'Affecté', 'Ordinateur', '2024-12-01', 1),
('SN-PC-002', 'HP', 'EliteDesk 800', 'Disponible', 'Ordinateur', '2024-12-10', NULL),
('SN-IMP-001', 'Canon', 'LBP6030', 'En panne', 'Imprimante', '2024-11-20', NULL),
('PC-CX-001', 'Dell', 'OptiPlex 7090', 'Affecté', 'Ordinateur', '2024-10-15', 1),
('PC-CX-002', 'HP', 'ProDesk 600', 'Disponible', 'Ordinateur', '2024-11-01', NULL),
('HEAD001', 'Jabra', 'Evolve 20', 'Disponible', 'Casque', '2024-09-20', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ordinateur`
--

DROP TABLE IF EXISTS `ordinateur`;
CREATE TABLE IF NOT EXISTS `ordinateur` (
  `numSerie` varchar(50) NOT NULL,
  `nomPC` varchar(50) DEFAULT NULL,
  `ram` float DEFAULT NULL,
  `disque` float DEFAULT NULL,
  `processeur` varchar(50) DEFAULT NULL,
  `systemeExploitation` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`numSerie`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `ordinateur`
--

INSERT INTO `ordinateur` (`numSerie`, `nomPC`, `ram`, `disque`, `processeur`, `systemeExploitation`) VALUES
('SN-PC-001', 'PC-BUREAU-01', 16, 512, 'Intel Core i5', 'Windows 11'),
('SN-PC-002', 'PC-BUREAU-02', 8, 256, 'Intel Core i3', 'Windows 10');

-- --------------------------------------------------------

--
-- Structure de la table `personne`
--

DROP TABLE IF EXISTS `personne`;
CREATE TABLE IF NOT EXISTS `personne` (
  `matricule` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tel` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `poste` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `projet` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`matricule`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `personne`
--

INSERT INTO `personne` (`matricule`, `nom`, `prenom`, `tel`, `email`, `poste`, `projet`) VALUES
('W2ST2054', 'Randria', 'Toky', '0341234567', 'toky.randria@concentrix.com', 'Responsable IT', 'Inventaire 2025'),
('W2W12345', 'Razafindrakoto', 'Tsiry Ny Aina', '0339876543', 'tsirynyaina.razafindrakoto@concentrix.com', 'Technicien', 'IT Support'),
('W2W14678', 'Rajaonarison', 'Mamy Hasina', '0324567890', 'mamyhasina.rajaonarison@concentrix.com', 'Agent', 'Logistique'),
('W2W12365', 'Rakoto', 'Hery', '0341112223', 'hery.rakoto@concentrix.com', 'Technicien IT', 'IT Support'),
('W2W14576', 'Rabe', 'Toky', '0334445556', 'toky.rabe@concentrix.com', 'Responsable IT', 'Infrastructure'),
('W2W09823', 'Randriamampianina', 'Soa', '0327778889', 'soa.randriamampianina@concentrix.com', 'Agent', 'Service Client'),
('W2W10546', 'Andrianina', 'Fanja', '0349990001', 'fanja.andrianina@concentrix.com', 'Agent', 'Service Client');

-- --------------------------------------------------------

--
-- Structure de la table `position`
--

DROP TABLE IF EXISTS `position`;
CREATE TABLE IF NOT EXISTS `position` (
  `refPosition` varchar(20) NOT NULL,
  `designPosition` varchar(50) NOT NULL,
  `port` varchar(20) DEFAULT NULL,
  `occupation` tinyint(1) DEFAULT '0',
  `refSalle` varchar(10) NOT NULL,
  PRIMARY KEY (`refPosition`),
  KEY `fk_position_salle` (`refSalle`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `position`
--

INSERT INTO `position` (`refPosition`, `designPosition`, `port`, `occupation`, `refSalle`) VALUES
('POS001', 'Poste Bureau 1', 'Ethernet', 0, 'S001'),
('POS002', 'Poste Bureau 2', 'Ethernet', 0, 'S001'),
('POS003', 'Poste Support', 'WiFi', 0, 'S003'),
('A001', 'Poste Agent A01', 'USB-C', 1, 'SP01'),
('A002', 'Poste Agent A02', 'HDMI', 0, 'SP01'),
('IT01', 'Poste IT 01', 'HDMI', 1, 'ST03');

-- --------------------------------------------------------

--
-- Structure de la table `salle`
--

DROP TABLE IF EXISTS `salle`;
CREATE TABLE IF NOT EXISTS `salle` (
  `refSalle` varchar(10) NOT NULL,
  `nomSalle` varchar(50) NOT NULL,
  `etage` int NOT NULL,
  `site` varchar(50) NOT NULL,
  PRIMARY KEY (`refSalle`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `salle`
--

INSERT INTO `salle` (`refSalle`, `nomSalle`, `etage`, `site`) VALUES
('SF01', 'Salle de formation 01', 1, 'Tanashore'),
('ST02', 'Salle Techiques 02', 2, 'Tanashore'),
('PA03', 'Salle Production zone A', 1, 'Tanashore'),
('SP01', 'Salle Production A', 1, 'Zital'),
('SP02', 'Salle Production B', 2, 'Zital'),
('ST03', 'Salle IT Support', 1, 'Titan');

-- --------------------------------------------------------

--
-- Structure de la table `utilisateur`
--

DROP TABLE IF EXISTS `utilisateur`;
CREATE TABLE IF NOT EXISTS `utilisateur` (
  `matricule` varchar(8) NOT NULL,
  `nomUser` varchar(50) NOT NULL,
  `motDePasse` varchar(255) NOT NULL,
  `role` enum('Administrateur','Responsable') NOT NULL DEFAULT 'Responsable',
  PRIMARY KEY (`matricule`),
  UNIQUE KEY `nomUser` (`nomUser`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `utilisateur`
--

INSERT INTO `utilisateur` (`matricule`, `nomUser`, `motDePasse`, `role`) VALUES
('W2ST2054', 'admin', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8Z8ZPp8ZzYxE2pF6Q9E9X7e3W9KZy6', 'Administrateur'),
('W2W12345', 'tech_tsiry', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8Z8ZPp8ZzYxE2pF6Q9E9X7e3W9KZy6', 'Responsable'),
('W2W12365', 'it.support', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8Z8ZPp8ZzYxE2pF6Q9E9X7e3W9KZy6', 'Responsable'),
('W2W14576', 'admin.it', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8Z8ZPp8ZzYxE2pF6Q9E9X7e3W9KZy6', 'Administrateur');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
