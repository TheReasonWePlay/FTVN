import React, { useState, useEffect } from 'react';

import {
  Search,
  Plus,
  Eye,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronLeft as BackIcon,
  CheckCircle,
  X,
  Square
} from 'lucide-react';

import '../styles/Inventaires.css';
import '../styles/modal.css';
import '../styles/Materiels.css';

import { getAllInventaires, deleteInventaire, startInventaire, filterInventaires, validateInventaire } from '../api/inventaire-api';
import { getAllSalles } from '../api/salle-api';
import type { Salle, Inventaire, Materiel, Incident } from '../types';
import { useToast } from '../hooks/useToast';
import LoadingState from '../components/LoadingState';
import ErrorBoundary from '../components/ErrorBoundary';
import PageHeader from '../components/PageHeader';
import { useTheme } from '../contexts/ThemeContext';

interface ModalInventaire {
  refInventaire: string;
  date: string;
  salle: string;
  matricule: string;
  materiels: Materiel[];
}

interface InventairesData {
  totalInventaires: number;
  inventaires: Inventaire[];
}

const Inventaires: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const toast = useToast();
  useTheme(); // Use global ThemeContext
  const [filteredInventaires, setFilteredInventaires] = useState<Inventaire[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filters, setFilters] = useState({
    salle: '',
    matricule: ''
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof Inventaire; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showConfirmerModal, setShowConfirmerModal] = useState(false);
  const [showConsulterModal, setShowConsulterModal] = useState(false);
  const [showSignalerModal, setShowSignalerModal] = useState(false);
  const [selectedInventaire, setSelectedInventaire] = useState<ModalInventaire | null>(null);
  const [selectedSalle, setSelectedSalle] = useState<string>('');
  const [salles, setSalles] = useState<Salle[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch inventaires
        const inventaires = await getAllInventaires();
        setInventairesData({
          totalInventaires: inventaires.length,
          inventaires: inventaires
        });
        setFilteredInventaires(inventaires);

        // Fetch salles
        const sallesData = await getAllSalles();
        setSalles(sallesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Handle error state
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchFilteredInventaires = async () => {
      setLoading(true);
      try {
        const filtersObj: Record<string, string> = {};
        if (searchTerm) {
          filtersObj.search = searchTerm;
        }
        if (dateFrom) {
          filtersObj.dateDebut = dateFrom;
        }
        if (dateTo) {
          filtersObj.dateFin = dateTo;
        }
        if (filters.salle) {
          filtersObj.refSalle = filters.salle;
        }
        if (filters.matricule) {
          filtersObj.matricule = filters.matricule;
        }

        const filtered = await filterInventaires(filtersObj);

        if (sortConfig) {
          filtered.sort((a, b) => {
            let aValue: string | number | Date = '';
            let bValue: string | number | Date = '';

            switch (sortConfig.key) {
              case 'refInventaire':
                aValue = a.refInventaire;
                bValue = b.refInventaire;
                break;

              case 'date':
                aValue = new Date(a.date);
                bValue = new Date(b.date);
                break;

              case 'refSalle':
                aValue = a.salle?.nomSalle ?? a.refSalle ?? '';
                bValue = b.salle?.nomSalle ?? b.refSalle ?? '';
                break;

              case 'matricule':
                aValue = a.personne?.nom ?? a.matricule ?? '';
                bValue = b.personne?.nom ?? b.matricule ?? '';
                break;

              default:
                aValue = '';
                bValue = '';
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
          });
        }



        setFilteredInventaires(filtered);
        setCurrentPage(1);
      } catch (error) {
        console.error('Error filtering inventaires:', error);
        toast.showError('Erreur lors de la filtration des inventaires');
      } finally {
        setLoading(false);
      }
    };
    fetchFilteredInventaires();

  }, [searchTerm, dateFrom, dateTo, filters, sortConfig]);



  const handleSort = (key: keyof Inventaire) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleFaireInventaire = () => {
    // In real app, redirect to salles page
    // For now, use the first available salle
    if (salles.length > 0) {
      setSelectedSalle(salles[0].refSalle);
    } else {
      setSelectedSalle('Salle A101'); // Fallback
    }
    setShowConfirmerModal(true);
  };

  const handleConfirmerInventaire = async () => {
    setLoading(true);
    try {
      await startInventaire({
        observation: '',
        refSalle: selectedSalle
      });

      // Refresh the list
      const inventaires = await getAllInventaires();
      setFilteredInventaires(inventaires);
      setShowConfirmerModal(false);
      toast.showSuccess('Inventaire créé avec succès');
    } catch (error) {
      console.error('Error creating inventaire:', error);
      toast.showError('Erreur lors de la création de l\'inventaire');
    } finally {
      setLoading(false);
    }
  };

  const handleConsulterInventaire = (inventaire: Inventaire) => {
    const modalInventaire: ModalInventaire = {
      refInventaire: inventaire.refInventaire.toString(),
      date: inventaire.date,
      salle: inventaire.salle?.nomSalle || inventaire.refSalle,
      matricule: inventaire.matricule,
      materiels: inventaire.materiels || []
    };
    setSelectedInventaire(modalInventaire);
    setShowConsulterModal(true);
  };

  const handleSupprimerInventaire = async (refInventaire: number) => {
    setLoading(true);
    try {
      await deleteInventaire(refInventaire);
      // Refresh the list
      const inventaires = await getAllInventaires();
      setFilteredInventaires(inventaires);
      toast.showSuccess('Inventaire supprimé avec succès');
    } catch (error) {
      console.error('Error deleting inventaire:', error);
      toast.showError('Erreur lors de la suppression de l\'inventaire');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateInventaire = async (refInventaire: number) => {
    setLoading(true);
    try {
      await validateInventaire(refInventaire);
      // Refresh the list
      const inventaires = await getAllInventaires();
      setFilteredInventaires(inventaires);
      toast.showSuccess('Inventaire validé avec succès');
    } catch (error) {
      console.error('Error validating inventaire:', error);
      toast.showError('Erreur lors de la validation de l\'inventaire');
    } finally {
      setLoading(false);
    }
  };

  const handleAnomalieDetected = () => {
    setShowConfirmerModal(false);
    setShowSignalerModal(true);
  };

  const handleSignalerIncident = (incidentData: Incident) => {
    // Handle incident reporting
    console.log('Incident signalé:', incidentData);
    setShowSignalerModal(false);
  };

  const handleBack = () => {
    // In real app, navigate back or to dashboard
    window.history.back();
  };

  const paginatedInventaires = filteredInventaires.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredInventaires.length / itemsPerPage);

  // Modal Components
  const ModalConfirmerInventaire: React.FC<{
    salle: string;
    onClose: () => void;
    onConfirm: () => void;
    onAnomalie: () => void;
  }> = ({ salle, onClose, onConfirm, onAnomalie }) => {
    const [materielsCount, setMaterielsCount] = useState<{ categorie: string; count: number; confirmed: boolean }[]>([]);
    const [hasAnomalie, setHasAnomalie] = useState(false);

    useEffect(() => {
      // Mock data - in real app, fetch materiels for the salle
      const mockMaterielsCount = [
        { categorie: 'Ordinateur', count: 5, confirmed: false },
        { categorie: 'Souris', count: 5, confirmed: false },
        { categorie: 'Clavier', count: 5, confirmed: false },
        { categorie: 'Imprimante', count: 2, confirmed: false },
        { categorie: 'Téléphone', count: 3, confirmed: false }
      ];
      setMaterielsCount(mockMaterielsCount);
    }, [salle]);

    const handleToggleConfirm = (index: number) => {
      setMaterielsCount(prev =>
        prev.map((item, i) =>
          i === index ? { ...item, confirmed: !item.confirmed } : item
        )
      );
    };

    const handleValidate = () => {
      const allConfirmed = materielsCount.every(item => item.confirmed);

      if (!allConfirmed) {
        setHasAnomalie(true);
        onAnomalie();
        return;
      }

      onConfirm();
    };

    const allConfirmed = materielsCount.every(item => item.confirmed);

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content form-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Confirmer l'Inventaire - {salle}</h2>
            <button className="close-button" onClick={onClose} aria-label="Fermer">
              <X size={20} />
            </button>
          </div>

          <div className="modal-body">
            <div className="detail-section">
              <h3>Matériels par Catégorie</h3>
              <p>Veuillez confirmer le nombre de matériels présents dans la salle.</p>

              <div className="materiels-count-list">
                {materielsCount.map((item, index) => (
                  <div key={item.categorie} className="materiels-count-item">
                    <button
                      type="button"
                      onClick={() => handleToggleConfirm(index)}
                      className="confirm-checkbox"
                      aria-label={item.confirmed ? 'Décocher' : 'Cocher'}
                    >
                      {item.confirmed ? <CheckCircle size={20} /> : <Square size={20} />}
                    </button>
                    <span className="categorie-name">{item.categorie}</span>
                    <span className="count">({item.count})</span>
                  </div>
                ))}
              </div>

              {hasAnomalie && (
                <div className="anomalie-message">
                  <p>Une anomalie a été détectée. Voulez-vous signaler un incident ?</p>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-button" onClick={onClose}>
              Annuler
            </button>
            <button
              type="button"
              className="submit-button"
              onClick={handleValidate}
              disabled={!allConfirmed && !hasAnomalie}
            >
              Valider l'Inventaire
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ModalConsulterInventaire: React.FC<{
    inventaire: ModalInventaire;
    onClose: () => void;
  }> = ({ inventaire, onClose }) => {
    // Fonction pour générer une classe CSS à partir du statut
    const getStatusClass = (status: string) => {
      return `status-${status
        .normalize('NFD') //enlever les accents
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-') //remplacer espaces par tirets
        .toLowerCase()
      }`;
    };

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content consulter-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="modal-header">
            <h2>Détails de l'Inventaire</h2>
            <button className="close-button" onClick={onClose} aria-label="Fermer">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body">
            <div className="inventaire-details">
              {/* Informations générales */}
              <div className="detail-section">
                <h3>Informations Générales</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Réf. Inventaire:</label>
                    <span>{inventaire.refInventaire}</span>
                  </div>
                  <div className="detail-item">
                    <label>Date:</label>
                    <span>{inventaire.date}</span>
                  </div>
                  <div className="detail-item">
                    <label>Salle:</label>
                    <span>{inventaire.salle}</span>
                  </div>
                  <div className="detail-item">
                    <label>Matricule:</label>
                    <span>{inventaire.matricule}</span>
                  </div>
                  <div className="detail-item">
                    <label>Nombre de Matériels:</label>
                    <span>{inventaire.materiels.length}</span>
                  </div>
                </div>
              </div>

              {/* Matériels Inventoriés */}
              <div className="detail-section">
                <h3>Matériels Inventoriés</h3>
                <div className="materiels-list">
                  {inventaire.materiels.map((materiel) => {
                    const statusClass = getStatusClass(materiel.status);

                    return (
                      <div key={materiel.numSerie} className="materiel-item">
                        <div className="materiel-info">
                          <div className="materiel-header">
                            <span className="num-serie">{materiel.numSerie}</span>
                            <span className={`status-badge ${statusClass}`}>
                              {materiel.status}
                            </span>
                          </div>
                          <div className="materiel-details">
                            <span>{materiel.marque} {materiel.modele}</span>
                            <span className="categorie">({materiel.categorie})</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button className="cancel-button" onClick={onClose}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ModalSignalerIncident: React.FC<{
    onClose: () => void;
    onAdd: (incident: Incident) => void;
  }> = ({ onClose, onAdd }) => {
    const [formData, setFormData] = useState({
      refIncident: '',
      refInventaire: '',
      typeIncident: '',
      numSerie: '',
      matricule: '',
      prenom: '',
      description: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      if (isFormValid()) {
        const incident: Incident = {
          refIncident: formData.refIncident,
          refInventaire: formData.refInventaire,
          typeIncident: formData.typeIncident,
          numSerie: formData.numSerie,
          statutIncident: 'Ouvert',
          dateInc: new Date().toISOString().split('T')[0],
          matricule: formData.matricule,
          prenom: formData.prenom,
          description: formData.description
        };
        onAdd(incident);
        setFormData({
          refIncident: '',
          refInventaire: '',
          typeIncident: '',
          numSerie: '',
          matricule: '',
          prenom: '',
          description: ''
        });
        onClose();
      }
    };

    const isFormValid = () => {
      return formData.refIncident && formData.refInventaire && formData.typeIncident && formData.numSerie && formData.matricule && formData.prenom && formData.description;
    };

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content form-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Signaler un Incident</h2>
            <button className="close-button" onClick={onClose} aria-label="Fermer">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="refIncident">Référence Incident *</label>
                  <input
                    type="text"
                    id="refIncident"
                    name="refIncident"
                    value={formData.refIncident}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="refInventaire">Référence Inventaire *</label>
                  <input
                    type="text"
                    id="refInventaire"
                    name="refInventaire"
                    value={formData.refInventaire}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="typeIncident">Type d'Incident *</label>
                  <select
                    id="typeIncident"
                    name="typeIncident"
                    value={formData.typeIncident}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Sélectionner un type</option>
                    <option value="Panne matériel">Panne matériel</option>
                    <option value="Panne logicielle">Panne logicielle</option>
                    <option value="Vol">Vol</option>
                    <option value="Perte">Perte</option>
                    <option value="Dégât">Dégât</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="numSerie">Numéro de Série *</label>
                  <input
                    type="text"
                    id="numSerie"
                    name="numSerie"
                    value={formData.numSerie}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="matricule">Matricule *</label>
                  <input
                    type="text"
                    id="matricule"
                    name="matricule"
                    value={formData.matricule}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="prenom">Prénom *</label>
                  <input
                    type="text"
                    id="prenom"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Décrivez l'incident..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} className="cancel-button">
                Annuler
              </button>
              <button type="submit" className="submit-button" disabled={!isFormValid()}>
                Signaler
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="inventaires-container">
      {/* Header */}
      <PageHeader title="Inventaires" onBack={handleBack} />

      {/* Search and Filters */}
      <section className="search-filters-section">
        <div className="search-filters">
          <div className="search-group">
            <div className="search-input-container">
              <Search size={16} />
              <input
                type="text"
                placeholder="Rechercher par réf. inventaire ou date"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="date-filters">
            <div className="date-input-container">
              <Calendar size={16} />
              <input
                type="date"
                placeholder="Date de début"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <span>à</span>
            <div className="date-input-container">
              <Calendar size={16} />
              <input
                type="date"
                placeholder="Date de fin"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <button className="add-button" onClick={handleFaireInventaire}>
            <Plus size={16} />
            Faire un inventaire
          </button>
        </div>
      </section>

      {/* Inventaires Table */}
      <section className="table-section">
        {loading && <LoadingState />}
        <div className="table-container">
          <table className="inventaires-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('refInventaire')}>
                  Réf. Inventaire
                  {sortConfig?.key === 'refInventaire' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </th>
                <th onClick={() => handleSort('date')}>
                  Date
                  {sortConfig?.key === 'date' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </th>
                <th onClick={() => handleSort('refSalle')}>
                  <input
                    type="text"
                    placeholder="Salle"
                    value={filters.salle}
                    onChange={(e) => handleFilterChange('salle', e.target.value)}
                  />
                  {sortConfig?.key === 'refSalle' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </th>
                <th onClick={() => handleSort('matricule')}>
                  <input
                    type="text"
                    placeholder="Matricule"
                    value={filters.matricule}
                    onChange={(e) => handleFilterChange('matricule', e.target.value)}
                  />
                  {sortConfig?.key === 'matricule' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInventaires.map((inventaire) => (
                <tr key={inventaire.refInventaire}>
                  <td>{inventaire.refInventaire}</td>
                  <td>{inventaire.date}</td>
                  <td>{inventaire.salle?.nomSalle || inventaire.refSalle}</td>
                  <td>{inventaire.personne?.nom || inventaire.matricule}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleConsulterInventaire(inventaire)} aria-label="Consulter">
                        <Eye size={14} />
                      </button>
                      {!inventaire.fin && (
                        <button onClick={() => handleValidateInventaire(inventaire.refInventaire)} aria-label="Valider">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      <button onClick={() => handleSupprimerInventaire(inventaire.refInventaire)} aria-label="Supprimer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            aria-label="Page précédente"
          >
            <ChevronLeft size={16} />
          </button>
          <span>Page {currentPage} sur {totalPages}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            aria-label="Page suivante"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* Modals */}
      {showConfirmerModal && (
        <ModalConfirmerInventaire
          salle={selectedSalle}
          onClose={() => setShowConfirmerModal(false)}
          onConfirm={handleConfirmerInventaire}
          onAnomalie={handleAnomalieDetected}
        />
      )}

      {showConsulterModal && selectedInventaire && (
        <ModalConsulterInventaire
          inventaire={selectedInventaire}
          onClose={() => setShowConsulterModal(false)}
        />
      )}

      {showSignalerModal && (
        <ModalSignalerIncident
          onClose={() => setShowSignalerModal(false)}
          onAdd={handleSignalerIncident}
        />
      )}
    </div>
    </ErrorBoundary>
  );
};

export default Inventaires;
