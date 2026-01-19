import React, { useState, useEffect } from 'react';

import {
  Search,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

import { getAllSalles, getMaterielsStatsBySalle } from '../api/salle-api';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/ListeSalles.css';

interface Salle {
  refSalle: string;
  nomSalle: string;
  etage: string;
  site: string;
}

interface MaterielStats {
  categorie: string;
  marque: string;
  count: number;
}

const ListeSalles: React.FC = () => {
  const { theme } = useTheme();
  const [salles, setSalles] = useState<Salle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSalle, setSelectedSalle] = useState<Salle | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [materielsStats, setMaterielsStats] = useState<MaterielStats[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [errorStats, setErrorStats] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalles = async () => {
      try {
        const sallesData = await getAllSalles();
        setSalles(sallesData);
      } catch (error) {
        console.error('Erreur lors du chargement des salles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalles();
  }, []);

  const filteredSalles = salles.filter(salle =>
    salle.refSalle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    salle.nomSalle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectSalle = (salle: Salle) => {
    setSelectedSalle(salle);
    setShowModal(true);
  };

  const handleBack = () => {
    window.history.back();
  };

  useEffect(() => {
    if (selectedSalle) {
      const fetchStats = async () => {
        setLoadingStats(true);
        setErrorStats(null);
        try {
          const stats = await getMaterielsStatsBySalle(selectedSalle.refSalle);
          setMaterielsStats(stats);
        } catch (error) {
          console.error('Erreur lors du chargement des statistiques:', error);
          setErrorStats('Erreur lors du chargement des statistiques');
        } finally {
          setLoadingStats(false);
        }
      };
      fetchStats();
    }
  }, [selectedSalle]);

  if (loading) {
    return (
      <div className="liste-salles-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des salles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`liste-salles-container ${theme}`}>
      {/* Header */}
      <header className="liste-salles-header">
        <div className="header-left">
          <button className="back-button" onClick={handleBack} aria-label="Retour">
            <ChevronLeft size={20} />
          </button>
          <h1 className="page-title">Sélectionner une Salle pour l'Inventaire</h1>
        </div>
      </header>

      {/* Search */}
      <section className="search-section">
        <div className="search-input-container">
          <Search size={16} />
          <input
            type="text"
            placeholder="Rechercher par référence ou nom de salle"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      {/* Salles List */}
      <section className="salles-list-section">
        <div className="salles-grid">
          {filteredSalles.map((salle) => (
            <div key={salle.refSalle} className="salle-card">
              <div className="salle-info">
                <h3>{salle.refSalle}</h3>
                <p>{salle.nomSalle}</p>
                <div className="salle-details">
                  <span>Étage: {salle.etage}</span>
                  <span>Site: {salle.site}</span>
                </div>
              </div>
              <button
                className="select-button"
                onClick={() => handleSelectSalle(salle)}
                title='salle-select'
              >
                <ChevronRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Modal */}
      {showModal && selectedSalle && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className={`modal-content ${theme}`} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Statistiques des Matériels - {selectedSalle.nomSalle}</h2>
              <button className="close-button" onClick={() => setShowModal(false)} aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {loadingStats ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Chargement des statistiques...</p>
                </div>
              ) : errorStats ? (
                <div className="error-container">
                  <p>{errorStats}</p>
                </div>
              ) : materielsStats.length === 0 ? (
                <div className="empty-container">
                  <p>Aucun matériel trouvé pour cette salle.</p>
                </div>
              ) : (
                <div className="stats-section">
                  {Object.entries(
                    materielsStats.reduce((acc, stat) => {
                      if (!acc[stat.categorie]) acc[stat.categorie] = [];
                      acc[stat.categorie].push(stat);
                      return acc;
                    }, {} as Record<string, MaterielStats[]>)
                  ).map(([categorie, stats]) => (
                    <div key={categorie} className="category-group">
                      <h3>{categorie}</h3>
                      <ul className="brands-list">
                        {stats.map((stat) => (
                          <li key={stat.marque} className="brand-item">
                            <span className="brand-name">{stat.marque}</span>
                            <span className="brand-count">({stat.count})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



export default ListeSalles;
