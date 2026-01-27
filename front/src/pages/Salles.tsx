import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Info,
  X,
  Grid3X3,
  Activity
} from 'lucide-react';

import '../styles/Salles.css';
import '../styles/page.css';
import '../styles/tableau.css';
import '../styles/modal.css';

import {
  getAllSalles,
  createSalle,
  updateSalle,
  deleteSalle
} from '../api/salle-api';
import { getAllPositions } from '../api/position-api';
import { getAffectationsBySalle, type Affectation } from '../api/affectation-api';
import { getInventairesBySalle } from '../api/inventaire-api';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';
import PageHeader from '../components/PageHeader';

// Define Inventaire interface locally since it's not exported
interface Inventaire {
  refInventaire: number;
  date: string;
  debut?: string;
  fin?: string;
  observation?: string;
  refSalle: string;
  matricule: string;
  salle?: {
    nomSalle: string;
    etage: string;
    site: string;
  };
  personne?: {
    nom: string;
    prenom: string;
  };
}

// Fully typed interfaces matching backend
interface Salle {
  refSalle: string;
  nomSalle: string;
  etage: string;
  site: string;
  nombrePositions: number; // Made non-optional with proper handling
  nombreOperations: number; // Made non-optional with proper handling
}

interface Position {
  refPosition: string;
  designPosition: string;
  port: string;
  occupation: string;
  refSalle: string;
}

interface Operation {
  type: 'affectation' | 'inventaire';
  ref: string;
  description: string;
  status: string;
}

// Unified loading and error states
interface LoadingState {
  salles: boolean;
  positions: boolean;
  operations: boolean;
  action: boolean;
}

interface ErrorState {
  salles: string | null;
  positions: string | null;
  operations: string | null;
  action: string | null;
}

// Form data types
interface SalleFormData {
  refSalle: string;
  nomSalle: string;
  etage: string;
  site: string;
}

const Salles: React.FC = () => {
  const { theme } = useTheme();
  const toast = useToast();

  // State management with proper typing
  const [salles, setSalles] = useState<Salle[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [operationsBySalle, setOperationsBySalle] = useState<Record<string, Operation[]>>({});

  // Loading and error states
  const [loading, setLoading] = useState<LoadingState>({
    salles: true,
    positions: true,
    operations: true,
    action: false
  });

  const [errors, setErrors] = useState<ErrorState>({
    salles: null,
    positions: null,
    operations: null,
    action: null
  });

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [etageFilter, setEtageFilter] = useState('');
  const [sortField, setSortField] = useState<keyof Salle>('refSalle');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSalle, setSelectedSalle] = useState<Salle | null>(null);

  // Abort controller for canceling async operations on unmount
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    abortControllerRef.current = new AbortController();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Fetch all data with proper error handling and cancellation
  const fetchAllData = useCallback(async () => {
    if (!abortControllerRef.current) return;

    try {
      setLoading(prev => ({ ...prev, salles: true, positions: true, operations: true }));
      setErrors(prev => ({ ...prev, salles: null, positions: null, operations: null }));

      // Fetch salles and positions in parallel
      const [sallesData, positionsData] = await Promise.all([
        getAllSalles(),
        getAllPositions()
      ]);

      if (abortControllerRef.current.signal.aborted) return;

      // Enrich salles with position counts
      const enrichedSalles: Salle[] = sallesData.map((salle) => ({
        ...salle,
        nombrePositions: positionsData.filter((pos: Position) => pos.refSalle === salle.refSalle).length,
        nombreOperations: 0 // Will be updated after operations fetch
      }));

      setSalles(enrichedSalles);
      setPositions(positionsData);
      setLoading(prev => ({ ...prev, salles: false, positions: false }));

      // Fetch operations for each salle
      const operationsMap: Record<string, Operation[]> = {};

      // Process operations in batches to avoid overwhelming the API
      for (const salle of enrichedSalles) {
        if (abortControllerRef.current.signal.aborted) return;

        try {
          const [affectations, inventaires] = await Promise.all([
            getAffectationsBySalle(salle.refSalle),
            getInventairesBySalle(salle.refSalle)
          ]);

          if (abortControllerRef.current.signal.aborted) return;

          // Fully typed operation mapping
          const operations: Operation[] = [
            ...affectations.map((aff: Affectation) => ({
              type: 'affectation' as const,
              ref: aff.refAffectation.toString(),
              description: `Affectation ${aff.matricule || 'N/A'} - ${aff.refPosition || 'N/A'}`,
              status: 'Active' // Default status for affectations
            })),
            ...inventaires.map((inv: Inventaire) => ({
              type: 'inventaire' as const,
              ref: inv.refInventaire.toString(),
              description: `Inventaire ${inv.refInventaire}`,
              status: 'En cours'
            }))
          ];

          operationsMap[salle.refSalle] = operations;
        } catch (error) {
          console.error(`Error fetching operations for salle ${salle.refSalle}:`, error);
          operationsMap[salle.refSalle] = [];
        }
      }

      if (abortControllerRef.current.signal.aborted) return;

      // Merge operations counts with salles data efficiently
      const sallesWithOperations: Salle[] = enrichedSalles.map(salle => ({
        ...salle,
        nombreOperations: operationsMap[salle.refSalle]?.length || 0
      }));

      setOperationsBySalle(operationsMap);
      setSalles(sallesWithOperations);
      setLoading(prev => ({ ...prev, operations: false }));

    } catch (error) {
      if (abortControllerRef.current.signal.aborted) return;

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error fetching data:', error);

      setErrors(prev => ({
        ...prev,
        salles: 'Erreur lors du chargement des salles',
        positions: 'Erreur lors du chargement des positions',
        operations: 'Erreur lors du chargement des opérations'
      }));

      setLoading(prev => ({ ...prev, salles: false, positions: false, operations: false }));

      toast.showError('Erreur', `Erreur de chargement: ${errorMessage}`);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Filtered and sorted salles by site
  const sallesBySite = useMemo(() => {
    const grouped: Record<string, Salle[]> = {};

    salles.forEach(salle => {
      if (!grouped[salle.site]) {
        grouped[salle.site] = [];
      }
      grouped[salle.site].push(salle);
    });

    // Apply filters and sorting within each site
    Object.keys(grouped).forEach(site => {
      let siteSalles = grouped[site];

      // Apply search filter
      if (searchTerm) {
        siteSalles = siteSalles.filter(salle =>
          salle.refSalle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          salle.nomSalle.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply etage filter
      if (etageFilter) {
        siteSalles = siteSalles.filter(salle => salle.etage === etageFilter);
      }

      // Apply sorting
      siteSalles.sort((a, b) => {
        const aValue = a[sortField] || '';
        const bValue = b[sortField] || '';

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });

      grouped[site] = siteSalles;
    });

    return grouped;
  }, [salles, searchTerm, etageFilter, sortField, sortDirection]);

  // Handle sorting
  const handleSort = useCallback((field: keyof Salle) => {
    setSortField(currentField => {
      if (currentField === field) {
        setSortDirection(currentDirection => currentDirection === 'asc' ? 'desc' : 'asc');
        return field;
      } else {
        setSortDirection('asc');
        return field;
      }
    });
  }, []);

  // CRUD operations with proper error handling
  const handleAddSalle = useCallback(async (salleData: SalleFormData) => {
    setLoading(prev => ({ ...prev, action: true }));
    setErrors(prev => ({ ...prev, action: null }));

    try {
      await createSalle(salleData);
      await fetchAllData(); // Refresh all data efficiently

      setShowAddModal(false);
      toast.showSuccess('Succès', 'Salle ajoutée avec succès');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'ajout';
      setErrors(prev => ({ ...prev, action: errorMessage }));
      toast.showError('Erreur', errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  }, [fetchAllData, toast]);

  const handleEditSalle = useCallback(async (salleData: SalleFormData) => {
    if (!selectedSalle) return;

    setLoading(prev => ({ ...prev, action: true }));
    setErrors(prev => ({ ...prev, action: null }));

    try {
      await updateSalle(selectedSalle.refSalle, salleData);
      await fetchAllData(); // Refresh all data efficiently

      setShowEditModal(false);
      setSelectedSalle(null);
      toast.showSuccess('Succès', 'Salle modifiée avec succès');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la modification';
      setErrors(prev => ({ ...prev, action: errorMessage }));
      toast.showError('Erreur', errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  }, [selectedSalle, fetchAllData, toast]);

  const handleDeleteSalle = useCallback(async () => {
    if (!selectedSalle) return;

    setLoading(prev => ({ ...prev, action: true }));
    setErrors(prev => ({ ...prev, action: null }));

    try {
      await deleteSalle(selectedSalle.refSalle);

      // Optimistic update
      setSalles(prev => prev.filter(s => s.refSalle !== selectedSalle.refSalle));
      setOperationsBySalle(prev => {
        const updated = { ...prev };
        delete updated[selectedSalle.refSalle];
        return updated;
      });

      setShowDeleteModal(false);
      setSelectedSalle(null);
      toast.showSuccess('Succès', 'Salle supprimée avec succès');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression';
      setErrors(prev => ({ ...prev, action: errorMessage }));
      toast.showError('Erreur', errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  }, [selectedSalle, toast]);

  // Modal handlers
  const openAddModal = useCallback(() => setShowAddModal(true), []);
  const openEditModal = useCallback((salle: Salle) => {
    setSelectedSalle(salle);
    setShowEditModal(true);
  }, []);
  const openConsultModal = useCallback((salle: Salle) => {
    setSelectedSalle(salle);
    setShowConsultModal(true);
  }, []);
  const openDeleteModal = useCallback((refSalle: string) => {
    const salle = salles.find(s => s.refSalle === refSalle);
    if (salle) {
      setSelectedSalle(salle);
      setShowDeleteModal(true);
    }
  }, [salles]);

  const closeModals = useCallback(() => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowConsultModal(false);
    setShowDeleteModal(false);
    setSelectedSalle(null);
  }, []);

  const handleBack = () => {
    // In real app, navigate back or to dashboard
    window.history.back();
  };

  // Loading state
  if (loading.salles || loading.positions) {
    return (
      <div className="salles-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des salles...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (errors.salles || errors.positions) {
    return (
      <div className="salles-page">
        <div className="error-container">
          <p>Erreur de chargement: {errors.salles || errors.positions}</p>
          <button onClick={fetchAllData} className="btn-primary">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`salles-container ${theme}`}>
      {/* Header */}
      <PageHeader title="Salles" onBack={handleBack} />

      {/* Search and Filters */}
      <section className="search-filters-section">
        <div className="search-filters">
          <div className="search-group">
            <div className="search-input-container">
              <Search size={16} />
              <input
                type="text"
                placeholder="Rechercher par référence ou nom de salle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="filters">
            <select value={etageFilter} onChange={(e) => setEtageFilter(e.target.value)} aria-label="Filtrer par étage">
              <option value="">Tous les étages</option>
              <option value="RDC">RDC</option>
              <option value="1er">1er</option>
              <option value="2ème">2ème</option>
              <option value="3ème">3ème</option>
            </select>

            <button className="add-button" onClick={openAddModal}>
              <Plus size={16} />
              Ajouter une salle
            </button>
          </div>
        </div>
      </section>

      {/* Tables by Site */}
      <section className="table-section">
        {Object.entries(sallesBySite).map(([site, siteSalles]) => (
          <div key={site} className="site-section">
            <h2 className="site-title">Site: {site}</h2>
            <div className="table-container">
              <table className="salles-table">
                <thead>
                  <tr>
                    <th className={sortField === 'refSalle' ? 'sorted' : ''} onClick={() => handleSort('refSalle')}>
                      Référence Salle
                    </th>
                    <th className={sortField === 'nomSalle' ? 'sorted' : ''} onClick={() => handleSort('nomSalle')}>
                      Nom Salle
                    </th>
                    <th className={sortField === 'nombrePositions' ? 'sorted' : ''} onClick={() => handleSort('nombrePositions')}>
                      Nombre de positions
                    </th>
                    <th className={sortField === 'etage' ? 'sorted' : ''} onClick={() => handleSort('etage')}>
                      Étage
                    </th>
                    <th className={sortField === 'site' ? 'sorted' : ''} onClick={() => handleSort('site')}>
                      Site
                    </th>
                    <th className={sortField === 'nombreOperations' ? 'sorted' : ''} onClick={() => handleSort('nombreOperations')}>
                      Opérations en cours
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {siteSalles.map((salle) => (
                    <tr key={salle.refSalle}>
                      <td>{salle.refSalle}</td>
                      <td>{salle.nomSalle}</td>
                      <td>{salle.nombrePositions}</td>
                      <td>{salle.etage}</td>
                      <td>{salle.site}</td>
                      <td>
                        <div className="operations-cell">
                          <span>{salle.nombreOperations}</span>
                          {salle.nombreOperations > 0 && (
                            <div className="operations-tooltip">
                              <Info size={14} />
                              <div className="tooltip-content">
                                {operationsBySalle[salle.refSalle]?.map((op) => (
                                  <div key={`${op.type}-${op.ref}`} className="operation-item">
                                    {op.description} ({op.status})
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn consulter" onClick={() => openConsultModal(salle)} aria-label="Consulter">
                            <Eye size={14} />
                          </button>
                          <button className="action-btn edit" onClick={() => openEditModal(salle)} aria-label="Modifier">
                            <Edit size={14} />
                          </button>
                          <button className="action-btn delete" onClick={() => openDeleteModal(salle.refSalle)} aria-label="Supprimer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      {/* Modals */}
      {showAddModal && <AddSalleModal onClose={closeModals} onSubmit={handleAddSalle} loading={loading.action} />}
      {showEditModal && selectedSalle && <EditSalleModal salle={selectedSalle} onClose={closeModals} onSubmit={handleEditSalle} loading={loading.action} />}
      {showConsultModal && selectedSalle && (
        <ConsultSalleModal
          salle={selectedSalle}
          positions={positions.filter(pos => pos.refSalle === selectedSalle.refSalle)}
          operations={operationsBySalle[selectedSalle.refSalle] || []}
          onClose={closeModals}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
        />
      )}
      {showDeleteModal && selectedSalle && <DeleteSalleModal salle={selectedSalle} onClose={closeModals} onConfirm={handleDeleteSalle} loading={loading.action} />}
    </div>
  );
};

// Inline Modal Components with proper typing
const AddSalleModal: React.FC<{
  onClose: () => void;
  onSubmit: (salleData: SalleFormData) => void;
  loading: boolean;
}> = ({ onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState<SalleFormData>({
    refSalle: '',
    nomSalle: '',
    etage: '',
    site: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.refSalle.trim()) newErrors.refSalle = 'La référence de la salle est requise';
    if (!formData.nomSalle.trim()) newErrors.nomSalle = 'Le nom de la salle est requis';
    if (!formData.etage) newErrors.etage = 'L\'étage est requis';
    if (!formData.site.trim()) newErrors.site = 'Le site est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await onSubmit(formData);
  }, [validateForm, onSubmit, formData]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Ajouter une salle</h2>
          <button className="close-button" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="refSalle">Référence Salle *</label>
            <input
              type="text"
              id="refSalle"
              name="refSalle"
              value={formData.refSalle}
              onChange={handleChange}
              className={errors.refSalle ? 'error' : ''}
              placeholder="Ex: SAL001"
              disabled={loading}
            />
            {errors.refSalle && <span className="error-message">{errors.refSalle}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="nomSalle">Nom Salle *</label>
            <input
              type="text"
              id="nomSalle"
              name="nomSalle"
              value={formData.nomSalle}
              onChange={handleChange}
              className={errors.nomSalle ? 'error' : ''}
              placeholder="Ex: Salle Informatique"
              disabled={loading}
            />
            {errors.nomSalle && <span className="error-message">{errors.nomSalle}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="etage">Étage *</label>
            <select
              id="etage"
              name="etage"
              value={formData.etage}
              onChange={handleChange}
              className={errors.etage ? 'error' : ''}
              disabled={loading}
            >
              <option value="">Sélectionner un étage</option>
              <option value="RDC">RDC</option>
              <option value="1er">1er étage</option>
              <option value="2ème">2ème étage</option>
              <option value="3ème">3ème étage</option>
            </select>
            {errors.etage && <span className="error-message">{errors.etage}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="site">Site *</label>
            <input
              type="text"
              id="site"
              name="site"
              value={formData.site}
              onChange={handleChange}
              className={errors.site ? 'error' : ''}
              placeholder="Ex: Campus Principal"
              disabled={loading}
            />
            {errors.site && <span className="error-message">{errors.site}</span>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Ajout en cours...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditSalleModal: React.FC<{
  salle: Salle;
  onClose: () => void;
  onSubmit: (salleData: SalleFormData) => void;
  loading: boolean;
}> = ({ salle, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState<SalleFormData>({
    refSalle: salle.refSalle,
    nomSalle: salle.nomSalle,
    etage: salle.etage,
    site: salle.site
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.refSalle.trim()) newErrors.refSalle = 'La référence de la salle est requise';
    if (!formData.nomSalle.trim()) newErrors.nomSalle = 'Le nom de la salle est requis';
    if (!formData.etage) newErrors.etage = 'L\'étage est requis';
    if (!formData.site.trim()) newErrors.site = 'Le site est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await onSubmit(formData);
  }, [validateForm, onSubmit, formData]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Modifier la salle</h2>
          <button className="close-button" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="edit-refSalle">Référence Salle *</label>
            <input
              type="text"
              id="edit-refSalle"
              name="refSalle"
              value={formData.refSalle}
              onChange={handleChange}
              className={errors.refSalle ? 'error' : ''}
              disabled={loading}
            />
            {errors.refSalle && <span className="error-message">{errors.refSalle}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="edit-nomSalle">Nom Salle *</label>
            <input
              type="text"
              id="edit-nomSalle"
              name="nomSalle"
              value={formData.nomSalle}
              onChange={handleChange}
              className={errors.nomSalle ? 'error' : ''}
              disabled={loading}
            />
            {errors.nomSalle && <span className="error-message">{errors.nomSalle}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="edit-etage">Étage *</label>
            <select
              id="edit-etage"
              name="etage"
              value={formData.etage}
              onChange={handleChange}
              className={errors.etage ? 'error' : ''}
              disabled={loading}
            >
              <option value="">Sélectionner un étage</option>
              <option value="RDC">RDC</option>
              <option value="1er">1er étage</option>
              <option value="2ème">2ème étage</option>
              <option value="3ème">3ème étage</option>
            </select>
            {errors.etage && <span className="error-message">{errors.etage}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="edit-site">Site *</label>
            <input
              type="text"
              id="edit-site"
              name="site"
              value={formData.site}
              onChange={handleChange}
              className={errors.site ? 'error' : ''}
              disabled={loading}
            />
            {errors.site && <span className="error-message">{errors.site}</span>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Modification en cours...' : 'Modifier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ConsultSalleModal: React.FC<{
  salle: Salle;
  positions: Position[];
  operations: Operation[];
  onClose: () => void;
  onEdit: (salle: Salle) => void;
  onDelete: (refSalle: string) => void;
}> = ({ salle, positions, operations, onClose, onEdit, onDelete }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content consulter-salle-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Détails de la Salle - {salle.refSalle}</h2>
          <button className="close-button" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Salle Details */}
          <div className="detail-section">
            <h3>Informations de la Salle</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Référence Salle</label>
                <span>{salle.refSalle}</span>
              </div>
              <div className="detail-item">
                <label>Nom Salle</label>
                <span>{salle.nomSalle}</span>
              </div>
              <div className="detail-item">
                <label>Étage</label>
                <span>{salle.etage}</span>
              </div>
              <div className="detail-item">
                <label>Site</label>
                <span>{salle.site}</span>
              </div>
              <div className="detail-item">
                <label>Nombre de Positions</label>
                <span>{salle.nombrePositions}</span>
              </div>
              <div className="detail-item">
                <label>Opérations en cours</label>
                <span>{salle.nombreOperations}</span>
              </div>
            </div>
          </div>

          {/* Positions in the Salle */}
          <div className="detail-section">
            <h3>
              <Grid3X3 size={18} style={{ marginRight: '0.5rem' }} />
              Positions ({positions.length})
            </h3>
            {positions.length > 0 ? (
              <div className="positions-list">
                {positions.map((position) => (
                  <div key={position.refPosition} className="position-item">
                    <div className="position-info">
                      <span className="ref-position">{position.refPosition}</span>
                      <span className="design-position">{position.designPosition}</span>
                      <span className="port">Port: {position.port}</span>
                      <span className={`status-badge ${position.occupation.toLowerCase()}`}>
                        {position.occupation}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">Aucune position trouvée dans cette salle.</p>
            )}
          </div>

          {/* Operations in the Salle */}
          <div className="detail-section">
            <h3>
              <Activity size={18} style={{ marginRight: '0.5rem' }} />
              Opérations en cours ({operations.length})
            </h3>
            {operations.length > 0 ? (
              <div className="operations-list">
                {operations.map((operation) => (
                  <div key={`${operation.type}-${operation.ref}`} className="operation-item">
                    <div className="operation-info">
                      <span className="operation-type">
                        {operation.type === 'affectation' ? 'Affectation' : 'Inventaire'}
                      </span>
                      <span className="operation-description">{operation.description}</span>
                      <span className={`status-badge ${operation.status.toLowerCase().replace(' ', '-')}`}>
                        {operation.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">Aucune opération en cours dans cette salle.</p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="delete-button"
            onClick={() => onDelete(salle.refSalle)}
          >
            <Trash2 size={16} />
            Supprimer
          </button>
          <button
            type="button"
            className="edit-button"
            onClick={() => onEdit(salle)}
          >
            <Edit size={16} />
            Modifier
          </button>
          <button type="button" className="cancel-button" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteSalleModal: React.FC<{
  salle: Salle;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}> = ({ salle, onClose, onConfirm, loading }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Confirmer la suppression</h2>
          <button className="close-button" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="delete-confirmation">
            <Trash2 size={48} className="delete-icon" />
            <p>Êtes-vous sûr de vouloir supprimer la salle <strong>{salle.refSalle} - {salle.nomSalle}</strong> ?</p>
            <p className="warning-text">Cette action est irréversible.</p>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Annuler
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Suppression en cours...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Salles;
