import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Eye,
  EyeOff,
  Moon,
  Sun
} from 'lucide-react';

import { loginUtilisateur } from '../api/auth-api';
import NotificationDialog from '../components/NotificationDialog';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    motDePasse: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Appel backend
      const response = await loginUtilisateur({
        emailOrUsername: formData.emailOrUsername,
        password: formData.motDePasse
      });

      // Stockage des infos utilisateur localement
      localStorage.setItem('user', JSON.stringify(response.user));

      setMessage({
        type: 'success',
        text: 'Connexion réussie ! Redirection vers le tableau de bord...'
      });

      // Redirection après 1,5s
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite';
      setMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closeMessage = () => {
    setMessage(null);
  };

  return (
    <div className="login-container">
      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === 'light' ? <Sun size={40} /> : <Moon size={40} />}
      </button>

      <div className="login-form-container">
        <div className="login-form">
          <h2 className="greeting">Bon retour !</h2>
          <p className="subtitle">Connectez-vous pour accéder à votre compte.</p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="emailOrUsername">Email ou nom d'utilisateur</label>
              <input
                type="text"
                id="emailOrUsername"
                name="emailOrUsername"
                value={formData.emailOrUsername}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="input-group">
              <label htmlFor="motDePasse">Mot de passe</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="motDePasse"
                  name="motDePasse"
                  value={formData.motDePasse}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>

      <NotificationDialog
        type={message?.type || 'error'}
        message={message?.text || ''}
        isVisible={message !== null}
        onClose={closeMessage}
        autoHideDelay={message?.type === 'success' ? 3000 : 0}
      />
    </div>
  );
};

export default Login;
