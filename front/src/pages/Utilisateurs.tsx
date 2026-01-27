import React, { useState, useEffect } from 'react';

import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

import '../styles/page.css';
import '../styles/tableau.css';
import '../styles/modal.css';
import '../styles/Utilisateurs.css';

import { getAllUtilisateurs, deleteUtilisateur } from '../api/utilisateur-api';
import { useTheme } from '../contexts/ThemeContext';
import PageHeader from '../components/PageHeader';

interface Utilisateur {
  matricule: string;
  nomUser: string;
  role: string;
  nom?: string;
  prenom?: string;
  email?: string;
  poste?: string;
  projet?: string;
}

interface UtilisateursData {
  totalUtilisateurs: number;
  utilisateurs: Utilisateur[];
}

// Local Modal Components
interface ModalProps {
  onClose: () => void;
  onConfirm?: (data: any) => void;
  utilisateur?: Utilisateur;
  currentUserRole?: string;
  onModifierRole?: (utilisateur: Utilisateur) => void;
}

// Modal component for adding a new user with a form to input user details
const ModalAjouterUtilisateur: React.FC<ModalProps> = ({ onClose, onConfirm }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    nomUser: '',
    role: 'Responsable',
    nom: '',
    prenom: '',
    email: '',
    poste: '',
    projet: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handles form submission by validating required fields and calling the onConfirm callback
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.nomUser.trim()) newErrors.nomUser = 'Nom d\'utilisateur requis';
    if (!formData.nom?.trim()) newErrors.nom = 'Nom requis';
    if (!formData.prenom?.trim()) newErrors.prenom = 'Prénom requis';
    if (!formData.email?.trim()) newErrors.email = 'Email requis';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onConfirm?.(formData);
  };

  // Updates the form data state for a specific field and clears any existing error for that field
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="modal-overlay">
      <div className={`modal-content ${theme}`}>
        <div className="modal-header">
          <h2>Ajouter un utilisateur</h2>
          <button className="close-button" onClick={onClose} aria-label="Fermer">
            <X />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-section">
              <h3>Informations de l'utilisateur</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nom d'utilisateur *</label>
                  <input
                    type="text"
                    value={formData.nomUser}
                    onChange={(e) => handleChange('nomUser', e.target.value)}
                    className={errors.nomUser ? 'error' : ''}
                    title='nomUser'
                  />
                  {errors.nomUser && <span className="error-message">{errors.nomUser}</span>}
                </div>
                <div className="form-group">
                  <label>Rôle</label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    title='role'
                  >
                    <option value="Utilisateur">Utilisateur</option>
                    <option value="Administrateur">Administrateur</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Nom *</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => handleChange('nom', e.target.value)}
                    className={errors.nom ? 'error' : ''}
                    title='nom'
                  />
                  {errors.nom && <span className="error-message">{errors.nom}</span>}
                </div>
                <div className="form-group">
                  <label>Prénom *</label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => handleChange('prenom', e.target.value)}
                    className={errors.prenom ? 'error' : ''}
                    title='prenom'
                  />
                  {errors.prenom && <span className="error-message">{errors.prenom}</span>}
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={errors.email ? 'error' : ''}
                    title='email'
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label>Poste</label>
                  <input
                    type="text"
                    value={formData.poste}
                    onChange={(e) => handleChange('poste', e.target.value)}
                    title='poste'
                  />
                </div>
                <div className="form-group">
                  <label>Projet</label>
                  <input
                    type="text"
                    value={formData.projet}
                    onChange={(e) => handleChange('projet', e.target.value)}
                    title='projet'
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <div className="action-buttons">
              <button type="button" className="cancel-button" onClick={onClose}>
                Annuler
              </button>
              <button type="submit" className="submit-button">
                Ajouter
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal component for viewing the details of an existing user
const ModalConsulterUtilisateur: React.FC<ModalProps> = ({
  utilisateur,
  onClose,
  onModifierRole,
  currentUserRole
}) => {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(utilisateur || {} as Utilisateur);

  if (!utilisateur) return null;

  // Handles saving the edited user data (placeholder for API call)
  const handleSave = () => {
    // In real app, call update API
    console.log('Updated user data:', editedData);
    setIsEditing(false);
  };

  const isAdmin = currentUserRole === 'Administrateur';

  return (
    <div className="modal-overlay">
      <div className={`modal-content consulter-modal ${theme}`}>
        <div className="modal-header">
          <h2>Consulter l'utilisateur</h2>
          <button className="close-button" onClick={onClose} aria-label="Fermer">
            <X size={20}/>
          </button>
        </div>
        <div className="modal-body">
          <div className="user-details">
            <div className="detail-section">
              <h3>Informations personnelles</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Matricule</label>
                  <span>{utilisateur.matricule}</span>
                </div>
                <div className="detail-item">
                  <label>Nom d'utilisateur</label>
                  <span>{utilisateur.nomUser}</span>
                </div>
                <div className="detail-item">
                  <label>Nom</label>
                  <span>{utilisateur.nom || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Prénom</label>
                  <span>{utilisateur.prenom || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <span>{utilisateur.email || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Poste</label>
                  <span>{utilisateur.poste || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Projet</label>
                  <span>{utilisateur.projet || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Rôle</label>
                  <div className="role-section">
                    <span className={`role-badge ${utilisateur.role.toLowerCase()}`}>
                      {utilisateur.role}
                    </span>
                    {isAdmin && onModifierRole && (
                      <button
                        className="modifier-role-btn"
                        onClick={() => onModifierRole(utilisateur)}
                      >
                        Modifier
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <div className="action-buttons">
            <button className="cancel-button" onClick={onClose}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main component for managing users, including listing, searching, filtering, and CRUD operations
const Utilisateurs: React.FC = () => {
  const { theme } = useTheme();
  const [utilisateursData, setUtilisateursData] = useState<UtilisateursData>({
    totalUtilisateurs: 0,
    utilisateurs: []
  });
  const [filteredUtilisateurs, setFilteredUtilisateurs] = useState<Utilisateur[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: ''
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof Utilisateur; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAjouterModal, setShowAjouterModal] = useState(false);
  const [showConsulterModal, setShowConsulterModal] = useState(false);
  const [selectedUtilisateur, setSelectedUtilisateur] = useState<Utilisateur | null>(null);
  const [currentUserRole] = useState<string>('Administrateur'); // Mock current user role

  useEffect(() => {
    loadUtilisateurs();
  }, []);

  useEffect(() => {
    const filtered = utilisateursData.utilisateurs.filter(utilisateur => {
      const matchesSearch = utilisateur.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (utilisateur.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                           (utilisateur.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                           (utilisateur.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesFilters = (!filters.role || utilisateur.role.toLowerCase().includes(filters.role.toLowerCase()));

      return matchesSearch && matchesFilters;
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

    setFilteredUtilisateurs(filtered);
    setCurrentPage(1);
  }, [searchTerm, filters, sortConfig, utilisateursData.utilisateurs]);

  // Loads all users from the API and updates the state with the data
  const loadUtilisateurs = async () => {
    try {
      const utilisateurs = await getAllUtilisateurs();
      setUtilisateursData({
        totalUtilisateurs: utilisateurs.length,
        utilisateurs
      });
      setFilteredUtilisateurs(utilisateurs);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  // Handles sorting of the users table by toggling the sort direction for the given key
  const handleSort = (key: keyof Utilisateur) => {
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

  // Opens the modal for adding a new user
  const handleAjouterUtilisateur = () => {
    setShowAjouterModal(true);
  };

  // Handles confirming the addition of a new user by logging the data and refreshing the list
  const handleConfirmerAjout = async (utilisateurData: Omit<Utilisateur, 'matricule'>) => {
    // In real app, call createUtilisateur API
    console.log('Nouvel utilisateur:', utilisateurData);
    setShowAjouterModal(false);
    loadUtilisateurs(); // Refresh the list
  };

  // Handles consulting a user by setting it as selected and showing the consulter modal
  const handleConsulterUtilisateur = (utilisateur: Utilisateur) => {
    setSelectedUtilisateur(utilisateur);
    setShowConsulterModal(true);
  };

  // Handles modifying the role of a user (placeholder for opening role modification modal)
  const handleModifierRole = (utilisateur: Utilisateur) => {
    // In real app, open role modification modal or inline edit
    console.log('Modifier rôle pour:', utilisateur.matricule);
  };

  // Handles deleting a user after confirmation, by calling the delete API and refreshing the list
  const handleSupprimerUtilisateur = async (matricule: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await deleteUtilisateur(matricule);
        loadUtilisateurs(); // Refresh the list
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  // Handles navigating back in the browser history
  const handleBack = () => {
    window.history.back();
  };

  const paginatedUtilisateurs = filteredUtilisateurs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredUtilisateurs.length / itemsPerPage);

  const isAdmin = currentUserRole === 'Administrateur';

  return (
    <div className={`utilisateurs-container ${theme}`}>
      {/* Header */}
      <PageHeader title="Incidents" onBack={handleBack} />

      {/* Search and Filters */}
      <section className="search-filters-section">
        <div className="search-filters">
          <div className="search-group">
            <div className="search-input-container">
              <Search size={16} />
              <input
                type="text"
                placeholder="Rechercher par matricule, nom, prénom ou email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="filters">
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="role-filter"
              title='role-filter'
            >
              <option value="">Tous les rôles</option>
              <option value="Administrateur">Administrateur</option>
              <option value="Utilisateur">Utilisateur</option>
            </select>
          </div>

          {isAdmin && (
            <button className="add-button" onClick={handleAjouterUtilisateur}>
              <Plus size={16} />
              Ajouter un utilisateur
            </button>
          )}
        </div>
      </section>

      {/* Utilisateurs Table */}
      <section className="table-section">
        <div className="table-container">
          <table className="utilisateurs-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('matricule')}>
                  Matricule
                  {sortConfig?.key === 'matricule' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </th>
                <th onClick={() => handleSort('nom')}>
                  Nom
                  {sortConfig?.key === 'nom' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </th>
                <th onClick={() => handleSort('prenom')}>
                  Prénom
                  {sortConfig?.key === 'prenom' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </th>
                <th onClick={() => handleSort('email')}>
                  Email
                  {sortConfig?.key === 'email' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </th>
                <th onClick={() => handleSort('nomUser')}>
                  Nom d'utilisateur
                  {sortConfig?.key === 'nomUser' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </th>
                <th onClick={() => handleSort('role')}>
                  Rôle
                  {sortConfig?.key === 'role' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUtilisateurs.map((utilisateur) => (
                <tr key={utilisateur.matricule}>
                  <td>{utilisateur.matricule}</td>
                  <td>{utilisateur.nom || '-'}</td>
                  <td>{utilisateur.prenom || '-'}</td>
                  <td>{utilisateur.email || '-'}</td>
                  <td>{utilisateur.nomUser}</td>
                  <td>
                    <span className={`role-badge ${utilisateur.role.toLowerCase()}`}>
                      {utilisateur.role}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleConsulterUtilisateur(utilisateur)} aria-label="Consulter">
                        <Eye size={14} />
                      </button>
                      {isAdmin && (
                        <>
                          <button onClick={() => handleModifierRole(utilisateur)} aria-label="Modifier rôle">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleSupprimerUtilisateur(utilisateur.matricule)} aria-label="Supprimer">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
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
      {showAjouterModal && (
        <ModalAjouterUtilisateur
          onClose={() => setShowAjouterModal(false)}
          onConfirm={handleConfirmerAjout}
        />
      )}

      {showConsulterModal && selectedUtilisateur && (
        <ModalConsulterUtilisateur
          utilisateur={selectedUtilisateur}
          onClose={() => setShowConsulterModal(false)}
          onModifierRole={isAdmin ? handleModifierRole : undefined}
          currentUserRole={currentUserRole}
        />
      )}
    </div>
  );
};

export default Utilisateurs;
