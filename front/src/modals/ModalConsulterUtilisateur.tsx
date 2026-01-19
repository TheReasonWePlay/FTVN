import React, { useState } from 'react';
import { X, Edit, Save, X as CancelIcon } from 'lucide-react';

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

interface ModalConsulterUtilisateurProps {
  utilisateur: Utilisateur;
  onClose: () => void;
  onModifierRole?: (utilisateur: Utilisateur) => void;
  currentUserRole: string;
}

const ModalConsulterUtilisateur: React.FC<ModalConsulterUtilisateurProps> = ({
  utilisateur,
  onClose,
  onModifierRole,
  currentUserRole
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    nom: utilisateur.nom || '',
    prenom: utilisateur.prenom || '',
    email: utilisateur.email || '',
    poste: utilisateur.poste || '',
    projet: utilisateur.projet || '',
    nomUser: utilisateur.nomUser
  });

  const handleInputChange = (field: string, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // In real app, call update API
    console.log('Sauvegarder les modifications:', editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      nom: utilisateur.nom || '',
      prenom: utilisateur.prenom || '',
      email: utilisateur.email || '',
      poste: utilisateur.poste || '',
      projet: utilisateur.projet || '',
      nomUser: utilisateur.nomUser
    });
    setIsEditing(false);
  };

  const isAdmin = currentUserRole === 'Administrateur';
  const canEditOwnInfo = utilisateur.matricule === 'current-user-matricule'; // Mock check

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content consulter-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Détails de l'Utilisateur - {utilisateur.matricule}</h2>
          <button className="close-button" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="user-details">
            <div className="detail-section">
              <h3>Informations Personnelles</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Matricule</label>
                  <span>{utilisateur.matricule}</span>
                </div>
                <div className="detail-item">
                  <label>Nom</label>
                  {isEditing && (isAdmin || canEditOwnInfo) ? (
                    <input
                      type="text"
                      value={editData.nom}
                      onChange={(e) => handleInputChange('nom', e.target.value)}
                    />
                  ) : (
                    <span>{utilisateur.nom || '-'}</span>
                  )}
                </div>
                <div className="detail-item">
                  <label>Prénom</label>
                  {isEditing && (isAdmin || canEditOwnInfo) ? (
                    <input
                      type="text"
                      value={editData.prenom}
                      onChange={(e) => handleInputChange('prenom', e.target.value)}
                      placeholder="Prénom"
                    />
                  ) : (
                    <span>{utilisateur.prenom || '-'}</span>
                  )}
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  {isEditing && (isAdmin || canEditOwnInfo) ? (
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Email"
                    />
                  ) : (
                    <span>{utilisateur.email || '-'}</span>
                  )}
                </div>
                <div className="detail-item">
                  <label>Poste</label>
                  {isEditing && (isAdmin || canEditOwnInfo) ? (
                    <input
                      type="text"
                      value={editData.poste}
                      onChange={(e) => handleInputChange('poste', e.target.value)}
                      placeholder="Poste"
                    />
                  ) : (
                    <span>{utilisateur.poste || '-'}</span>
                  )}
                </div>
                <div className="detail-item">
                  <label>Projet</label>
                  {isEditing && (isAdmin || canEditOwnInfo) ? (
                    <input
                      type="text"
                      value={editData.projet}
                      onChange={(e) => handleInputChange('projet', e.target.value)}
                      placeholder="Projet"
                    />
                  ) : (
                    <span>{utilisateur.projet || '-'}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>Informations de Connexion</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Nom d'utilisateur</label>
                  {isEditing && canEditOwnInfo ? (
                    <input
                      type="text"
                      value={editData.nomUser}
                      onChange={(e) => handleInputChange('nomUser', e.target.value)}
                      placeholder="Nom d'utilisateur"
                    />
                  ) : (
                    <span>{utilisateur.nomUser}</span>
                  )}
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
                        <Edit size={12} />
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
          {(isAdmin || canEditOwnInfo) && (
            <>
              {isEditing ? (
                <>
                  <button type="button" className="cancel-edit-button" onClick={handleCancel}>
                    <CancelIcon size={16} />
                    Annuler
                  </button>
                  <button type="button" className="submit-button" onClick={handleSave}>
                    <Save size={16} />
                    Sauvegarder
                  </button>
                </>
              ) : (
                <button type="button" className="edit-button" onClick={() => setIsEditing(true)}>
                  <Edit size={16} />
                  Modifier
                </button>
              )}
            </>
          )}
          <button type="button" className="cancel-button" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConsulterUtilisateur;
