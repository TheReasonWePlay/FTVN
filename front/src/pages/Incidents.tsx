import React, { useState, useEffect, useMemo, useRef } from 'react';

import {
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  X,
  Loader2
} from 'lucide-react';

import '../styles/Incidents.css';
import { useTheme } from '../contexts/ThemeContext';
import PageHeader from '../components/PageHeader';

import {
  getAllIncidents,
  createIncident,
  updateIncident,
  deleteIncident
} from '../api/incident-api';

interface Incident {
  refIncident: string;
  refInventaire: string;
  typeIncident: string;
  numSerie: string;
  statutIncident: string;
  dateInc: string;
  matricule: string;
  description: string;
  personne?: {
    nom: string;
    prenom: string;
  };
  materiel?: {
    marque: string;
    modele: string;
  };
  inventaire?: {
    date: string;
  };
}

interface IncidentsData {
  totalIncidents: number;
  incidentsByStatus: { [key: string]: number };
  incidentsByType: { [key: string]: number };
  incidents: Incident[];
}

// Utility function to determine the CSS class for incident status based on the status string
const getStatusClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'ouvert': return 'status-ouvert';
    case 'en cours': return 'status-en-cours';
    case 'résolu': return 'status-résolu';
    case 'fermé': return 'status-fermé';
    default: return 'status-fermé';
  }
};

const Incidents: React.FC = () => {
  const { theme } = useTheme();
  const [incidentsData, setIncidentsData] = useState<IncidentsData>({
    totalIncidents: 0,
    incidentsByStatus: {},
    incidentsByType: {},
    incidents: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filters, setFilters] = useState({
    refIncident: '',
    refInventaire: '',
    numSerie: '',
    typeIncident: '',
    statutIncident: '',
    matricule: ''
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof Incident; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showSignalerModal, setShowSignalerModal] = useState(false);
  const [showConsulterModal, setShowConsulterModal] = useState(false);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent state updates on unmounted components
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = true;
    };
  }, []);
  useEffect(() => {
    // Fetches all incidents data from the API, processes it to count by status and type, and updates the state
    const fetchIncidentsData = async () => {
      try {
        setLoading(true);
        setError(null);
        const incidents = await getAllIncidents();
        console.log("incidents");
        console.log(incidents);
        if (isMountedRef.current) {
          const byStatus = incidents.reduce((acc, inc) => {
            acc[inc.statutIncident] = (acc[inc.statutIncident] || 0) + 1;
            return acc;
          }, {} as { [key: string]: number });
          const byType = incidents.reduce((acc, inc) => {
            acc[inc.typeIncident] = (acc[inc.typeIncident] || 0) + 1;
            return acc;
          }, {} as { [key: string]: number });
          setIncidentsData({
            totalIncidents: incidents.length,
            incidentsByStatus: byStatus,
            incidentsByType: byType,
            incidents: incidents
          });

        }
      } catch (err) {
        if (isMountedRef.current) {
          setError('Erreur lors du chargement des incidents');
          console.error('Error fetching incidents:', err);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
        
      }
    };
    fetchIncidentsData();
  }, []);

  // Memoized computation that filters and sorts the incidents based on search term, date range, filters, and sort configuration
  const filteredIncidents = useMemo(() => {
    return incidentsData.incidents.filter(incident => {
      const search = searchTerm.toLowerCase();
  
      const matchesSearch =
        !search ||
        String(incident.refIncident).toLowerCase().includes(search) ||
        String(incident.refInventaire ?? '').toLowerCase().includes(search) ||
        String(incident.numSerie).toLowerCase().includes(search) ||
        String(incident.dateInc).toLowerCase().includes(search);
  
      const incidentDate = new Date(incident.dateInc).getTime();
      const fromDate = dateFrom ? new Date(dateFrom).getTime() : null;
      const toDate = dateTo ? new Date(dateTo).getTime() : null;
  
      const matchesDateRange =
        (!fromDate || incidentDate >= fromDate) &&
        (!toDate || incidentDate <= toDate);
  
      const matchesFilters =
        (!filters.refIncident || String(incident.refIncident).toLowerCase().includes(filters.refIncident.toLowerCase())) &&
        (!filters.refInventaire || String(incident.refInventaire ?? '').toLowerCase().includes(filters.refInventaire.toLowerCase())) &&
        (!filters.numSerie || incident.numSerie.toLowerCase().includes(filters.numSerie.toLowerCase())) &&
        (!filters.typeIncident || incident.typeIncident.toLowerCase().includes(filters.typeIncident.toLowerCase())) &&
        (!filters.statutIncident || incident.statutIncident.toLowerCase().includes(filters.statutIncident.toLowerCase())) &&
        (!filters.matricule || incident.matricule.toLowerCase().includes(filters.matricule.toLowerCase()));
  
      return matchesSearch && matchesDateRange && matchesFilters;
    });
  }, [searchTerm, dateFrom, dateTo, filters, incidentsData.incidents]);

  // Handles sorting of the incidents table by toggling the sort direction for the given key
  const handleSort = (key: keyof Incident) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Updates the filters state for a specific field with the new value
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Refreshes the incidents data by fetching from the API and updating the state with aggregated counts
  const refreshIncidents = async () => {
    try {
      const incidents = await getAllIncidents();
      if (isMountedRef.current) {
        const byStatus = incidents.reduce((acc, inc) => {
          acc[inc.statutIncident] = (acc[inc.statutIncident] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });
        const byType = incidents.reduce((acc, inc) => {
          acc[inc.typeIncident] = (acc[inc.typeIncident] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });
        setIncidentsData({
          totalIncidents: incidents.length,
          incidentsByStatus: byStatus,
          incidentsByType: byType,
          incidents: incidents
        });
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Erreur lors du rafraîchissement des incidents');
        console.error('Error refreshing incidents:', err);
      }
    }
  };

  // Handles adding a new incident by calling the API, refreshing the data, and closing the modal
  const handleAddIncident = async (newIncident: Omit<Incident, 'refIncident'>) => {
    try {
      await createIncident(newIncident);
      await refreshIncidents();
      setShowSignalerModal(false);
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Error creating incident:', err);
        setError('Erreur lors de la création de l\'incident');
      }
    }
  };

  // Handles consulting an incident by setting it as selected, showing the modal, and automatically updating status if 'Ouvert'
  const handleConsulterIncident = async (incident: Incident) => {
    setSelectedIncident(incident);
    setShowConsulterModal(true);
    // Automatically change status from 'Ouvert' to 'En cours' when consulting
    if (incident.statutIncident === 'Ouvert') {
      try {
        await handleStatusChange(incident, 'En cours');
      } catch (err) {
        console.error('Error updating incident status:', err);
      }
    }
  };

  // Handles modifying an incident by setting it as selected and showing the modifier modal
  const handleModifierIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowModifierModal(true);
  };

  // Handles deleting an incident by calling the API and refreshing the incidents data
  const handleDeleteIncident = async (incident: Incident) => {
    try {
      await deleteIncident(incident.refIncident);
      await refreshIncidents();
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Error deleting incident:', err);
        setError('Erreur lors de la suppression de l\'incident');
      }
    }
  };

  // Handles changing the status of an incident by updating it via API and refreshing the data
  const handleStatusChange = async (incident: Incident, newStatus: string) => {
    try {
      await updateIncident(incident.refIncident, { statutIncident: newStatus });
      await refreshIncidents();
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Error updating incident:', err);
        setError('Erreur lors de la mise à jour de l\'incident');
      }
    }
  };

  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);

  // Modal component for signaling/reporting a new incident with a form to input details
  const ModalSignalerIncident: React.FC<{
    onClose: () => void;
    onAdd: (incident: Omit<Incident, 'refIncident'>) => void;
    theme: string;
  }> = ({ onClose, onAdd, theme }) => {
    const [formData, setFormData] = useState({
      refInventaire: '',
      typeIncident: '',
      numSerie: '',
      matricule: '',
      prenom: '',
      description: ''
    });

    // Handles input changes in the form by updating the form data state
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handles form submission by validating and creating a new incident object to add
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (isFormValid()) {
        const incident: Omit<Incident, 'refIncident'> = {
          refInventaire: formData.refInventaire,
          typeIncident: formData.typeIncident,
          numSerie: formData.numSerie,
          statutIncident: 'Ouvert',
          dateInc: new Date().toISOString().split('T')[0],
          matricule: formData.matricule,
          description: formData.description,
          personne: formData.prenom ? { nom: '', prenom: formData.prenom } : undefined
        };
        onAdd(incident);
      }
    };

    // Checks if the form is valid by ensuring required fields are filled
    const isFormValid = () => {
      return formData.refInventaire && formData.typeIncident && formData.numSerie && formData.matricule && formData.description;
    };

    return (
      <div className={`modal-overlay ${theme}`} onClick={onClose}>
        <div className="modal-content form-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Signaler un Incident</h2>
            <button type="button" className="close-button" onClick={onClose} aria-label="Fermer">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-row">
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
                  <label htmlFor="prenom">Prénom</label>
                  <input
                    type="text"
                    id="prenom"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Décrivez l'incident..."
                  required
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

  // Modal component for viewing/consulting the details of an existing incident
  const ModalConsulterIncident: React.FC<{
    incident: Incident;
    onClose: () => void;
    theme: string;
  }> = ({ incident, onClose, theme }) => {
    return (
      <div className={`modal-overlay ${theme}`} onClick={onClose}>
        <div className="modal-content consulter-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Détails de l'Incident</h2>
            <button type="button" className="close-button" onClick={onClose} aria-label="Fermer">
              <X size={20} />
            </button>
          </div>

          <div className="modal-body">
            <div className="incident-details">
              <div className="detail-section">
                <h3>Informations Générales</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Réf. Incident:</label>
                    <span>{incident.refIncident}</span>
                  </div>
                  <div className="detail-item">
                    <label>Réf. Inventaire:</label>
                    <span>{incident.refInventaire || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Type d'Incident:</label>
                    <span>{incident.typeIncident}</span>
                  </div>
                  <div className="detail-item">
                    <label>Numéro de Série:</label>
                    <span>{incident.numSerie}</span>
                  </div>
                  <div className="detail-item">
                    <label>Statut:</label>
                    <span className={`status-badge ${getStatusClass(incident.statutIncident)}`}>
                      {incident.statutIncident}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Date:</label>
                    <span>{incident.dateInc}</span>
                  </div>
                  <div className="detail-item">
                    <label>Matricule:</label>
                    <span>{incident.matricule}</span>
                  </div>
                  <div className="detail-item">
                    <label>Prénom:</label>
                    <span>{incident.personne?.prenom || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Description</h3>
                <div className="description-box">
                  {incident.description || 'Aucune description fournie.'}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-button">
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modal component for modifying the status of an existing incident
  const ModalModifierIncident: React.FC<{
    incident: Incident;
    onClose: () => void;
    onUpdate: (incident: Incident, newStatus: string) => Promise<void>;
    theme: string;
  }> = ({ incident, onClose, onUpdate, theme }) => {
    const [newStatus, setNewStatus] = useState(incident.statutIncident);

    // Handles form submission for updating the incident status
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await onUpdate(incident, newStatus);
      onClose();
    };

    return (
      <div className={`modal-overlay ${theme}`} onClick={onClose}>
        <div className="modal-content modifier-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Modifier l'Incident</h2>
            <button type="button" className="close-button" onClick={onClose} aria-label="Fermer">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Informations de l'Incident</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Réf. Incident:</label>
                    <span>{incident.refIncident}</span>
                  </div>
                  <div className="detail-item">
                    <label>Type d'Incident:</label>
                    <span>{incident.typeIncident}</span>
                  </div>
                  <div className="detail-item">
                    <label>Numéro de Série:</label>
                    <span>{incident.numSerie}</span>
                  </div>
                  <div className="detail-item">
                    <label>Matricule:</label>
                    <span>{incident.matricule}</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="statutIncident">Nouveau Statut *</label>
                <select
                  id="statutIncident"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  required
                >
                  <option value="Ouvert">Ouvert</option>
                  <option value="En cours">En cours</option>
                  <option value="Résolu">Résolu</option>
                  <option value="Fermé">Fermé</option>
                </select>
              </div>

              <div className="status-preview">
                <p>Aperçu du nouveau statut:</p>
                <span className={`status-badge ${getStatusClass(newStatus)}`}>
                  {newStatus}
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} className="cancel-button">
                Annuler
              </button>
              <button type="submit" className="submit-button">
                Mettre à jour
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`incidents-container ${theme}`}>
        <div className="loading-state">
          <Loader2 size={48} className="loading-spinner" />
          <p>Chargement des incidents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`incidents-container ${theme}`}>
        <div className="error-state">
          <AlertTriangle size={48} className="error-icon" />
          <p>{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="retry-button">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    // In real app, navigate back or to dashboard
    window.history.back();
  };

  return (
    <div className={`incidents-container ${theme}`}>
      {/* Header */}
      <PageHeader title="Incidents" onBack={handleBack} />

      {/* Information Cards */}
      <section className="info-cards-section">
        <div className="info-cards">
          <div className="info-card">
            <h3>Total Incidents</h3>
            <p className="card-value">{incidentsData.totalIncidents}</p>
          </div>

          <div className="info-card">
            <h3>Par Statut</h3>
            <div className="status-breakdown">
              {Object.entries(incidentsData.incidentsByStatus).map(([status, count]) => (
                <div key={status} className="status-item">
                  <span className={`status-dot status-${status.toLowerCase().replace(' ', '-')}`}></span>
                  <span>{status}: {count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="info-card">
            <h3>Par Type</h3>
            <div className="type-breakdown">
              {Object.entries(incidentsData.incidentsByType).map(([type, count]) => (
                <div key={type} className="type-item">
                  <span>{type}: {count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="search-filters-section">
        <div className="search-filters">
          <div className="search-group">
            <div className="search-input-container">
              <Search size={16} />
              <input
                type="text"
                placeholder="Rechercher par réf. incident, réf. inventaire, numéro de série ou date"
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

          <button type="button" className="add-button" onClick={() => setShowSignalerModal(true)}>
            <AlertTriangle size={16} />
            Signaler un incident
          </button>
        </div>
      </section>

      {/* Incidents Table */}
      <section className="table-section">
        <div className="table-container">
          <table className="incidents-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="text"
                    placeholder="Réf. Incident"
                    value={filters.refIncident}
                    onChange={(e) => handleFilterChange('refIncident', e.target.value)}
                  />
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Réf. Inventaire"
                    value={filters.refInventaire}
                    onChange={(e) => handleFilterChange('refInventaire', e.target.value)}
                  />
                </th>
                <th>
                  <select
                    value={filters.typeIncident}
                    onChange={(e) => handleFilterChange('typeIncident', e.target.value)}
                    aria-label="Filtrer par type d'incident"
                  >
                    <option value="">Tous les types</option>
                    <option value="Panne matériel">Panne matériel</option>
                    <option value="Panne logicielle">Panne logicielle</option>
                    <option value="Vol">Vol</option>
                    <option value="Perte">Perte</option>
                    <option value="Dégât">Dégât</option>
                    <option value="Autre">Autre</option>
                  </select>
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Numéro de série"
                    value={filters.numSerie}
                    onChange={(e) => handleFilterChange('numSerie', e.target.value)}
                  />
                </th>
                <th>
                  <select
                    value={filters.statutIncident}
                    onChange={(e) => handleFilterChange('statutIncident', e.target.value)}
                    aria-label="Filtrer par statut d'incident"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="Ouvert">Ouvert</option>
                    <option value="En cours">En cours</option>
                    <option value="Résolu">Résolu</option>
                    <option value="Fermé">Fermé</option>
                  </select>
                </th>
                <th onClick={() => handleSort('dateInc')}>
                  Date
                  {sortConfig?.key === 'dateInc' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Matricule"
                    value={filters.matricule}
                    onChange={(e) => handleFilterChange('matricule', e.target.value)}
                  />
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedIncidents.map((incident) => (
                <tr key={incident.refIncident}>
                  <td>{incident.refIncident}</td>
                  <td>{incident.refInventaire || 'N/A'}</td>
                  <td>{incident.typeIncident}</td>
                  <td>{incident.numSerie}</td>
                  <td>
                    <span className={`status-badge status-${incident.statutIncident.toLowerCase().replace(' ', '-')}`}>
                      {incident.statutIncident}
                    </span>
                  </td>
                  <td>{incident.dateInc}</td>
                  <td>{incident.matricule}</td>
                  <td>
                    <div className="action-buttons">
                      <button type="button" onClick={() => handleModifierIncident(incident)} aria-label="Modifier">
                        <Edit size={14} />
                      </button>
                      <button type="button" onClick={() => handleConsulterIncident(incident)} aria-label="Consulter">
                        <Eye size={14} />
                      </button>
                      <button type="button" onClick={() => handleDeleteIncident(incident)} aria-label="Supprimer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredIncidents.length === 0 && (
          <div className="empty-state">
            <AlertTriangle size={48} className="empty-icon" />
            <h3>Aucun incident trouvé</h3>
            <p>Il n'y a aucun incident correspondant à vos critères de recherche.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="pagination">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              aria-label="Page précédente"
            >
              <ChevronLeft size={16} />
            </button>
            <span>Page {currentPage} sur {totalPages}</span>
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              aria-label="Page suivante"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </section>

      {/* Modals */}
      {showSignalerModal && (
        <ModalSignalerIncident
          onClose={() => setShowSignalerModal(false)}
          onAdd={handleAddIncident}
          theme={theme}
        />
      )}

      {showConsulterModal && selectedIncident && (
        <ModalConsulterIncident
          incident={selectedIncident}
          onClose={() => setShowConsulterModal(false)}
          theme={theme}
        />
      )}

      {showModifierModal && selectedIncident && (
        <ModalModifierIncident
          incident={selectedIncident}
          onClose={() => setShowModifierModal(false)}
          onUpdate={handleStatusChange}
          theme={theme}
        />
      )}
    </div>
  );
};

export default Incidents;
