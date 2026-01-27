import React, { useState, useEffect, useMemo, useRef } from 'react';

import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  X
} from 'lucide-react';

import {
  getAllPersonnes,
  createPersonne,
  deletePersonne,
  importPersonne,
} from '../api/personne-api';
import { getAllMateriels } from '../api/materiel-api';
import { getAllAffectations } from '../api/affectation-api';
import { useTheme } from '../contexts/ThemeContext';
import PageHeader from '../components/PageHeader';

import '../styles/Personnels.css';
import '../styles/page.css';
import '../styles/tableau.css';
import '../styles/modal.css';

interface Personne {
  matricule: string;
  nom: string;
  prenom: string;
  tel: string;
  email: string;
  poste: string;
  projet: string;
}

interface Materiel {
  numSerie: string;
  marque: string;
  modele: string;
  status: string;
  categorie: string;
  dateAjout: string;
  refAffectation: string;
}

interface Affectation {
  refAffectation: string;
  matricule: string;
  numSerie: string;
  dateAffectation: string;
  status: string;
}

interface AffectationFromAPI {
  refAffectation: number;
  matricule: string;
  refPosition: string;
  dateDebut: string;
  dateFin: string;
  dateOut?: string;
  status: 'Active' | 'Closed';
  user?: string;
}

interface PersonneData {
  nom: string;
  prenom: string;
  tel: string;
  email: string;
  poste: string;
  projet: string;
}

interface ModalAjouterPersonneProps {
  onClose: () => void;
  onSubmit: (personneData: PersonneData) => void;
}

interface ModalConsulterPersonneProps {
  personne: Personne;
  materielsAssigned: Affectation[];
  onClose: () => void;
  onEdit: (personne: Personne) => void;
  onDelete: (matricule: string) => void;
  onAffecter: (personne: Personne) => void;
}

interface SelectedMateriel {
  numSerie: string;
  categorie: string;
}

interface ModalAffecterMaterielProps {
  personne: Personne;
  availableMateriels: Materiel[];
  onClose: () => void;
  onSubmit: () => void;
}

const ModalAjouterPersonne: React.FC<ModalAjouterPersonneProps> = ({
  onClose,
  onSubmit
}) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<PersonneData>({
    nom: '',
    prenom: '',
    tel: '',
    email: '',
    poste: '',
    projet: ''
  });

  const [errors, setErrors] = useState<Partial<PersonneData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof PersonneData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<PersonneData> = {};
    if (!formData.nom.trim()) newErrors.nom = 'Nom est requis';
    if (!formData.prenom.trim()) newErrors.prenom = 'Prénom est requis';
    if (!formData.email.trim()) newErrors.email = 'Email est requis';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide';
    if (!formData.poste) newErrors.poste = 'Poste est requis';
    if (!formData.projet) newErrors.projet = 'Projet est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sample data for dropdowns - in a real app, this would come from API
  const postes = [
    'Développeur',
    'Chef de projet',
    'Designer',
    'Analyste',
    'Testeur',
    'Administrateur système',
    'Support technique'
  ];

  const projets = [
    'Projet A',
    'Projet B',
    'Projet C',
    'Projet D',
    'Projet E'
  ];

  return (
    <div className="modal-overlay">
      <div className={`modal-content ${theme}`}>
        <div className="modal-header">
          <h2>Ajouter une personne</h2>
          <button className="close-btn" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="nom">Nom *</label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                className={errors.nom ? 'error' : ''}
                placeholder="Entrez le nom"
              />
              {errors.nom && <span className="error-message">{errors.nom}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="prenom">Prénom *</label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                value={formData.prenom}
                onChange={handleInputChange}
                className={errors.prenom ? 'error' : ''}
                placeholder="Entrez le prénom"
              />
              {errors.prenom && <span className="error-message">{errors.prenom}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? 'error' : ''}
                placeholder="Entrez l'email"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="tel">Téléphone</label>
              <input
                type="tel"
                id="tel"
                name="tel"
                value={formData.tel}
                onChange={handleInputChange}
                placeholder="Entrez le numéro de téléphone"
              />
            </div>

            <div className="form-group">
              <label htmlFor="poste">Poste *</label>
              <select
                id="poste"
                name="poste"
                value={formData.poste}
                onChange={handleInputChange}
                className={errors.poste ? 'error' : ''}
              >
                <option value="">Sélectionnez un poste</option>
                {postes.map(poste => (
                  <option key={poste} value={poste}>{poste}</option>
                ))}
              </select>
              {errors.poste && <span className="error-message">{errors.poste}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="projet">Projet *</label>
              <select
                id="projet"
                name="projet"
                value={formData.projet}
                onChange={handleInputChange}
                className={errors.projet ? 'error' : ''}
              >
                <option value="">Sélectionnez un projet</option>
                {projets.map(projet => (
                  <option key={projet} value={projet}>{projet}</option>
                ))}
              </select>
              {errors.projet && <span className="error-message">{errors.projet}</span>}
            </div>
          </div>

          <div className="modal-footer">
            <div className="action-buttons">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Annuler
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Ajout en cours...' : 'Ajouter la personne'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const ModalConsulterPersonne: React.FC<ModalConsulterPersonneProps> = ({
  personne,
  materielsAssigned,
  onClose,
  onEdit,
  onDelete,
  onAffecter
}) => {
  const { theme } = useTheme();
  return (
    <div className="modal-overlay">
      <div className={`modal-content large ${theme}`}>
        <div className="modal-header">
          <h2>Détails de la personne</h2>
          <button className="close-button" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Personne Information */}
          <div className="detail-section">
            <h3>Informations personnelles</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Matricule</label>
                <span>{personne.matricule}</span>
              </div>
              <div className="detail-item">
                <label>Nom</label>
                <span>{personne.nom}</span>
              </div>
              <div className="detail-item">
                <label>Prénom</label>
                <span>{personne.prenom}</span>
              </div>
              <div className="detail-item">
                <label>Email</label>
                <span>{personne.email}</span>
              </div>
              <div className="detail-item">
                <label>Téléphone</label>
                <span>{personne.tel || 'Non spécifié'}</span>
              </div>
              <div className="detail-item">
                <label>Poste</label>
                <span>{personne.poste}</span>
              </div>
              <div className="detail-item">
                <label>Projet</label>
                <span>{personne.projet}</span>
              </div>
            </div>
          </div>

          {/* Assigned Materiels */}
          <div className="detail-section">
            <h3>Matériels assignés ({materielsAssigned.length})</h3>
            {materielsAssigned.length > 0 ? (
              <div className="materiels-list">
                {materielsAssigned.map((affectation) => (
                  <div key={affectation.refAffectation} className="materiel-item">
                    <div className="materiel-info">
                      <div className="materiel-ref">
                        <strong>{affectation.numSerie}</strong>
                      </div>
                      <div className="materiel-details">
                        <span>Date d'affectation: {new Date(affectation.dateAffectation).toLocaleDateString('fr-FR')}</span>
                        <span>Statut: <span className={`status ${affectation.status.toLowerCase()}`}>{affectation.status}</span></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <p>Aucun matériel assigné à cette personne.</p>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="cancel-button" onClick={onClose}>
            Fermer
          </button>
          <button
            type="button"
            className="submit-button"
            onClick={() => onAffecter(personne)}
          >
            <UserPlus size={16} />
            Affecter du matériel
          </button>
          <button
            type="button"
            className="edit-button"
            onClick={() => onEdit(personne)}
          >
            <Edit size={16} />
            Modifier
          </button>
          <button
            type="button"
            className="delete-button"
            onClick={() => onDelete(personne.matricule)}
          >
            <Trash2 size={16} />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

const ModalAffecterMateriel: React.FC<ModalAffecterMaterielProps> = ({
  personne,
  availableMateriels,
  onClose,
  onSubmit
}) => {
  const { theme } = useTheme();
  const [selectedMateriels, setSelectedMateriels] = useState<SelectedMateriel[]>([
    { numSerie: '', categorie: '' }
  ]);
  const [categorieFilter, setCategorieFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get unique categories from available matériels
  const uniqueCategories = useMemo(() => {
    return [...new Set(availableMateriels.map(m => m.categorie))];
  }, [availableMateriels]);

  // Filter matériels by selected category
  const filteredMateriels = useMemo(() => {
    if (!categorieFilter) return availableMateriels;
    return availableMateriels.filter(m => m.categorie === categorieFilter);
  }, [availableMateriels, categorieFilter]);

  const handleMaterielChange = (index: number, field: keyof SelectedMateriel, value: string) => {
    const updatedMateriels = [...selectedMateriels];
    updatedMateriels[index] = {
      ...updatedMateriels[index],
      [field]: value
    };

    // If changing categorie, reset numSerie
    if (field === 'categorie') {
      updatedMateriels[index].numSerie = '';
    }

    setSelectedMateriels(updatedMateriels);
  };

  const addMaterielField = () => {
    setSelectedMateriels(prev => [...prev, { numSerie: '', categorie: '' }]);
  };

  const removeMaterielField = (index: number) => {
    if (selectedMateriels.length > 1) {
      setSelectedMateriels(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateForm = (): boolean => {
    return selectedMateriels.every(m => m.numSerie && m.categorie);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Here you would typically call an API to assign the matériels
      // For now, we'll just simulate the assignment
      console.log('Assigning matériels:', selectedMateriels, 'to personne:', personne.matricule);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      onSubmit();
    } catch (error) {
      console.error('Erreur lors de l\'affectation des matériels:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMaterielOptions = (categorie: string) => {
    return filteredMateriels
      .filter(m => m.categorie === categorie)
      .map(m => ({
        value: m.numSerie,
        label: `${m.numSerie} - ${m.marque} ${m.modele}`
      }));
  };

  return (
    <div className="modal-overlay">
      <div className={`modal-content form-modal ${theme}`}>
        <div className="modal-header">
          <h2>Affecter du matériel</h2>
          <button className="close-button" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Personne Info */}
            <div className="detail-section">
              <h3>Personne concernée</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Matricule</label>
                  <span>{personne.matricule}</span>
                </div>
                <div className="detail-item">
                  <label>Nom</label>
                  <span>{personne.nom} {personne.prenom}</span>
                </div>
                <div className="detail-item">
                  <label>Poste</label>
                  <span>{personne.poste}</span>
                </div>
                <div className="detail-item">
                  <label>Projet</label>
                  <span>{personne.projet}</span>
                </div>
              </div>
            </div>

            {/* Materiel Selection */}
            <div className="detail-section">
              <div className="detail-section">
                <h3>Matériels à affecter</h3>
                <button
                  type="button"
                  className="submit-button"
                  onClick={addMaterielField}
                  disabled={isSubmitting}
                >
                  <Plus size={16} />
                  Ajouter un matériel
                </button>
              </div>

              {/* Category Filter */}
              <div className="form-group">
                <label htmlFor="categorieFilter">Filtrer par catégorie</label>
                <select
                  id="categorieFilter"
                  value={categorieFilter}
                  onChange={(e) => setCategorieFilter(e.target.value)}
                >
                  <option value="">Toutes les catégories</option>
                  {uniqueCategories.map(categorie => (
                    <option key={categorie} value={categorie}>{categorie}</option>
                  ))}
                </select>
              </div>

              {/* Materiel Fields */}
              {selectedMateriels.map((selectedMateriel, index) => (
                <div key={index} className="materiel-field-group">
                  <div className="form-group">
                    <label htmlFor={`categorie-${index}`}>Catégorie *</label>
                    <select
                      id={`categorie-${index}`}
                      value={selectedMateriel.categorie}
                      onChange={(e) => handleMaterielChange(index, 'categorie', e.target.value)}
                      required
                    >
                      <option value="">Sélectionnez une catégorie</option>
                      {uniqueCategories.map(categorie => (
                        <option key={categorie} value={categorie}>{categorie}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor={`materiel-${index}`}>Matériel *</label>
                    <select
                      id={`materiel-${index}`}
                      value={selectedMateriel.numSerie}
                      onChange={(e) => handleMaterielChange(index, 'numSerie', e.target.value)}
                      required
                      disabled={!selectedMateriel.categorie}
                    >
                      <option value="">Sélectionnez un matériel</option>
                      {selectedMateriel.categorie && getMaterielOptions(selectedMateriel.categorie).map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedMateriels.length > 1 && (
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => removeMaterielField(index)}
                      disabled={isSubmitting}
                      aria-label="Supprimer ce champ"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}

              {availableMateriels.length === 0 && (
                <div className="no-data">
                  <p>Aucun matériel disponible pour l'affectation.</p>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-button" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting || !validateForm() || availableMateriels.length === 0}
            >
              {isSubmitting ? 'Affectation en cours...' : 'Confirmer l\'affectation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Personnels: React.FC = () => {
  const { theme } = useTheme();
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [posteFilter, setPosteFilter] = useState('');
  const [projetFilter, setProjetFilter] = useState('');
  const [sortField, setSortField] = useState<keyof Personne>('matricule');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [showAffecterModal, setShowAffecterModal] = useState(false);
  const [selectedPersonne, setSelectedPersonne] = useState<Personne | null>(null);
  const [affectationsByPersonne, setAffectationsByPersonne] = useState<Record<string, Affectation[]>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [personnesData, materielsData, affectationsData] = await Promise.all([
          getAllPersonnes(),
          getAllMateriels(),
          getAllAffectations()
        ]);

        setPersonnes(personnesData);
        setMateriels(materielsData);

        // Group affectations by personne matricule
        const affectationsMap: Record<string, Affectation[]> = {};
        (affectationsData as AffectationFromAPI[]).forEach((aff) => {
          if (!affectationsMap[aff.matricule]) {
            affectationsMap[aff.matricule] = [];
          }
          affectationsMap[aff.matricule].push({
            refAffectation: aff.refAffectation.toString(),
            matricule: aff.matricule,
            numSerie: aff.refPosition, // This might need adjustment based on actual API structure
            dateAffectation: aff.dateDebut,
            status: aff.status
          });
        });

        setAffectationsByPersonne(affectationsMap);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters and search
  const filteredPersonnes = useMemo(() => {
    return personnes.filter(personne => {
      const matchesSearch = searchTerm === '' ||
        personne.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
        personne.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        personne.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        personne.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPoste = posteFilter === '' || personne.poste === posteFilter;
      const matchesProjet = projetFilter === '' || personne.projet === projetFilter;

      return matchesSearch && matchesPoste && matchesProjet;
    });
  }, [personnes, searchTerm, posteFilter, projetFilter]);

  // Sort personnes
  const sortedPersonnes = useMemo(() => {
    return [...filteredPersonnes].sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredPersonnes, sortField, sortDirection]);

  const handleSort = (field: keyof Personne) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAddPersonne = async (personneData: Omit<Personne, 'matricule'>) => {
    try {
      await createPersonne(personneData);
      // Refresh data
      const personnesData = await getAllPersonnes();
      setPersonnes(personnesData);
      setShowAddModal(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la personne:', error);
    }
  };

  const handleConsultPersonne = (personne: Personne) => {
    setSelectedPersonne(personne);
    setShowConsultModal(true);
  };

  const handleEditPersonne = (personne: Personne) => {
    setSelectedPersonne(personne);
    // TODO: Implement edit modal
  };

  const handleDeletePersonne = async (matricule: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette personne ?')) {
      try {
        await deletePersonne(matricule);
        setPersonnes(prev => prev.filter(p => p.matricule !== matricule));
        setShowConsultModal(false);
      } catch (error) {
        console.error('Erreur lors de la suppression de la personne:', error);
      }
    }
  };

  const handleAffecterMateriel = (personne: Personne) => {
    setSelectedPersonne(personne);
    setShowAffecterModal(true);
  };

  // Get unique values for filters
  const uniquePostes = [...new Set(personnes.map(p => p.poste))];
  const uniqueProjets = [...new Set(personnes.map(p => p.projet))];

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (loading) {
    return (
      <div className="personnels-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des personnels...</p>
        </div>
      </div>
    );
  }

  // Ouvre la fenêtre de sélection
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Quand un fichier est sélectionné
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // (optionnel) validation côté front
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      alert("Veuillez sélectionner un fichier Excel");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await importPersonne(formData);
      const personnesData = await getAllPersonnes();
      setPersonnes(personnesData);
      alert("Import réussi !");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'import");
    } finally {
      // reset input pour pouvoir re-uploader le même fichier
      event.target.value = "";
    }
  };

  const handleBack = () => {
    // In real app, navigate back or to dashboard
    window.history.back();
  };

  return (
    <div className={`personnels-container ${theme}`}>
      {/* Header */}
      <PageHeader title="Personnels" onBack={handleBack} />

      {/* Search and Filters */}
      <section className="search-filters-section">
        <div className="search-filters">
          <div className="search-group">
            <div className="search-input-container">
              <Search size={16} />
              <input
                type="text"
                placeholder="Rechercher par matricule, nom, prénom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="filters">
            <select value={posteFilter} onChange={(e) => setPosteFilter(e.target.value)} aria-label="Filtrer par poste">
              <option value="">Tous les postes</option>
              {uniquePostes.map(poste => (
                <option key={poste} value={poste}>{poste}</option>
              ))}
            </select>

            <select value={projetFilter} onChange={(e) => setProjetFilter(e.target.value)} aria-label="Filtrer par projet">
              <option value="">Tous les projets</option>
              {uniqueProjets.map(projet => (
                <option key={projet} value={projet}>{projet}</option>
              ))}
            </select>

            {/* Input caché */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            <button className="add-button" onClick={handleButtonClick}>
              <Plus size={16} />
              Importer
            </button>

            <button className="add-button" onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              Ajouter une personne
            </button>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="table-section">
        <div className="table-container">
          <table className="personnels-table">
            <thead>
              <tr>
                <th className={sortField === 'matricule' ? 'sorted' : ''} onClick={() => handleSort('matricule')}>Matricule</th>
                <th className={sortField === 'nom' ? 'sorted' : ''} onClick={() => handleSort('nom')}>Nom</th>
                <th className={sortField === 'prenom' ? 'sorted' : ''} onClick={() => handleSort('prenom')}>Prénom</th>
                <th className={sortField === 'email' ? 'sorted' : ''} onClick={() => handleSort('email')}>Email</th>
                <th className={sortField === 'poste' ? 'sorted' : ''} onClick={() => handleSort('poste')}>Poste</th>
                <th className={sortField === 'projet' ? 'sorted' : ''} onClick={() => handleSort('projet')}>Projet</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedPersonnes.map((personne) => (
                <tr key={personne.matricule}>
                  <td>{personne.matricule}</td>
                  <td>{personne.nom}</td>
                  <td>{personne.prenom}</td>
                  <td>{personne.email}</td>
                  <td>{personne.poste}</td>
                  <td>{personne.projet}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn consulter" onClick={() => handleConsultPersonne(personne)} aria-label="Consulter">
                        <Eye size={14} />
                      </button>
                      <button className="action-btn edit" onClick={() => handleEditPersonne(personne)} aria-label="Modifier">
                        <Edit size={14} />
                      </button>
                      <button className="action-btn assign" onClick={() => handleAffecterMateriel(personne)} aria-label="Affecter du matériel">
                        <UserPlus size={14} />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDeletePersonne(personne.matricule)} aria-label="Supprimer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modals */}
      {showAddModal && <ModalAjouterPersonne onClose={() => setShowAddModal(false)} onSubmit={handleAddPersonne} />}

      {showConsultModal && selectedPersonne && (
        <ModalConsulterPersonne
          personne={selectedPersonne}
          materielsAssigned={affectationsByPersonne[selectedPersonne.matricule] || []}
          onClose={() => setShowConsultModal(false)}
          onEdit={handleEditPersonne}
          onDelete={handleDeletePersonne}
          onAffecter={handleAffecterMateriel}
        />
      )}

      {showAffecterModal && selectedPersonne && (
        <ModalAffecterMateriel
          personne={selectedPersonne}
          availableMateriels={materiels.filter(m => m.status === 'Disponible')}
          onClose={() => setShowAffecterModal(false)}
          onSubmit={async () => {
            // Refresh affectations data
            try {
              const affectationsData = await getAllAffectations();
              const affectationsMap: Record<string, Affectation[]> = {};
              (affectationsData as AffectationFromAPI[]).forEach((aff) => {
                if (!affectationsMap[aff.matricule]) affectationsMap[aff.matricule] = [];
                affectationsMap[aff.matricule].push({
                  refAffectation: aff.refAffectation.toString(),
                  matricule: aff.matricule,
                  numSerie: aff.refPosition,
                  dateAffectation: aff.dateDebut,
                  status: aff.status
                });
              });
              setAffectationsByPersonne(affectationsMap);
            } catch (error) {
              console.error('Erreur lors du rafraîchissement des affectations:', error);
            }
            setShowAffecterModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Personnels;
