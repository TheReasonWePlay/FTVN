import React, { useState, useEffect } from 'react';

import {
  Search,
  Plus,
  Eye,
  Trash2,
  Edit,
  Link2Off,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle
} from 'lucide-react';

import '../styles/Affectations.css';
import '../styles/tableau.css';
import '../styles/page.css';
import '../styles/modal.css';

import {
  getAllAffectations,
  getAffectationById,
  createAffectation,
  updateAffectation,
  deleteAffectation,
  closeAffectation
} from '../api/affectation-api';
import { getAllPositions } from '../api/position-api';
import { getAllPersonnes } from '../api/personne-api';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../hooks/useToast';
import type { Affectation } from '../api/affectation-api';
import type { Position, Personne } from '../types';
import PageHeader from '../components/PageHeader';

interface AffectationsData {
  totalAffectations: number;
  affectationsActives: number;
  affectationsTerminees: number;
  affectations: Affectation[];
}

interface AddAffectationFormProps {
  onClose: () => void;
  onSuccess: (affectation: Affectation) => void;
}

const AddAffectationForm: React.FC<AddAffectationFormProps> = ({ onClose, onSuccess }) => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    matricule: '',
    refPosition: ''
  });
  const [positions, setPositions] = useState<Position[]>([]);
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [positionsData, personnesData] = await Promise.all([
          getAllPositions(),
          getAllPersonnes()
        ]);
        setPositions(positionsData);
        setPersonnes(personnesData);
      } catch (error) {
        showError('Erreur lors du chargement des données');
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const { matricule, refPosition } = formData;

    if ((matricule && refPosition) || (!matricule && !refPosition)) {
      newErrors.general = 'Soit matricule soit refPosition doit être fourni, mais pas les deux.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await createAffectation(formData);
      // Fetch the created affectation to get full data
      const createdAffectation = await getAffectationById(result.refAffectation);
      onSuccess(createdAffectation);
      showSuccess('Affectation créée avec succès');
    } catch (error) {
      showError('Erreur lors de la création de l\'affectation');
      console.error('Error creating affectation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-body">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="matricule">Matricule (Personne)</label>
            <select
              id="matricule"
              name="matricule"
              value={formData.matricule}
              onChange={handleChange}
            >
              <option value="">Sélectionner une personne</option>
              {personnes.map(personne => (
                <option key={personne.matricule} value={personne.matricule}>
                  {personne.matricule} - {personne.nom} {personne.prenom}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="refPosition">Référence Position</label>
            <select
              id="refPosition"
              name="refPosition"
              value={formData.refPosition}
              onChange={handleChange}
            >
              <option value="">Sélectionner une position</option>
              {positions.map(position => (
                <option key={position.refPosition} value={position.refPosition}>
                  {position.refPosition} - {position.designPosition}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errors.general && <div className="error-message">{errors.general}</div>}
      </div>

      <div className="modal-footer">
        <button type="button" className="cancel-button" onClick={onClose}>
          Annuler
        </button>
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Création...' : 'Créer'}
        </button>
      </div>
    </form>
  );
};

interface EditAffectationFormProps {
  affectation: Affectation;
  onClose: () => void;
  onSuccess: (affectation: Affectation) => void;
}

const EditAffectationForm: React.FC<EditAffectationFormProps> = ({ affectation, onClose, onSuccess }) => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    matricule: affectation.matricule || '',
    refPosition: affectation.refPosition || ''
  });
  const [positions, setPositions] = useState<Position[]>([]);
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [positionsData, personnesData] = await Promise.all([
          getAllPositions(),
          getAllPersonnes()
        ]);
        setPositions(positionsData);
        setPersonnes(personnesData);
      } catch (error) {
        showError('Erreur lors du chargement des données');
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const { matricule, refPosition } = formData;

    if ((matricule && refPosition) || (!matricule && !refPosition)) {
      newErrors.general = 'Soit matricule soit refPosition doit être fourni, mais pas les deux.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await updateAffectation(affectation.refAffectation, formData);
      // Fetch the updated affectation
      const updatedAffectation = await getAffectationById(affectation.refAffectation);
      onSuccess(updatedAffectation);
      showSuccess('Affectation mise à jour avec succès');
    } catch (error) {
      showError('Erreur lors de la mise à jour de l\'affectation');
      console.error('Error updating affectation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-body">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="matricule">Matricule (Personne)</label>
            <select
              id="matricule"
              name="matricule"
              value={formData.matricule}
              onChange={handleChange}
            >
              <option value="">Sélectionner une personne</option>
              {personnes.map(personne => (
                <option key={personne.matricule} value={personne.matricule}>
                  {personne.matricule} - {personne.nom} {personne.prenom}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="refPosition">Référence Position</label>
            <select
              id="refPosition"
              name="refPosition"
              value={formData.refPosition}
              onChange={handleChange}
            >
              <option value="">Sélectionner une position</option>
              {positions.map(position => (
                <option key={position.refPosition} value={position.refPosition}>
                  {position.refPosition} - {position.designPosition}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errors.general && <div className="error-message">{errors.general}</div>}
      </div>

      <div className="modal-footer">
        <button type="button" className="cancel-button" onClick={onClose}>
          Annuler
        </button>
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Mise à jour...' : 'Mettre à jour'}
        </button>
      </div>
    </form>
  );
};

const Affectations: React.FC = () => {
  const { theme } = useTheme();
  const { showSuccess, showError } = useToast();
  const [affectationsData, setAffectationsData] = useState<AffectationsData>({
    totalAffectations: 0,
    affectationsActives: 0,
    affectationsTerminees: 0,
    affectations: []
  });
  const [filteredAffectations, setFilteredAffectations] = useState<Affectation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filters, setFilters] = useState({
    refAffectation: '',
    refPosition: '',
    matricule: ''
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof Affectation; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAjouterModal, setShowAjouterModal] = useState(false);
  const [showConsulterModal, setShowConsulterModal] = useState(false);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [showCloreModal, setShowCloreModal] = useState(false);
  const [showSupprimerModal, setShowSupprimerModal] = useState(false);
  const [selectedAffectation, setSelectedAffectation] = useState<Affectation | null>(null);

  useEffect(() => {
    const fetchAffectations = async () => {
      try {
        const affectations = await getAllAffectations();
        const actives = affectations.filter(aff => !aff.dateFin || new Date(aff.dateFin) > new Date()).length;
        const terminees = affectations.filter(aff => aff.dateFin && new Date(aff.dateFin) <= new Date()).length;

        setAffectationsData({
          totalAffectations: affectations.length,
          affectationsActives: actives,
          affectationsTerminees: terminees,
          affectations: affectations
        });
        setFilteredAffectations(affectations);
      } catch (error) {
        console.error('Error fetching affectations:', error);
        // Handle error state
      }
    };

    fetchAffectations();
  }, []);

  useEffect(() => {
    const filtered = affectationsData.affectations.filter(affectation => {
      const matchesSearch = affectation.refAffectation.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (affectation.refPosition?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (affectation.matricule?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           affectation.dateDebut.includes(searchTerm) ||
                           (affectation.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (affectation.prenom?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesDateRange = (!dateFrom || affectation.dateDebut >= dateFrom) &&
                              (!dateTo || affectation.dateDebut <= dateTo);
      const matchesFilters = (!filters.refAffectation || affectation.refAffectation.toString().toLowerCase().includes(filters.refAffectation.toLowerCase())) &&
                            (!filters.refPosition || (affectation.refPosition?.toLowerCase() || '').includes(filters.refPosition.toLowerCase())) &&
                            (!filters.matricule || (affectation.matricule?.toLowerCase() || '').includes(filters.matricule.toLowerCase()));

      return matchesSearch && matchesDateRange && matchesFilters;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredAffectations(filtered);
    setCurrentPage(1);
  }, [searchTerm, dateFrom, dateTo, filters, sortConfig, affectationsData.affectations]);



  const handleSort = (key: keyof Affectation) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleConsulterAffectation = (affectation: Affectation) => {
    setSelectedAffectation(affectation);
    setShowConsulterModal(true);
  };

  const handleModifierAffectation = (affectation: Affectation) => {
    setSelectedAffectation(affectation);
    setShowModifierModal(true);
  };

  const handleCloreAffectationConfirm = (affectation: Affectation) => {
    setSelectedAffectation(affectation);
    setShowCloreModal(true);
  };

  const handleSupprimerAffectationConfirm = (affectation: Affectation) => {
    setSelectedAffectation(affectation);
    setShowSupprimerModal(true);
  };

  const confirmCloreAffectation = async () => {
    if (!selectedAffectation) return;
    try {
      await closeAffectation(selectedAffectation.refAffectation);
      setAffectationsData(prev => ({
        ...prev,
        affectations: prev.affectations.map(aff =>
          aff.refAffectation === selectedAffectation.refAffectation
            ? { ...aff, dateFin: new Date().toISOString().split('T')[0] }
            : aff
        )
      }));
      showSuccess('Affectation clôturée avec succès');
      setShowCloreModal(false);
      setSelectedAffectation(null);
    } catch (error) {
      showError('Erreur lors de la clôture de l\'affectation');
      console.error('Error closing affectation:', error);
    }
  };

  const confirmSupprimerAffectation = async () => {
    if (!selectedAffectation) return;
    try {
      await deleteAffectation(selectedAffectation.refAffectation);
      setAffectationsData(prev => ({
        ...prev,
        affectations: prev.affectations.filter(aff => aff.refAffectation !== selectedAffectation.refAffectation),
        totalAffectations: prev.totalAffectations - 1
      }));
      showSuccess('Affectation supprimée avec succès');
      setShowSupprimerModal(false);
      setSelectedAffectation(null);
    } catch (error) {
      showError('Erreur lors de la suppression de l\'affectation');
      console.error('Error deleting affectation:', error);
    }
  };

  const handleBack = () => {
    // In real app, navigate back or to dashboard
    window.history.back();
  };

  const paginatedAffectations = filteredAffectations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAffectations.length / itemsPerPage);

  return (
    <div className={`affectations-container ${theme}`}>
      {/* Header */}
      <PageHeader title='Affectations' onBack={handleBack} />

      {/* Search and Filters */}
      <section className="search-filters-section">
        <div className="search-filters">
          <div className="search-group">
            <div className="search-input-container">
              <Search size={16} />
              <input
                type="text"
                placeholder="Rechercher par réf. affectation, réf. position, numéro de série ou date de début"
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

          <button className="add-button" onClick={() => setShowAjouterModal(true)}>
            <Plus size={16} />
            Ajouter
          </button>
        </div>
      </section>

      {/* Affectations Table */}
      <section className="table-section">
        <div className="table-container">
          <table className="affectations-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="text"
                    placeholder="Réf. Affectation"
                    value={filters.refAffectation}
                    onChange={(e) => handleFilterChange('refAffectation', e.target.value)}
                  />
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Réf. Position"
                    value={filters.refPosition}
                    onChange={(e) => handleFilterChange('refPosition', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Matricule"
                    value={filters.matricule}
                    onChange={(e) => handleFilterChange('matricule', e.target.value)}
                  />
                </th>
                <th onClick={() => handleSort('dateDebut')}>
                  Date début
                  {sortConfig?.key === 'dateDebut' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </th>
                <th>Date fin</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAffectations.map((affectation) => (
                <tr key={affectation.refAffectation}>
                  <td>{affectation.refAffectation}</td>
                  <td>{affectation.refPosition || affectation.matricule}</td>
                  <td>{affectation.dateDebut}</td>
                  <td>{affectation.dateFin || 'En cours'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className=" action-btn consulter"
                        onClick={() => handleConsulterAffectation(affectation)}
                        aria-label="Consulter"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className=' action-btn edit'
                        onClick={() => handleModifierAffectation(affectation)}
                        aria-label="Modifier"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className=' action-btn close'
                        onClick={() => handleCloreAffectationConfirm(affectation)}
                        aria-label="Clore" disabled={!!affectation.dateFin}
                      >
                        <Link2Off size={14} />
                      </button>
                      <button
                        className='action-btn delete'
                        onClick={() => handleSupprimerAffectationConfirm(affectation)}
                        aria-label="Supprimer"
                      >
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
      {/* Add Modal */}
      {showAjouterModal && (
        <div className="modal-overlay" onClick={() => setShowAjouterModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ajouter une Affectation</h2>
              <button className="close-button" onClick={() => setShowAjouterModal(false)} aria-label="Fermer">
                <X size={20} />
              </button>
            </div>

            <AddAffectationForm
              onClose={() => setShowAjouterModal(false)}
              onSuccess={(newAffectation) => {
                setAffectationsData(prev => ({
                  ...prev,
                  affectations: [...prev.affectations, newAffectation],
                  totalAffectations: prev.totalAffectations + 1
                }));
                setShowAjouterModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModifierModal && selectedAffectation && (
        <div className="modal-overlay" onClick={() => setShowModifierModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Modifier l'Affectation</h2>
              <button className="close-button" onClick={() => setShowModifierModal(false)} aria-label="Fermer">
                <X size={20} />
              </button>
            </div>

            <EditAffectationForm
              affectation={selectedAffectation}
              onClose={() => setShowModifierModal(false)}
              onSuccess={(updatedAffectation) => {
                setAffectationsData(prev => ({
                  ...prev,
                  affectations: prev.affectations.map(aff =>
                    aff.refAffectation === updatedAffectation.refAffectation ? updatedAffectation : aff
                  )
                }));
                setShowModifierModal(false);
                setSelectedAffectation(null);
              }}
            />
          </div>
        </div>
      )}

      {/* View Modal */}
      {showConsulterModal && selectedAffectation && (
        <div className="modal-overlay" onClick={() => setShowConsulterModal(false)}>
          <div className="modal-content consulter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Détails de l'Affectation</h2>
              <button className="close-button" onClick={() => setShowConsulterModal(false)} aria-label="Fermer">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Informations générales */}
              <div className="detail-section">
                <h3>Informations Générales</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Référence d'Affectation</label>
                    <span>{selectedAffectation.refAffectation}</span>
                  </div>
                  <div className="detail-item">
                    <label>Référence de Position</label>
                    <span>{selectedAffectation.refPosition}</span>
                  </div>
                  <div className="detail-item">
                    <label>Date de début</label>
                    <span>{selectedAffectation.dateDebut}</span>
                  </div>
                  <div className="detail-item">
                    <label>Date de fin</label>
                    <span>{selectedAffectation.dateFin || 'En cours'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Matricule</label>
                    <span>{selectedAffectation.matricule}</span>
                  </div>
                  <div className="detail-item">
                    <label>Prénom</label>
                    <span>{selectedAffectation.prenom}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setShowConsulterModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Confirmation Modal */}
      {showCloreModal && selectedAffectation && (
        <div className="modal-overlay" onClick={() => setShowCloreModal(false)}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmer la clôture</h2>
              <button className="close-button" onClick={() => setShowCloreModal(false)} aria-label="Fermer">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="confirm-message">
                <AlertTriangle size={48} color="orange" />
                <p>Êtes-vous sûr de vouloir clôturer l'affectation <strong>{selectedAffectation.refAffectation}</strong> ?</p>
                <p>Cette action définira la date de fin à aujourd'hui et marquera l'affectation comme terminée.</p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setShowCloreModal(false)}>
                Annuler
              </button>
              <button className="confirm-button" onClick={confirmCloreAffectation}>
                Clôturer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showSupprimerModal && selectedAffectation && (
        <div className="modal-overlay" onClick={() => setShowSupprimerModal(false)}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmer la suppression</h2>
              <button className="close-button" onClick={() => setShowSupprimerModal(false)} aria-label="Fermer">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="confirm-message">
                <AlertTriangle size={48} color="red" />
                <p>Êtes-vous sûr de vouloir supprimer l'affectation <strong>{selectedAffectation.refAffectation}</strong> ?</p>
                <p>Cette action est irréversible et supprimera définitivement l'affectation.</p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setShowSupprimerModal(false)}>
                Annuler
              </button>
              <button className="delete-button" onClick={confirmSupprimerAffectation}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Affectations;
