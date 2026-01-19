import React, { useState } from 'react';
import { X } from 'lucide-react';

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

interface ModalAjouterUtilisateurProps {
  onClose: () => void;
  onConfirm: (data: Omit<Utilisateur, 'matricule'>) => void;
}

const ModalAjouterUtilisateur: React.FC<ModalAjouterUtilisateurProps> = ({
  onClose,
  onConfirm
}) => {
  const [formData, setFormData] = useState({
    matricule: '',
    nom: '',
    prenom: '',
    email: '',
    poste: '',
    projet: '',
    nomUser: '',
    role: 'Responsable'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation basique
    if (!formData.matricule || !formData.nomUser || !formData.nom || !formData.prenom || !formData.email) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    onConfirm(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Ajouter un Utilisateur</h2>
          <button className="close-button" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-section">
              <h3>Informations Personnelles</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="matricule">Matricule *</label>
                  <input
                    type="text"
                    id="matricule"
                    value={formData.matricule}
                    onChange={(e) => handleInputChange('matricule', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="nom">Nom *</label>
                  <input
                    type="text"
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => handleInputChange('nom', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="prenom">Prénom *</label>
                  <input
                    type="text"
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => handleInputChange('prenom', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="poste">Poste</label>
                  <input
                    type="text"
                    id="poste"
                    value={formData.poste}
                    onChange={(e) => handleInputChange('poste', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="projet">Projet</label>
                  <input
                    type="text"
                    id="projet"
                    value={formData.projet}
                    onChange={(e) => handleInputChange('projet', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Informations de Connexion</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="nomUser">Nom d'utilisateur *</label>
                  <input
                    type="text"
                    id="nomUser"
                    value={formData.nomUser}
                    onChange={(e) => handleInputChange('nomUser', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="role">Rôle</label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                  >
                    <option value="Utilisateur">Utilisateur</option>
                    <option value="Administrateur">Administrateur</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-button" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="submit-button">
              Ajouter l'Utilisateur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalAjouterUtilisateur;
