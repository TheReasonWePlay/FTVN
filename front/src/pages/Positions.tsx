import React, { useState, useEffect, useMemo } from 'react';

import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Package,
  ChevronLeft as BackIcon
} from 'lucide-react';

import {
  getAllPositions,
  createPosition,
  deletePosition,
  updatePosition } from '../api/position-api';
import { getAllSalles } from '../api/salle-api';
import { getAffectationsBySalle } from '../api/affectation-api';
import { getAllMateriels } from '../api/materiel-api';
import { useTheme } from '../contexts/ThemeContext';

import '../styles/Positions.css';

interface Position {
  refPosition: string;
  designPosition: string;
  port: string;
  occupation: string;
  refSalle: string;
  nomSalle?: string;
}

interface Salle {
  refSalle: string;
  nomSalle: string;
}

interface Affectation {
  refAffectation: number;
  matricule: string;
  refPosition: string;
  dateDebut: string;
  dateFin: string;
  dateOut?: string;
  status: 'Active' | 'Closed';
  user?: string;
}

interface Materiel {
  numSerie: string;
  marque: string;
  modele: string;
  status: string;
  categorie: string;
  dateAjout: string;
  refAffectation: number;
}

const ModalAjouterPosition: React.FC<{
  salles: Salle[];
  onClose: () => void;
  onSubmit: (position: Omit<Position, 'nomSalle'>) => void;
}> = ({ salles, onClose, onSubmit }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    refPosition: '',
    designPosition: '',
    port: '',
    occupation: 'Libre',
    refSalle: ''
  });

  const [bulkPositions, setBulkPositions] = useState<Array<Omit<Position, 'nomSalle'>>>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isBulkMode) {
      // Submit all bulk positions
      bulkPositions.forEach(position => {
        if (position.refPosition && position.designPosition && position.port && position.refSalle) {
          onSubmit(position);
        }
      });
    } else {
      // Submit single position
      if (formData.refPosition && formData.designPosition && formData.port && formData.refSalle) {
        onSubmit(formData);
      }
    }
  };

  const addBulkPosition = () => {
    if (formData.refPosition && formData.designPosition && formData.port && formData.refSalle) {
      setBulkPositions(prev => [...prev, { ...formData }]);
      // Reset form for next entry
      setFormData({
        refPosition: '',
        designPosition: '',
        port: '',
        occupation: 'Libre',
        refSalle: ''
      });
    }
  };

  const removeBulkPosition = (index: number) => {
    setBulkPositions(prev => prev.filter((_, i) => i !== index));
  };

  const isFormValid = formData.refPosition && formData.designPosition && formData.port && formData.refSalle;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content add-position-modal ${theme}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Ajouter une Position</h2>
          <button className="close-button" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Mode Toggle */}
            <div className="form-section">
              <div className="mode-toggle">
                <label>
                  <input
                    type="radio"
                    name="mode"
                    checked={!isBulkMode}
                    onChange={() => setIsBulkMode(false)}
                  />
                  Ajout simple
                </label>
                <label>
                  <input
                    type="radio"
                    name="mode"
                    checked={isBulkMode}
                    onChange={() => setIsBulkMode(true)}
                  />
                  Ajout en masse
                </label>
              </div>
            </div>

            {/* Single Position Form */}
            {!isBulkMode && (
              <div className="form-section">
                <h3>Informations de la Position</h3>
                <div className="form-grid">
                  <div className="form-item">
                    <label>Référence Position *</label>
                    <input
                      type="text"
                      value={formData.refPosition}
                      onChange={(e) => handleInputChange('refPosition', e.target.value)}
                      placeholder="Ex: POS001"
                      required
                    />
                  </div>
                  <div className="form-item">
                    <label>Désignation Position *</label>
                    <input
                      type="text"
                      value={formData.designPosition}
                      onChange={(e) => handleInputChange('designPosition', e.target.value)}
                      placeholder="Ex: Position Bureau 1"
                      required
                    />
                  </div>
                  <div className="form-item">
                    <label>Port *</label>
                    <input
                      type="text"
                      value={formData.port}
                      onChange={(e) => handleInputChange('port', e.target.value)}
                      placeholder="Ex: RJ45-1"
                      required
                    />
                  </div>
                  <div className="form-item">
                    <label>Salle *</label>
                    <select
                      value={formData.refSalle}
                      onChange={(e) => handleInputChange('refSalle', e.target.value)}
                      required
                      aria-label="Sélectionner une salle pour la position"
                    >
                      <option value="">Sélectionner une salle</option>
                      {salles.map(salle => (
                        <option key={salle.refSalle} value={salle.refSalle}>
                          {salle.nomSalle} ({salle.refSalle})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-item">
                    <label>Occupation</label>
                    <select
                      value={formData.occupation}
                      onChange={(e) => handleInputChange('occupation', e.target.value)}
                      aria-label="Sélectionner le statut d'occupation"
                    >
                      <option value="Libre">Libre</option>
                      <option value="Occupée">Occupée</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Addition Mode */}
            {isBulkMode && (
              <>
                <div className="form-section">
                  <h3>Ajouter une Position</h3>
                  <div className="form-grid">
                    <div className="form-item">
                      <label>Référence Position *</label>
                      <input
                        type="text"
                        value={formData.refPosition}
                        onChange={(e) => handleInputChange('refPosition', e.target.value)}
                        placeholder="Ex: POS001"
                      />
                    </div>
                    <div className="form-item">
                      <label>Désignation Position *</label>
                      <input
                        type="text"
                        value={formData.designPosition}
                        onChange={(e) => handleInputChange('designPosition', e.target.value)}
                        placeholder="Ex: Position Bureau 1"
                      />
                    </div>
                    <div className="form-item">
                      <label>Port *</label>
                      <input
                        type="text"
                        value={formData.port}
                        onChange={(e) => handleInputChange('port', e.target.value)}
                        placeholder="Ex: RJ45-1"
                      />
                    </div>
                    <div className="form-item">
                      <label>Salle *</label>
                      <select
                        value={formData.refSalle}
                        onChange={(e) => handleInputChange('refSalle', e.target.value)}
                        title='room-selector'
                      >
                        <option value="">Sélectionner une salle</option>
                        {salles.map(salle => (
                          <option key={salle.refSalle} value={salle.refSalle}>
                            {salle.nomSalle} ({salle.refSalle})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="add-bulk-btn"
                    onClick={addBulkPosition}
                    disabled={!isFormValid}
                  >
                    <Plus size={16} />
                    Ajouter à la liste
                  </button>
                </div>

                {/* Bulk Positions List */}
                {bulkPositions.length > 0 && (
                  <div className="bulk-add-section">
                    <h4>Positions à ajouter ({bulkPositions.length})</h4>
                    <div className="bulk-positions">
                      {bulkPositions.map((position, index) => (
                        <div key={index} className="bulk-position-item">
                          <div className="bulk-position-info">
                            <span>{position.refPosition} - {position.designPosition}</span>
                            <span>{position.port} - {salles.find(s => s.refSalle === position.refSalle)?.nomSalle}</span>
                          </div>
                          <button
                            type="button"
                            className="btn-icon delete"
                            onClick={() => removeBulkPosition(index)}
                            aria-label="Retirer cette position"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-button" onClick={onClose}>
              Annuler
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isBulkMode ? bulkPositions.length === 0 : !isFormValid}
            >
              {isBulkMode ? `Ajouter ${bulkPositions.length} position${bulkPositions.length > 1 ? 's' : ''}` : 'Ajouter la position'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ConsulterPositionModal: React.FC<{
  position: Position;
  onClose: () => void;
  onEdit?: (position: Position) => void;
  onDelete?: (refPosition: string) => void;
  onAssignMateriel?: (refMateriel: string, refPosition: string) => void;
  onRemoveMateriel?: (refMateriel: string) => void;
}> = ({ position, onClose, onEdit, onDelete, onRemoveMateriel }) => {
  const { theme } = useTheme();
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const [affectationsData, materielsData] = await Promise.all([
          getAffectationsBySalle(position.refSalle),
          getAllMateriels()
        ]);

        // Filter affectations for this position
        const positionAffectations = affectationsData.filter(
          (aff) => aff.refPosition === position.refPosition && aff.refAffectation != null
        );
        setAffectations(positionAffectations);

        // Create a Set of affectation IDs (ensure they are numbers)
        const affIds = new Set(positionAffectations.map(aff => Number(aff.refAffectation)));

        // Filter materiels assigned to this position safely
        const positionMateriels = materielsData.filter(
          (mat) => mat.refAffectation != null && affIds.has(Number(mat.refAffectation))
        );

        setMateriels(positionMateriels);

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [position.refPosition, position.refSalle]);


  const handleRemoveMateriel = (refMateriel: string) => {
    if (onRemoveMateriel) {
      onRemoveMateriel(refMateriel);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content consulter-position-modal ${theme}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Détails de la Position - {position.refPosition}</h2>
          <button className="close-button" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Position Details */}
          <div className="detail-section">
            <h3>Informations de la Position</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Référence Position</label>
                <span>{position.refPosition}</span>
              </div>
              <div className="detail-item">
                <label>Désignation Position</label>
                <span>{position.designPosition}</span>
              </div>
              <div className="detail-item">
                <label>Port</label>
                <span>{position.port}</span>
              </div>
              <div className="detail-item">
                <label>Salle</label>
                <span>{position.nomSalle || position.refSalle}</span>
              </div>
              <div className="detail-item">
                <label>Occupation</label>
                <span className={`status-badge ${position.occupation}`}>
                  {position.occupation}
                </span>
              </div>
            </div>
          </div>

          {/* Affectations */}
          <div className="detail-section">
            <h3>
              <User size={18} style={{ marginRight: '0.5rem' }} />
              Affectations ({affectations.length})
            </h3>
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Chargement des affectations...</p>
              </div>
            ) : affectations.length > 0 ? (
              <div className="affectations-list">
                {affectations.map((aff) => (
                  <div key={aff.refAffectation} className="affectation-item">
                    <div className="affectation-info">
                      <span className="matricule">{aff.matricule}</span>
                      <span className="dates">
                        {new Date(aff.dateDebut).toLocaleDateString()} - {aff.dateFin ? new Date(aff.dateFin).toLocaleDateString() : 'En cours'}
                      </span>
                      <span className={`status-badge ${aff.status}`}>
                        {aff.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">Aucune affectation trouvée pour cette position.</p>
            )}
          </div>

          {/* Assigned Materiels */}
          <div className="detail-section">
            <h3>
              <Package size={18} style={{ marginRight: '0.5rem' }} />
              Matériels Assignés ({materiels.length})
            </h3>
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Chargement des matériels...</p>
              </div>
            ) : materiels.length > 0 ? (
              <div className="materiels-list">
                {materiels.map((mat) => (
                  <div key={mat.numSerie} className="materiel-item">
                    <div className="materiel-info">
                      <span className="ref-materiel">{mat.numSerie}</span>
                      <span className="design-materiel">{mat.marque} {mat.modele}</span>
                      <span className="categorie">{mat.categorie}</span>
                      <span className={`status-badge ${mat.status}`}>
                        {mat.status}
                      </span>
                    </div>
                    {onRemoveMateriel && (
                      <button
                        className="btn-icon delete"
                        onClick={() => handleRemoveMateriel(mat.numSerie)}
                        aria-label="Retirer ce matériel"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">Aucun matériel assigné à cette position.</p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          {onDelete && (
            <button
              type="button"
              className="delete-button"
              onClick={() => onDelete(position.refPosition)}
            >
              <Trash2 size={16} />
              Supprimer
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              className="edit-button"
              onClick={() => onEdit(position)}
            >
              <Edit size={16} />
              Modifier
            </button>
          )}
          <button type="button" className="cancel-button" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

const ModifierPositionModal: React.FC<{
  position: Position;
  salles: Salle[];
  onClose: () => void;
  onSubmit: (position: Omit<Position, 'nomSalle'>) => void;
}> = ({ position, salles, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    refPosition: position.refPosition,
    designPosition: position.designPosition,
    port: position.port,
    occupation: position.occupation,
    refSalle: position.refSalle
  });

  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.refPosition || !formData.designPosition || !formData.port || !formData.refSalle) {
      return;
    }

    setSubmitting(true);

    try {
      // Remove empty string fields
      const cleanedData = Object.fromEntries(
        Object.entries(formData).filter(([, value]) => value !== '')
      ) as Omit<Position, 'nomSalle'>;

      onSubmit(cleanedData);
      onClose();
    } catch (error) {
      console.error('Error submitting position modification:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = formData.refPosition && formData.designPosition && formData.port && formData.refSalle;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Modifier la Position - {position.refPosition}</h2>
          <button className="close-button" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-section">
              <div className="form-grid">
                <div className="form-item">
                  <label htmlFor="refPosition">Référence Position *</label>
                  <input
                    id="refPosition"
                    type="text"
                    value={formData.refPosition}
                    onChange={(e) => handleInputChange('refPosition', e.target.value)}
                    placeholder="Ex: POS001"
                    required
                    aria-describedby="refPosition-error"
                  />
                </div>
                <div className="form-item">
                  <label htmlFor="designPosition">Désignation Position *</label>
                  <input
                    id="designPosition"
                    type="text"
                    value={formData.designPosition}
                    onChange={(e) => handleInputChange('designPosition', e.target.value)}
                    placeholder="Ex: Position Bureau 1"
                    required
                    aria-describedby="designPosition-error"
                  />
                </div>
                <div className="form-item">
                  <label htmlFor="port">Port *</label>
                  <input
                    id="port"
                    type="text"
                    value={formData.port}
                    onChange={(e) => handleInputChange('port', e.target.value)}
                    placeholder="Ex: RJ45-1"
                    required
                    aria-describedby="port-error"
                  />
                </div>
                <div className="form-item">
                  <label htmlFor="refSalle">Salle *</label>
                  <select
                    id="refSalle"
                    value={formData.refSalle}
                    onChange={(e) => handleInputChange('refSalle', e.target.value)}
                    required
                    aria-label="Sélectionner une salle pour la position"
                    aria-describedby="refSalle-error"
                  >
                    <option value="">Sélectionner une salle</option>
                    {salles.map(salle => (
                      <option key={salle.refSalle} value={salle.refSalle}>
                        {salle.nomSalle} ({salle.refSalle})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-item">
                  <label htmlFor="occupation">Occupation</label>
                  <select
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                    aria-label="Sélectionner le statut d'occupation"
                  >
                    <option value="Libre">Libre</option>
                    <option value="Occupée">Occupée</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-button" onClick={onClose}>
              Annuler
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={!isFormValid || submitting}
            >
              {submitting ? 'Modification en cours...' : 'Modifier la position'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Positions: React.FC = () => {
  const { theme } = useTheme();
  const [positions, setPositions] = useState<Position[]>([]);
  const [salles, setSalles] = useState<Salle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [occupationFilter, setOccupationFilter] = useState('');
  const [salleFilter, setSalleFilter] = useState('');
  const [sortField, setSortField] = useState<keyof Position>('refPosition');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [positionsData, sallesData] = await Promise.all([
          getAllPositions(),
          getAllSalles()
        ]);

        // Enrich positions with salle names
        const enrichedPositions = positionsData.map((position: Position) => ({
          ...position,
          nomSalle: sallesData.find((salle: Salle) => salle.refSalle === position.refSalle)?.nomSalle
        }));

        setPositions(enrichedPositions);
        setSalles(sallesData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters and search
  const filteredPositions = useMemo(() => {
    return positions.filter(position => {
      const matchesSearch = searchTerm === '' ||
        position.refPosition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.designPosition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.port.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesOccupation = occupationFilter === '' || position.occupation === occupationFilter;
      const matchesSalle = salleFilter === '' || position.refSalle === salleFilter;

      return matchesSearch && matchesOccupation && matchesSalle;
    });
  }, [positions, searchTerm, occupationFilter, salleFilter]);

  // Sort positions
  const sortedPositions = useMemo(() => {
    return [...filteredPositions].sort((a, b) => {
      const aValue = String(a[sortField] || '');
      const bValue = String(b[sortField] || '');

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredPositions, sortField, sortDirection]);

  // Paginate positions
  const paginatedPositions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedPositions.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedPositions, currentPage]);

  const totalPages = Math.ceil(sortedPositions.length / itemsPerPage);

  const handleSort = (field: keyof Position) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleAddPosition = async (positionData: Omit<Position, 'nomSalle'>) => {
    try {
      await createPosition(positionData);
      // Refresh data
      const [positionsData, sallesData] = await Promise.all([
        getAllPositions(),
        getAllSalles()
      ]);
      const enrichedPositions = positionsData.map((position: Position) => ({
        ...position,
        nomSalle: sallesData.find((salle: Salle) => salle.refSalle === position.refSalle)?.nomSalle
      }));
      setPositions(enrichedPositions);
      setShowAddModal(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la position:', error);
    }
  };

  const handleConsultPosition = (position: Position) => {
    setSelectedPosition(position);
    setShowConsultModal(true);
  };

  const handleEditPosition = (position: Position) => {
    setSelectedPosition(position);
    setShowEditModal(true);
  };

  const handleDeletePosition = async (refPosition: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette position ?')) {
      try {
        await deletePosition(refPosition);
        setPositions(prev => prev.filter(p => p.refPosition !== refPosition));
        setShowConsultModal(false);
      } catch (error) {
        console.error('Erreur lors de la suppression de la position:', error);
      }
    }
  };

  const handleAssignMateriel = (refMateriel: string, refPosition: string) => {
    // TODO: Implement materiel assignment logic
    console.log('Assign materiel', refMateriel, 'to position', refPosition);
  };

  const handleRemoveMateriel = (refMateriel: string) => {
    // TODO: Implement materiel removal logic
    console.log('Remove materiel', refMateriel);
  };

  const handleUpdatePosition = async (positionData: Omit<Position, 'nomSalle'>) => {
    try {
      await updatePosition(selectedPosition!.refPosition, positionData);
      // Refresh data
      const [positionsData, sallesData] = await Promise.all([
        getAllPositions(),
        getAllSalles()
      ]);
      const enrichedPositions = positionsData.map((position: Position) => ({
        ...position,
        nomSalle: sallesData.find((salle: Salle) => salle.refSalle === position.refSalle)?.nomSalle
      }));
      setPositions(enrichedPositions);
      setShowEditModal(false);
      setSelectedPosition(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la position:', error);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  if (loading) {
    return (
      <div className="positions-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des positions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`positions-page ${theme}`}>
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <button className="back-button" onClick={handleBack} aria-label="Retour">
            <BackIcon size={20} />
          </button>
          <h1>Positions</h1>
        </div>
      </div>

      {/* Info Cards */}
      <div className="info-cards">
        <div className="info-card">
          <h3>Total Positions</h3>
          <p>{positions.length}</p>
        </div>
        <div className="info-card">
          <h3>Positions Libres</h3>
          <p>{positions.filter(p => p.occupation === 'Libre').length}</p>
        </div>
        <div className="info-card">
          <h3>Positions Occupées</h3>
          <p>{positions.filter(p => p.occupation === 'Occupée').length}</p>
        </div>
        <div className="info-card">
          <h3>Salles</h3>
          <p>{salles.length}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Rechercher par référence, désignation ou port..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters">
          <select value={occupationFilter} onChange={(e) => setOccupationFilter(e.target.value)} aria-label="Filtrer par statut d'occupation">
            <option value="">Tous les statuts</option>
            <option value="Libre">Libre</option>
            <option value="Occupée">Occupée</option>
          </select>
          <select value={salleFilter} onChange={(e) => setSalleFilter(e.target.value)} aria-label="Filtrer par salle">
            <option value="">Toutes les salles</option>
            {salles.map(salle => (
              <option key={salle.refSalle} value={salle.refSalle}>
                {salle.nomSalle}
              </option>
            ))}
          </select>
          <button className="btn-primary add-btn" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Ajouter Position
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="positions-table">
          <thead>
            <tr>
              <th className={sortField === 'refPosition' ? 'sorted' : ''} onClick={() => handleSort('refPosition')}>
                Référence Position
              </th>
              <th className={sortField === 'designPosition' ? 'sorted' : ''} onClick={() => handleSort('designPosition')}>
                Désignation
              </th>
              <th className={sortField === 'port' ? 'sorted' : ''} onClick={() => handleSort('port')}>
                Port
              </th>
              <th className={sortField === 'refSalle' ? 'sorted' : ''} onClick={() => handleSort('refSalle')}>
                Salle
              </th>
              <th className={sortField === 'occupation' ? 'sorted' : ''} onClick={() => handleSort('occupation')}>
                Occupation
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPositions.map((position) => (
              <tr key={position.refPosition}>
                <td>{position.refPosition}</td>
                <td>{position.designPosition}</td>
                <td>{position.port}</td>
                <td>{position.nomSalle || position.refSalle}</td>
                <td>
                  <span className={`status-badge ${position.occupation}`}>
                    {position.occupation}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-icon"
                      onClick={() => handleConsultPosition(position)}
                      aria-label="Consulter les détails"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="btn-icon edit"
                      onClick={() => handleEditPosition(position)}
                      aria-label="Modifier la position"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn-icon delete"
                      onClick={() => handleDeletePosition(position.refPosition)}
                      aria-label="Supprimer la position"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            title='pagination'
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
              onClick={() => goToPage(page)}
            >
              {page}
            </button>
          ))}
          <button
            className="pagination-btn"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            title='pagination'
          >
            <ChevronRight size={16} />
          </button>
          <span>
            Page {currentPage} sur {totalPages} ({sortedPositions.length} éléments)
          </span>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <ModalAjouterPosition
          salles={salles}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddPosition}
        />
      )}

      {showConsultModal && selectedPosition && (
        <ConsulterPositionModal
          position={selectedPosition}
          onClose={() => setShowConsultModal(false)}
          onEdit={handleEditPosition}
          onDelete={handleDeletePosition}
          onAssignMateriel={handleAssignMateriel}
          onRemoveMateriel={handleRemoveMateriel}
        />
      )}

      {showEditModal && selectedPosition && (
        <ModifierPositionModal
          position={selectedPosition}
          salles={salles}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdatePosition}
        />
      )}
    </div>
  );
};

export default Positions;
