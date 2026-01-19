import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import {
    Menu,
    ChevronRight,
    LayoutDashboard,
    Monitor,
    Pin,
    AlertTriangle,
    ClipboardList,
    Bolt,
    MapPin,
    Building,
    Users,
    User,
    IdCardLanyard,
    Moon,
    Sun,
    LogOut,
    X,
    Save,
    Eye,
    EyeOff,
    Mail,
    Briefcase,
    FolderOpen
} from "lucide-react";

import {
    getUserRole,
    getUserName,
    getUserPrenom,
    getUtilisateurByMatricule,
    updateUtilisateur
} from "../api/utilisateur-api";
import {
    logoutUtilisateur
} from "../api/auth-api";
import { useToast } from "../hooks/useToast";

import { useTheme } from "../contexts/ThemeContext";
import './sideBar.css';

interface SidebarProps {
    onToggle?: (expanded: boolean) => void;
}

interface Utilisateur {
    matricule: string;
    nomUser: string;
    nom?: string;
    prenom?: string;
    email?: string;
    poste?: string;
    projet?: string;
    role: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onToggle }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<Utilisateur | null>(null);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        poste: '',
        projet: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const { showError, showSuccess } = useToast();

    const userRole = getUserRole();
    const userPrenom = getUserPrenom();
    const userName = getUserName();

    const handleLogout = async () => {
        try {
            await logoutUtilisateur();
            navigate('/');
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            navigate('/');
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveProfile = async () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            // Validate password change if provided
            if (formData.newPassword) {
                if (!formData.currentPassword) {
                    showError('Veuillez saisir votre mot de passe actuel');
                    setLoading(false);
                    return;
                }
                if (formData.newPassword !== formData.confirmPassword) {
                    showError('Les nouveaux mots de passe ne correspondent pas');
                    setLoading(false);
                    return;
                }
                if (formData.newPassword.length < 6) {
                    showError('Le nouveau mot de passe doit contenir au moins 6 caractères');
                    setLoading(false);
                    return;
                }
            }

            const updateData: Partial<{ matricule: string; nomUser: string; nom?: string; prenom?: string; email?: string; poste?: string; projet?: string; role: string; motDePasse?: string; currentPassword?: string }> = {
                nom: formData.nom,
                prenom: formData.prenom,
                email: formData.email,
                poste: formData.poste,
                projet: formData.projet
            };

            if (formData.newPassword) {
                updateData.motDePasse = formData.newPassword;
                updateData.currentPassword = formData.currentPassword;
            }

            await updateUtilisateur(currentUser.matricule, updateData);

            // Update localStorage with new data
            const updatedUser = { ...currentUser, ...updateData };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            showSuccess('Profil mis à jour avec succès');
            setProfileModalOpen(false);
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            showError('Erreur lors de la mise à jour du profil');
        } finally {
            setLoading(false);
        }
    };

    const toggleSidebar = () => {
        const newCollapsed = !isCollapsed;
        setIsCollapsed(newCollapsed);
        if (onToggle) {
            onToggle(!newCollapsed);
        }
    };

    useEffect(() => {
        if (onToggle) {
            onToggle(!isCollapsed);
        }
    }, [isCollapsed, onToggle]);

    // Load user data when modal opens
    useEffect(() => {
        if (profileModalOpen) {
            const loadUserData = async () => {
                try {
                    const user = localStorage.getItem('user');
                    if (user) {
                        const parsedUser = JSON.parse(user);
                        const userData = await getUtilisateurByMatricule(parsedUser.matricule);
                        setCurrentUser(userData);
                        setFormData({
                            nom: userData.nom || '',
                            prenom: userData.prenom || '',
                            email: userData.email || '',
                            poste: userData.poste || '',
                            projet: userData.projet || '',
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                        });
                    }
                } catch (error) {
                    console.error('Erreur lors du chargement des données utilisateur:', error);
                    showError('Erreur lors du chargement des données');
                }
            };
            loadUserData();
        }
    }, [profileModalOpen, showError]);

    // Role-based navigation items
    const getNavigationItems = () => {
        const isAdmin = userRole?.toLowerCase() === 'administrateur' || userRole?.toLowerCase() === 'admin';

        const items = [
            { path: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
            { path: "/equipment", label: "Matériels", icon: Monitor },
            { path: "/affectations", label: "Affectations", icon: Pin },
            { path: "/inventory", label: "Inventaires", icon: ClipboardList },
            { path: "/incidents", label: "Incidents", icon: AlertTriangle },
        ];

        if (isAdmin) {
            items.push({ path: "/utilisateurs", label: "Utilisateurs", icon: Users });
        }

        return items;
    };

    const settingsItems = [
        { path: "/rooms", label: "Salles", icon: Building },
        { path: "/positions", label: "Positions", icon: MapPin },
        { path: "/personnes", label: "Personnels", icon: IdCardLanyard },
        //{ action: "profile", label: "Profil Utilisateur", icon: User },
    ];

    const navigationItems = getNavigationItems();

    return (
        <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
            {/* Header */}
            <div className="sidebar-header">
                {!isCollapsed && <h2 className="sidebar-logo">TrackIT</h2>}
                <button className="sidebar-toggle-btn" onClick={toggleSidebar} title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
                    <Menu size={24} />
                </button>
            </div>

            {/* Navigation Section */}
            <nav className="sidebar-nav">
                <ul className="nav-list">
                    {navigationItems.map((item) => (
                        <li key={item.path} className={`nav-item ${location.pathname === item.path ? "active" : ""}`}>
                            <Link to={item.path} className="nav-link" title={item.label}>
                                <item.icon size={20} />
                                {!isCollapsed && <span className="nav-label">{item.label}</span>}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Settings Section */}
            <div className="sidebar-settings">
                <button
                    className={`settings-toggle ${settingsOpen ? "open" : ""}`}
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    title="Paramètres"
                >
                    <Bolt size={20} />
                    {!isCollapsed && (
                        <>
                            <span className="nav-label">Structure</span>
                            <ChevronRight size={16} className="settings-chevron" />
                        </>
                    )}
                </button>
                {settingsOpen && (
                    <ul className="settings-submenu">
                        {settingsItems.map((item) => (
                            <li key={item.path} className={`nav-item ${location.pathname === item.path ? "active" : ""}`}>
                                <Link to={item.path} className="nav-link" title={item.label}>
                                    <item.icon size={18} />
                                    {!isCollapsed && <span className="nav-label">{item.label}</span>}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Footer */}
            <div className="sidebar-footer">
                {/* Theme Switch */}
                <button
                    className="theme-switch-btn"
                    onClick={toggleTheme}
                    title="Changer le thème"
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    {!isCollapsed && (
                        <span className="nav-label">
                            {theme === 'light' ? 'Mode sombre' : 'Mode clair'}
                        </span>
                    )}
                </button>

                {/* Separator */}
                <div className="sidebar-separator"></div>

                {/* User Profile */}
                <div className="user-profile-section">
                    <button
                        className={`user-profile-btn ${userMenuOpen ? "open" : ""}`}
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        title="Profil utilisateur"
                    >
                        <User size={20} />
                        {!isCollapsed && (
                            <div className="user-info">
                                <span className="user-fullname">{userPrenom} {userName}</span>
                                <span className="user-username">{userRole}</span>
                            </div>
                        )}
                        {!isCollapsed && <ChevronRight size={16} className="user-chevron" />}
                    </button>
                    {userMenuOpen && (
                        <ul className="user-submenu">
                            <li>
                                <button
                                    className="user-submenu-link"
                                    onClick={() => {
                                        setProfileModalOpen(true);
                                        setUserMenuOpen(false);
                                    }}
                                >
                                    <User size={18} />
                                    {!isCollapsed && <span>Profil</span>}
                                </button>
                            </li>
                            <li>
                                <button className="user-submenu-link logout-link" onClick={handleLogout}>
                                    <LogOut size={18} />
                                    {!isCollapsed && <span>Se déconnecter</span>}
                                </button>
                            </li>
                        </ul>
                    )}
                </div>
            </div>

            {/* Profile Edit Modal */}
            {profileModalOpen && (
                <div className="modal-overlay" onClick={() => setProfileModalOpen(false)}>
                    <div className="modal-content edit-profile-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Modifier le Profil</h2>
                            <button className="close-button" onClick={() => setProfileModalOpen(false)} aria-label="Fermer">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="profile-edit-form">
                                {/* Personal Information Section */}
                                <div className="form-section">
                                    <h3>Informations Personnelles</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label htmlFor="nom">
                                                <User size={16} />
                                                Nom
                                            </label>
                                            <input
                                                id="nom"
                                                type="text"
                                                value={formData.nom}
                                                onChange={(e) => handleInputChange('nom', e.target.value)}
                                                placeholder="Votre nom"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="prenom">
                                                <User size={16} />
                                                Prénom
                                            </label>
                                            <input
                                                id="prenom"
                                                type="text"
                                                value={formData.prenom}
                                                onChange={(e) => handleInputChange('prenom', e.target.value)}
                                                placeholder="Votre prénom"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="email">
                                                <Mail size={16} />
                                                Email
                                            </label>
                                            <input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                placeholder="votre.email@exemple.com"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="poste">
                                                <Briefcase size={16} />
                                                Poste
                                            </label>
                                            <input
                                                id="poste"
                                                type="text"
                                                value={formData.poste}
                                                onChange={(e) => handleInputChange('poste', e.target.value)}
                                                placeholder="Votre poste"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="projet">
                                                <FolderOpen size={16} />
                                                Projet
                                            </label>
                                            <input
                                                id="projet"
                                                type="text"
                                                value={formData.projet}
                                                onChange={(e) => handleInputChange('projet', e.target.value)}
                                                placeholder="Votre projet"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Password Change Section */}
                                <div className="form-section">
                                    <h3>Changer le Mot de Passe</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label htmlFor="currentPassword">Mot de passe actuel</label>
                                            <div className="password-input">
                                                <input
                                                    id="currentPassword"
                                                    type={showPassword ? "text" : "password"}
                                                    value={formData.currentPassword}
                                                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                                                    placeholder="Saisir le mot de passe actuel"
                                                />
                                                <button
                                                    type="button"
                                                    className="password-toggle"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="newPassword">Nouveau mot de passe</label>
                                            <input
                                                id="newPassword"
                                                type="password"
                                                value={formData.newPassword}
                                                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                                                placeholder="Nouveau mot de passe"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                                            <input
                                                id="confirmPassword"
                                                type="password"
                                                value={formData.confirmPassword}
                                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                                placeholder="Confirmer le nouveau mot de passe"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="cancel-button"
                                onClick={() => setProfileModalOpen(false)}
                                disabled={loading}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                className="submit-button"
                                onClick={handleSaveProfile}
                                disabled={loading}
                            >
                                <Save size={16} />
                                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
