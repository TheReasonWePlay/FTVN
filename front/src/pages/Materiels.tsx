import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Barcode from 'react-barcode';
import { useReactToPrint } from 'react-to-print';
import {
  Search,
  Plus,
  Edit,
  Link2,
  Link2Off,
  Trash2,
  Eye,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Minus
} from 'lucide-react';

import '../styles/Materiels.css';
import '../styles/page.css';
import '../styles/tableau.css';
import '../styles/modal.css';

import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';
import type { Materiel } from '../types';
import PageHeader from '../components/PageHeader';

import {
  getAllMateriels,
  getTotalMateriels,
  getMaterielsCountByStatut,
  createMateriel,
  updateMateriel,
  deleteMateriel
} from '../api/materiel-api';
import { closeAffectation, createAffectation } from '../api/affectation-api';
import { getAllPositions } from '../api/position-api';
import { getAllPersonnes } from '../api/personne-api';

interface MaterielsData {
  totalMateriels: number;
  materielsByStatus: { [key: string]: number };
  materielsByCategory: { [key: string]: number };
  materiels: Materiel[];
}

const Materiels: React.FC = () => {
  const [materielsData, setMaterielsData] = useState<MaterielsData>({
    totalMateriels: 0,
    materielsByStatus: {},
    materielsByCategory: {},
    materiels: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filters, setFilters] = useState({
    marque: '',
    modele: '',
    categorie: '',
    status: ''
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof Materiel; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAffectationModal, setShowAffectationModal] = useState(false);
  const [selectedMateriel, setSelectedMateriel] = useState<Materiel | null>(null);
  const { showSuccess, showError: showToastError } = useToast();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleBack = () => {
    // In real app, navigate back or to dashboard
    window.history.back();
  };

  const fetchMaterielsData = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const [materielsList, totalCount, statusCounts] = await Promise.all([
        getAllMateriels(),
        getTotalMateriels(),
        getMaterielsCountByStatut(),
      ]);

      if (!mountedRef.current) return;

      const materiels = materielsList ?? [];

      const materielsByCategory = materiels.reduce<Record<string, number>>(
        (acc, mat) => {
          const categorie = mat?.categorie?.trim() || "Non catégorisé";
          acc[categorie] = (acc[categorie] || 0) + 1;
          return acc;
        },
        {}
      );

      setMaterielsData({
        totalMateriels: totalCount ?? 0,
        materielsByStatus: statusCounts ?? {},
        materielsByCategory,
        materiels,
      });
    } catch (err: unknown) {
      if (!mountedRef.current) return;

      console.error("Error fetching materiels:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Une erreur s'est produite lors du chargement des données.";

      setError(message);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchMaterielsData();
  }, [fetchMaterielsData]);

  const filteredMateriels = useMemo(() => {
    let filtered = materielsData.materiels?.filter(materiel => {
      const matchesSearch = materiel?.numSerie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        materiel?.dateAjout?.includes(searchTerm);
      const matchesDateRange = (!dateFrom || (materiel?.dateAjout && materiel.dateAjout >= dateFrom)) &&
        (!dateTo || (materiel?.dateAjout && materiel.dateAjout <= dateTo));
      const matchesFilters = (!filters.marque || materiel?.marque?.toLowerCase().includes(filters.marque.toLowerCase())) &&
        (!filters.modele || materiel?.modele?.toLowerCase().includes(filters.modele.toLowerCase())) &&
        (!filters.categorie || materiel?.categorie?.toLowerCase().includes(filters.categorie.toLowerCase())) &&
        (!filters.status || materiel?.status?.toLowerCase().includes(filters.status.toLowerCase()));

      return matchesSearch && matchesDateRange && matchesFilters;
    }) || [];

    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a?.[sortConfig.key] ?? '';
        const bValue = b?.[sortConfig.key] ?? '';
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [searchTerm, dateFrom, dateTo, filters, sortConfig, materielsData.materiels]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredMateriels.length]);

  const handleSort = (key: keyof Materiel) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleAddMateriel = useCallback(
    async (newMateriel: Materiel): Promise<void> => {
      if (!mountedRef.current) return;

      try {
        await createMateriel(newMateriel);

        if (!mountedRef.current) return;

        showSuccess(
          "Matériel ajouté avec succès",
          `Le matériel ${newMateriel?.numSerie ?? ""} a été ajouté.`
        );

        await fetchMaterielsData();

        if (mountedRef.current) {
          setShowAddModal(false);
        }
      } catch (err: unknown) {
        if (!mountedRef.current) return;

        console.error("Error adding materiel:", err);

        const message =
          err instanceof Error
            ? err.message
            : "Une erreur s'est produite lors de l'ajout du matériel.";

        showToastError("Erreur lors de l'ajout", message);
        // Le modal reste ouvert volontairement
      }
    },
    [fetchMaterielsData, showSuccess, showToastError]
  );

  const handleConsultMateriel = (materiel: Materiel) => {
    setSelectedMateriel(materiel);
    setShowConsultModal(true);
  };

  const handleEditMateriel = (materiel: Materiel) => {
    setSelectedMateriel(materiel);
    setShowEditModal(true);
  };

  const handleUpdateMateriel = useCallback(
    async (
      numSerie: string,
      updatedMateriel: Partial<Materiel>
    ): Promise<void> => {
      if (!mountedRef.current) return;

      try {
        await updateMateriel(numSerie, updatedMateriel);

        if (!mountedRef.current) return;

        showSuccess(
          "Matériel modifié avec succès",
          `Le matériel ${numSerie} a été modifié.`
        );

        await fetchMaterielsData();

        if (mountedRef.current) {
          setShowEditModal(false);
          setSelectedMateriel(null);
        }
      } catch (err: unknown) {
        if (!mountedRef.current) return;

        console.error("Error updating materiel:", err);

        const message =
          err instanceof Error
            ? err.message
            : "Une erreur s'est produite lors de la modification du matériel.";

        showToastError("Erreur lors de la modification", message);
        // Le modal reste ouvert volontairement
      }
    },
    [fetchMaterielsData, showSuccess, showToastError]
  );

  const handleAffectMateriel = (materiel: Materiel) => {
    setSelectedMateriel(materiel);
    setShowAffectationModal(true);
  };

  const handleCloseAffectation = useCallback(
    async (refAffectation: number) => {
      if (!mountedRef.current) return;

      try {
        await closeAffectation(refAffectation);

        if (!mountedRef.current) return;

        showSuccess(
          "Affectation clôturée avec succès",
          `L'affectation ${refAffectation} a été clôturée.`
        );

        await fetchMaterielsData();
      } catch (err: unknown) {
        if (!mountedRef.current) return;

        console.error("Error closing affectation:", err);

        const message =
          err instanceof Error
            ? err.message
            : "Une erreur s'est produite lors de la clôture de l'affectation.";

        showToastError("Erreur lors de la clôture", message);
      }
    },
    [fetchMaterielsData, showSuccess, showToastError]
  );

  const handleDeleteMateriel = useCallback(
    async (numSerie: string): Promise<void> => {
      if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce matériel ?")) {
        return;
      }

      if (!mountedRef.current) return;

      try {
        await deleteMateriel(numSerie);

        if (!mountedRef.current) return;

        showSuccess(
          "Matériel supprimé avec succès",
          `Le matériel ${numSerie} a été supprimé.`
        );

        await fetchMaterielsData();
      } catch (err: unknown) {
        if (!mountedRef.current) return;

        console.error("Error deleting materiel:", err);

        const message =
          err instanceof Error
            ? err.message
            : "Une erreur s'est produite lors de la suppression du matériel.";

        showToastError("Erreur lors de la suppression", message);
      }
    },
    [fetchMaterielsData, showSuccess, showToastError]
  );

  const getStatusClass = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'disponible': return 'status-disponible';
      case 'affecté': return 'status-affecté';
      case 'en panne': return 'status-en-panne';
      case 'hors service': return 'status-hors-service';
      default: return 'status-fermé';
    }
  };

  const paginatedMateriels = filteredMateriels?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];

  const totalPages = Math.ceil(filteredMateriels?.length / itemsPerPage) || 0;

  // Modal Components
  const ModalAjoutMateriel: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAdd: (materiel: Omit<Materiel, 'id'>) => Promise<void>
  }> = ({ isOpen, onClose, onAdd }) => {
    const { theme } = useTheme();
    const [formData, setFormData] = useState({
      numSerie: '',
      marque: '',
      modele: '',
      categorie: '',
      status: 'Disponible',
      dateAjout: new Date().toISOString().split('T')[0],
      uc: {
        nomPC: '',
        systemeExploitation: '',
        ram: '',
        disque: '',
        processeur: ''
      }
    });
    const [bulkItems, setBulkItems] = useState([{ numSerie: '', marque: '', modele: '' }]);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      if (name.startsWith('uc.')) {
        const ucField = name.split('.')[1];
        setFormData(prev => ({
          ...prev,
          uc: {
            ...prev.uc,
            [ucField]: value
          }
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    };

    const handleBulkChange = (index: number, field: string, value: string) => {
      const newBulkItems = [...bulkItems];
      newBulkItems[index] = { ...newBulkItems[index], [field]: value };
      setBulkItems(newBulkItems);
    };

    const addBulkItem = () => {
      setBulkItems([...bulkItems, { numSerie: '', marque: '', modele: '' }]);
    };

    const removeBulkItem = (index: number) => {
      setBulkItems(bulkItems.filter((_, i) => i !== index));
    };

    const handleSubmit = useCallback(
      async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (submitting) return;

        setSubmitting(true);

        try {
          if (isBulkMode) {
            for (const item of bulkItems) {
              if (item.numSerie && item.marque && item.modele) {
                await onAdd({
                  ...formData,
                  numSerie: item.numSerie,
                  marque: item.marque,
                  modele: item.modele,
                  categorie: formData.categorie,
                  status: formData.status,
                  dateAjout: formData.dateAjout
                });
              }
            }
          } else {
            if (
              formData.numSerie &&
              formData.marque &&
              formData.modele &&
              formData.categorie
            ) {
              await onAdd(formData);
            }
          }

          onClose();
        } catch (err: unknown) {
          console.error("Erreur lors de la soumission du formulaire:", err);
          // L'erreur est déjà gérée dans onAdd, donc pas de toast ici
        } finally {
          if (mountedRef.current) setSubmitting(false);
        }
      },
      [bulkItems, formData, isBulkMode, onAdd, onClose, submitting]
    );


    const isFormValid = () => {
      if (isBulkMode) {
        return bulkItems.some(item => item.numSerie && item.marque && item.modele) && formData.categorie;
      }
      return formData.numSerie && formData.marque && formData.modele && formData.categorie;
    };

    if (!isOpen) return null;

    return (
      <div className="modal-overlay">
        <div className={`modal-content form-modal ${theme}`}>
          <div className="modal-header">
            <h2>Ajouter un Matériel</h2>
            <button className="close-button" onClick={onClose} aria-label="Fermer" type="button">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="categorie">Catégorie *</label>
                <select
                  id="categorie"
                  name="categorie"
                  value={formData.categorie}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  <option value="Ordinateur">Ordinateur</option>
                  <option value="Imprimante">Imprimante</option>
                  <option value="Téléphone">Téléphone</option>
                  <option value="Souris">Souris</option>
                  <option value="Clavier">Clavier</option>
                </select>
              </div>

              {(formData.categorie === 'Souris' || formData.categorie === 'Clavier') && (
                <div className="bulk-toggle">
                  <label>
                    <input
                      type="checkbox"
                      checked={isBulkMode}
                      onChange={(e) => setIsBulkMode(e.target.checked)}
                    />
                    Création en masse
                  </label>
                </div>
              )}

              {isBulkMode ? (
                <div className="bulk-items">
                  <h3>Articles à ajouter</h3>
                  {bulkItems.map((item, index) => (
                    <div key={index} className="bulk-item">
                      <input
                        type="text"
                        placeholder="Numéro de série"
                        value={item.numSerie}
                        onChange={(e) => handleBulkChange(index, 'numSerie', e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Marque"
                        value={item.marque}
                        onChange={(e) => handleBulkChange(index, 'marque', e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Modèle"
                        value={item.modele}
                        onChange={(e) => handleBulkChange(index, 'modele', e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeBulkItem(index)}
                        disabled={bulkItems.length === 1}
                        aria-label="Supprimer cet article"
                      >
                        <Minus size={16} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addBulkItem} className="add-bulk-button">
                    <Plus size={16} />
                    Ajouter un article
                  </button>
                </div>
              ) : (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="numSerie">Numéro de série *</label>
                      <input
                        type="text"
                        id="numSerie"
                        name="numSerie"
                        value={formData.numSerie}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="marque">Marque *</label>
                      <input
                        type="text"
                        id="marque"
                        name="marque"
                        value={formData.marque}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="modele">Modèle *</label>
                      <input
                        type="text"
                        id="modele"
                        name="modele"
                        value={formData.modele}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="status">Statut</label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="Disponible">Disponible</option>
                        <option value="Affecté">Affecté</option>
                        <option value="En panne">En panne</option>
                        <option value="Hors service">Hors service</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="dateAjout">Date d'ajout</label>
                    <input
                      type="date"
                      id="dateAjout"
                      name="dateAjout"
                      value={formData.dateAjout}
                      onChange={handleInputChange}
                    />
                  </div>

                  {formData.categorie === 'Ordinateur' && (
                    <div className="ordinateur-fields">
                      <h3>Spécifications Ordinateur</h3>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="nomPC">Nom PC</label>
                          <input
                            type="text"
                            id="nomPC"
                            name="uc.nomPC"
                            value={formData.uc?.nomPC || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="systemeExploitation">Système d'exploitation</label>
                          <input
                            type="text"
                            id="systemeExploitation"
                            name="uc.systemeExploitation"
                            value={formData.uc?.systemeExploitation || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="ram">RAM</label>
                          <input
                            type="text"
                            id="ram"
                            name="uc.ram"
                            value={formData.uc?.ram || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="disque">Disque</label>
                          <input
                            type="text"
                            id="disque"
                            name="uc.disque"
                            value={formData.uc?.disque || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="processeur">Processeur</label>
                        <input
                          type="text"
                          id="processeur"
                          name="uc.processeur"
                          value={formData.uc?.processeur || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} className="cancel-button" disabled={submitting}>
                Annuler
              </button>
              <button type="submit" className="submit-button" disabled={!isFormValid() || submitting}>
                {submitting ? 'Ajout en cours...' : 'Ajouter'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ConsulterMaterielModal: React.FC<{ isOpen: boolean; onClose: () => void; materiel: Materiel }> = ({ isOpen, onClose, materiel }) => {
    const barcodeRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();

    const handlePrint = useReactToPrint({
      contentRef: barcodeRef,
      documentTitle: `Badge-${materiel?.numSerie}`,
    });

    const getStatusColor = (status: string) => {
      switch (status?.toLowerCase()) {
        case 'disponible': return 'var(--green-btn)';
        case 'affecté': return 'var(--blue-btn)';
        case 'en panne': return 'var(--red-btn)';
        case 'hors service': return 'var(--orange-btn)';
        default: return 'var(--gray-btn)';
      }
    };

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className={`modal-content consulter-modal ${theme}`} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Détails du Matériel</h2>
            <button className="close-button" onClick={onClose} aria-label="Fermer" type="button">
              <X size={20} />
            </button>
          </div>

          <div className="modal-body">
            <div className="materiel-details">
              <div className="barcode-section">
                <div
                  ref={barcodeRef}
                  className="barcode-card"
                >
                  <h4>Matériel</h4>
                  <Barcode
                    value={materiel?.numSerie ?? ''}
                    format="CODE128"
                    width={2}
                    height={100}
                    displayValue
                  />
                </div>

                <button
                  onClick={handlePrint}
                  className="print-button"
                >
                  🖨️ Imprimer
                </button>
              </div>
              <div className="detail-section">
                <h3>Informations Générales</h3>

                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Numéro de Série:</label>
                    <span>{materiel?.numSerie}</span>
                  </div>
                  <div className="detail-item">
                    <label>Marque:</label>
                    <span>{materiel?.marque}</span>
                  </div>
                  <div className="detail-item">
                    <label>Modèle:</label>
                    <span>{materiel?.modele}</span>
                  </div>
                  <div className="detail-item">
                    <label>Catégorie:</label>
                    <span>{materiel?.categorie}</span>
                  </div>
                  <div className="detail-item">
                    <label>Statut:</label>
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(materiel?.status) }}>
                      {materiel?.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Date d'Ajout:</label>
                    <span>{materiel?.dateAjout}</span>
                  </div>
                </div>
              </div>

              {materiel?.categorie === 'Ordinateur' && (
                <div className="detail-section">
                  <h3>Spécifications Ordinateur</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Nom PC:</label>
                      <span>{materiel?.uc?.nomPC || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Système d'Exploitation:</label>
                      <span>{materiel?.uc?.systemeExploitation || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>RAM:</label>
                      <span>{materiel?.uc?.ram || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Disque:</label>
                      <span>{materiel?.uc?.disque || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Processeur:</label>
                      <span>{materiel?.uc?.processeur || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h3>Références</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Réf. Affectation:</label>
                    <span>{materiel?.refAffectation || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Réf. Position:</label>
                    <span>{materiel?.refPosition || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Réf. Incident:</label>
                    <span>{materiel?.refIncident || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="cancel-button" onClick={onClose} type="button">
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ModalAjouterAffectation: React.FC<{
    onClose: () => void;
    onAdd: (data: { matricule?: string; refPosition?: string }) => void;
  }> = ({ onClose, onAdd }) => {
    const { theme } = useTheme();
    const [personnes, setPersonnes] = useState<{ matricule: string; nom: string; prenom: string }[]>([]);
    const [positions, setPositions] = useState<{ refPosition: string; designPosition: string }[]>([]);
    const [selectedPersonne, setSelectedPersonne] = useState('');
    const [selectedPosition, setSelectedPosition] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
      const fetchData = async () => {
        try {
          const [personnesData, positionsData] = await Promise.all([
            getAllPersonnes(),
            getAllPositions()
          ]);
          setPersonnes(personnesData);
          setPositions(positionsData);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;

      setSubmitting(true);
      try {
        const affectationData = {
          matricule: selectedPersonne || undefined,
          refPosition: selectedPosition || undefined
        };

        await createAffectation(affectationData);
        onAdd(affectationData);
      } catch (error) {
        console.error('Error creating affectation:', error);
      } finally {
        setSubmitting(false);
      }
    };

    const isFormValid = selectedPersonne || selectedPosition;

    if (loading) {
      return (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Chargement...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className={`modal-content ${theme}`} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Affecter le matériel</h2>
            <button className="close-button" onClick={onClose} aria-label="Fermer">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="personne">Personne (optionnel)</label>
                <select
                  id="personne"
                  value={selectedPersonne}
                  onChange={(e) => setSelectedPersonne(e.target.value)}
                >
                  <option value="">Sélectionner une personne</option>
                  {personnes.map((personne) => (
                    <option key={personne.matricule} value={personne.matricule}>
                      {personne.matricule} - {personne.nom} {personne.prenom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="position">Position (optionnel)</label>
                <select
                  id="position"
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                >
                  <option value="">Sélectionner une position</option>
                  {positions.map((position) => (
                    <option key={position.refPosition} value={position.refPosition}>
                      {position.refPosition} - {position.designPosition}
                    </option>
                  ))}
                </select>
              </div>

              <p className="info-text">
                Sélectionnez au moins une personne ou une position pour l'affectation.
              </p>
            </div>

            <div className="modal-footer">
              <button type="button" className="cancel-button" onClick={onClose} disabled={submitting}>
                Annuler
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={!isFormValid || submitting}
              >
                {submitting ? 'Affectation en cours...' : 'Affecter'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ModalModifierMateriel: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    materiel: Materiel;
    onUpdate: (numSerie: string, materiel: Partial<Materiel>) => Promise<void>
  }> = ({ isOpen, onClose, materiel, onUpdate }) => {
    const [formData, setFormData] = useState({
      numSerie: materiel?.numSerie || '',
      marque: materiel?.marque || '',
      modele: materiel?.modele || '',
      categorie: materiel?.categorie || '',
      status: materiel?.status || '',
      dateAjout: materiel?.dateAjout || '',
      uc: {
        nomPC: materiel?.uc?.nomPC || '',
        systemeExploitation: materiel?.uc?.systemeExploitation || '',
        ram: materiel?.uc?.ram || '',
        disque: materiel?.uc?.disque || '',
        processeur: materiel?.uc?.processeur || ''
      }
    });
    const [submitting, setSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      if (name.startsWith('uc.')) {
        const ucField = name.split('.')[1];
        setFormData(prev => ({
          ...prev,
          uc: {
            ...prev.uc,
            [ucField]: value
          }
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;
      setSubmitting(true);

      try {
        const { numSerie, ...rest } = formData;
        if (numSerie && formData.marque && formData.modele && formData.categorie) {
          // Remove empty strings to avoid overwriting with ''
          const cleanedData = Object.fromEntries(
            Object.entries(rest).filter(([_, v]) => v !== '')
          );
          await onUpdate(numSerie, cleanedData as Partial<Materiel>);
          onClose();
        }
      } catch (error) {
        console.error('Erreur modification:', error);
      } finally {
        setSubmitting(false);
      }
    };

    const isFormValid = () => {
      return formData.numSerie && formData.marque && formData.modele && formData.categorie;
    };

    if (!isOpen) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Modifier un Matériel</h2>
            <button className="close-button" onClick={onClose} aria-label="Fermer" type="button">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="categorie">Catégorie *</label>
                <select
                  id="categorie"
                  name="categorie"
                  value={formData.categorie}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  <option value="Ordinateur">Ordinateur</option>
                  <option value="Imprimante">Imprimante</option>
                  <option value="Téléphone">Téléphone</option>
                  <option value="Souris">Souris</option>
                  <option value="Clavier">Clavier</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="numSerie">Numéro de série *</label>
                  <input
                    type="text"
                    id="numSerie"
                    name="numSerie"
                    value={formData.numSerie}
                    onChange={handleInputChange}
                    required
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="marque">Marque *</label>
                  <input
                    type="text"
                    id="marque"
                    name="marque"
                    value={formData.marque}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="modele">Modèle *</label>
                  <input
                    type="text"
                    id="modele"
                    name="modele"
                    value={formData.modele}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="status">Statut</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="Affecté">Affecté</option>
                    <option value="En panne">En panne</option>
                    <option value="Hors service">Hors service</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="dateAjout">Date d'ajout</label>
                <input
                  type="date"
                  id="dateAjout"
                  name="dateAjout"
                  value={formData.dateAjout}
                  onChange={handleInputChange}
                />
              </div>

              {formData.categorie === 'Ordinateur' && (
                <div className="ordinateur-fields">
                  <h3>Spécifications Ordinateur</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="nomPC">Nom PC</label>
                      <input
                        type="text"
                        id="nomPC"
                        name="uc.nomPC"
                        value={formData.uc?.nomPC || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="systemeExploitation">Système d'exploitation</label>
                      <input
                        type="text"
                        id="systemeExploitation"
                        name="uc.systemeExploitation"
                        value={formData.uc?.systemeExploitation || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="ram">RAM</label>
                      <input
                        type="text"
                        id="ram"
                        name="uc.ram"
                        value={formData.uc?.ram || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="disque">Disque</label>
                      <input
                        type="text"
                        id="disque"
                        name="uc.disque"
                        value={formData.uc?.disque || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="processeur">Processeur</label>
                    <input
                      type="text"
                      id="processeur"
                      name="uc.processeur"
                      value={formData.uc?.processeur || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} className="cancel-button" disabled={submitting}>
                Annuler
              </button>
              <button type="submit" className="submit-button" disabled={!isFormValid() || submitting}>
                {submitting ? 'Modification en cours...' : 'Modifier'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="materiels-container">
        <div className="loading-state">Chargement des matériels...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="materiels-container">
        <div className="error-state">
          <h2>Erreur</h2>
          <p>{error}</p>
          <button onClick={fetchMaterielsData} type="button">Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="materiels-container">
      {/* Header */}
      <PageHeader title="Matériels" onBack={handleBack} />

      {/* Search and Filters */}
      <section className="search-filters-section">
        <div className="search-filters">
          <div className="search-group">
            <div className="search-input-container">
              <Search size={16} />
              <input
                type="text"
                placeholder="Rechercher par numéro de série ou date d'ajout"
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

          <button className="add-button" onClick={() => setShowAddModal(true)} type="button">
            <Plus size={16} />
            Ajouter
          </button>
        </div>
      </section>

      {/* Material Table */}
      <section className="table-section">
        <div className="table-container">
          <table className="materiels-table">
            <thead>
              <tr>
                <th className="filter-th" onClick={() => handleSort('numSerie')}>
                  Numéro de série
                  {sortConfig?.key === 'numSerie' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Marque"
                    value={filters.marque}
                    onChange={(e) => handleFilterChange('marque', e.target.value)}
                  />
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Modèle"
                    value={filters.modele}
                    onChange={(e) => handleFilterChange('modele', e.target.value)}
                  />
                </th>
                <th>
                  <select
                    value={filters.categorie}
                    onChange={(e) => handleFilterChange('categorie', e.target.value)}
                    aria-label="Filtrer par catégorie"
                  >
                    <option value="">Toutes les catégories</option>
                    <option value="Ordinateur">Ordinateur</option>
                    <option value="Imprimante">Imprimante</option>
                    <option value="Téléphone">Téléphone</option>
                    <option value="Souris">Souris</option>
                    <option value="Clavier">Clavier</option>
                  </select>
                </th>
                <th>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    aria-label="Filtrer par statut"
                  >
                    <option value="">Statut</option>
                    <option value="Disponible">Disponible</option>
                    <option value="Affecté">Affecté</option>
                    <option value="En panne">En panne</option>
                    <option value="Hors service">Hors service</option>
                  </select>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMateriels.length > 0 ? (
                paginatedMateriels.map((materiel) => (
                  <tr key={materiel?.numSerie}>
                    <td>{materiel?.numSerie}</td>
                    <td>{materiel?.marque}</td>
                    <td>{materiel?.modele}</td>
                    <td>{materiel?.categorie}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(materiel?.status)}`}>
                        {materiel?.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleConsultMateriel(materiel)}
                          className="action-btn consulter"
                          aria-label="Voir les détails"
                          type="button"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEditMateriel(materiel)}
                          className="action-btn edit"
                          aria-label="Modifier"
                          type="button"
                        >
                          <Edit size={16} />
                        </button>
                        {materiel?.status?.toLowerCase() === 'affecté' ? (
                          <button
                            onClick={() => handleCloseAffectation(Number(materiel?.refAffectation) || 0)}
                            className="action-btn working des-affecter"
                            aria-label="Close Affectation"
                            type="button"
                          >
                            <Link2Off size={16} />
                          </button>
                        ) : materiel?.status?.toLowerCase() === 'disponible' ? (
                          <button
                            onClick={() => handleAffectMateriel(materiel)}
                            className="action-btn working affecter"
                            aria-label="Affecter"
                            type="button"
                          >
                            <Link2 size={16} />
                          </button>
                        ) : (
                          <button
                            className="action-btn disabled"
                            aria-label="Action"
                            type="button"
                            disabled
                          >
                            {materiel?.status?.toLowerCase() === 'affecté' ? <Link2Off size={16} /> : <Link2 size={16} />}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMateriel(materiel?.numSerie || '')}
                          className="action-btn delete"
                          aria-label="Supprimer"
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="no-data">
                    Aucun matériel trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
              type="button"
            >
              <ChevronLeft size={16} />
              Précédent
            </button>

            <span className="pagination-info">
              Page {currentPage} sur {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
              type="button"
            >
              Suivant
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </section>

      {/* Modals */}
      <ModalAjoutMateriel
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddMateriel}
      />

      {selectedMateriel && (
        <ConsulterMaterielModal
          isOpen={showConsultModal}
          onClose={() => {
            setShowConsultModal(false);
            setSelectedMateriel(null);
          }}
          materiel={selectedMateriel}
        />
      )}

      {selectedMateriel && (
        <ModalModifierMateriel
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMateriel(null);
          }}
          materiel={selectedMateriel}
          onUpdate={handleUpdateMateriel}
        />
      )}

      {selectedMateriel && showAffectationModal && (
        <ModalAjouterAffectation
          onClose={() => {
            setShowAffectationModal(false);
            setSelectedMateriel(null);
          }}
          onAdd={() => {
            setShowAffectationModal(false);
            setSelectedMateriel(null);
            fetchMaterielsData();
          }}
        />
      )}
    </div>
  );
};

export default Materiels;
