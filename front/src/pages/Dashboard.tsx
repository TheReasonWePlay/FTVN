import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

import {
  Package,
  AlertTriangle,
  ClipboardList,
  TrendingUp,
  Pin,
  Monitor
} from 'lucide-react';

import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
} from 'chart.js';

import '../styles/Dashboard.css';
import '../styles/tableau.css';
import '../styles/page.css';
import '../styles/modal.css';

import ErrorBoundary from '../components/ErrorBoundary';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

import { getDashboardStats, getRecentOperations, getMonthlyEvolution } from '../api/dashboard-api';
import type { MonthlyEvolutionData, RecentOperation } from '../api/dashboard-api';
import PageHeader from '../components/PageHeader';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title
);

interface DashboardData {
  totalMateriels: number;
  materielsByStatus: Record<string, number> | { statut: string; count: number }[];
  materielsByCategory: Record<string, number> | { categorie: string; count: number }[];
  newInventories: number;
  openIncidents: number;
  newAffectations: number;
  recentOperations: RecentOperation[];
  monthlyEvolution: MonthlyEvolutionData[];
}

interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}

const ALL_STATUSES = ['Disponible', 'Affecté', 'En panne', 'Hors service'];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const [breadcrumb, setBreadcrumb] = useState(['Accueil', 'Tableau de bord']);
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    data: null,
    loading: true,
    error: null
  });

  const fetchData = async () => {
    setDashboardState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [stats, operations, evolution] = await Promise.all([
        getDashboardStats(),
        getRecentOperations(),
        getMonthlyEvolution()
      ]);

      setDashboardState({
        data: {
          totalMateriels: stats.totalMateriels ?? 0,
          materielsByStatus: stats.materielsByStatus ?? {},
          materielsByCategory: stats.materielsByCategory ?? {},
          newInventories: stats.recentInventaires ?? 0,
          openIncidents: stats.openIncidents ?? 0,
          newAffectations: stats.recentAffectations ?? 0,
          recentOperations: operations ?? [],
          monthlyEvolution: evolution ?? []
        },
        loading: false,
        error: null
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setDashboardState({
        data: null,
        loading: false,
        error: 'Erreur lors du chargement des données du tableau de bord'
      });
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchData().then(() => { if (!isMounted) return; });
    return () => { isMounted = false; };
  }, []);

  const handleBackClick = () => {
    if (breadcrumb.length > 1) setBreadcrumb(breadcrumb.slice(0, -1));
    else fetchData();
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'disponible': return '#66b2ff';
      case 'affecté': return '#19b5a2';
      case 'en panne': return '#ffb66d';
      case 'hors service': return '#e65a62';
      default: return '#888888';
    }
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'affectation': return <Pin size={16} />;
      case 'incident': return <AlertTriangle size={16} />;
      case 'inventaire': return <ClipboardList size={16} />;
      default: return <Package size={16} />;
    }
  };

  const handleNavigateToMateriels = () => navigate('/equipment');
  const handleNavigateToIncidents = () => navigate('/incidents');
  const handleNavigateToInventaires = () => navigate('/inventories');
  const handleNavigateToAffectations = () => navigate('/affectations');

  if (dashboardState.loading)
    return <div className={`dashboard-container ${isDarkMode ? 'dark' : 'light'}`}><LoadingState message="Chargement du tableau de bord..." /></div>;

  if (dashboardState.error || !dashboardState.data)
    return <div className={`dashboard-container ${isDarkMode ? 'dark' : 'light'}`}><ErrorState message={dashboardState.error || "Aucune donnée disponible"} onRetry={fetchData} /></div>;

  const dashboardData = dashboardState.data;

  // Normaliser les statuts pour toujours avoir toutes les cartes
  const normalizedStatuses = ALL_STATUSES.map(status => {
    if (Array.isArray(dashboardData.materielsByStatus)) {
      const found = dashboardData.materielsByStatus.find(s => s.statut.toLowerCase() === status.toLowerCase());
      return { statut: status, count: found ? found.count : 0 };
    } else {
      return { statut: status, count: dashboardData.materielsByStatus[status] ?? 0 };
    }
  });

  // Donut chart data
  const donutData = {
    labels: normalizedStatuses.map(s => s.statut),
    datasets: [{
      data: normalizedStatuses.map(s => s.count),
      backgroundColor: normalizedStatuses.map(s => getStatusColor(s.statut)),
      borderWidth: 1,
    }],
  };

  // Bar chart data
  const barColors = [
    'var(--blue-highlight)', 'var(--green-highlight)', 'var(--orange-highlight)', 'var(--red-highlight)',
    'var(--purple-highlight)', 'var(--pink-highlight)', 'var(--teal-highlight)', 'var(--dark-blue-highlight)',
  ];

  const barData = {
    labels: Array.isArray(dashboardData.materielsByCategory)
      ? dashboardData.materielsByCategory.map(c => c.categorie)
      : Object.keys(dashboardData.materielsByCategory),
    datasets: [{
      label: 'Nombre de matériels',
      data: Array.isArray(dashboardData.materielsByCategory)
        ? dashboardData.materielsByCategory.map(c => c.count)
        : Object.values(dashboardData.materielsByCategory),
      backgroundColor: Array.isArray(dashboardData.materielsByCategory)
        ? dashboardData.materielsByCategory.map((_, i) => barColors[i % barColors.length])
        : Object.keys(dashboardData.materielsByCategory).map((_, i) => barColors[i % barColors.length]),
      borderWidth: 1,
    }],
  };

  // Line chart data
  const lineData = {
    labels: dashboardData.monthlyEvolution.map(d =>
      new Date(d.month + '-01').toLocaleDateString('fr-FR', { month: 'short' })
    ),
    datasets: [
      { label: 'Affectations', data: dashboardData.monthlyEvolution.map(d => d.affectations ?? 0), borderColor: '#10B981', backgroundColor: '#10B981', tension: 0.1 },
      { label: 'Incidents', data: dashboardData.monthlyEvolution.map(d => d.incidents ?? 0), borderColor: '#EF4444', backgroundColor: '#EF4444', tension: 0.1 },
      { label: 'Inventaires', data: dashboardData.monthlyEvolution.map(d => d.inventaires ?? 0), borderColor: '#0a577a', backgroundColor: '#0a577a', tension: 0.1 },
      { label: 'Ajout de matériels', data: dashboardData.monthlyEvolution.map(d => d.materiels ?? 0), borderColor: '#8B5CF6', backgroundColor: '#8B5CF6', tension: 0.1 },
    ],
  };

  const filteredRecentOperations = dashboardData.recentOperations.filter(op =>
    op.type !== 'incident' || op.status.toLowerCase() === 'ouvert'
  );

  return (
    <ErrorBoundary>
      <div className={`dashboard-container ${isDarkMode ? 'dark' : 'light'}`}>
        <PageHeader title='Tableau de bord' onBack={handleBackClick} />

        <main className="dashboard-content">

          {/* Info-Cards */}
          <section className="dashboard-section info-cards-section">
            <div className="info-cards">
              {/* Total Matériels */}
              <div className="info-card clickable main-card" onClick={handleNavigateToMateriels}>
                <div className="card-icon"><Package size={24} /></div>
                <div className="card-content">
                  <h3>Total Matériels</h3>
                  <p className="card-value">{dashboardData.totalMateriels}</p>
                </div>
              </div>

              {/* Cards par Status */}
              {normalizedStatuses.map(item => (
                <div key={item.statut} className="info-card clickable status-card" onClick={handleNavigateToMateriels}>
                  <div className="card-icon"><Monitor size={24} /></div>
                  <div className="card-content">
                    <h3>{item.statut}</h3>
                    <p className="card-value">{item.count}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Donut Chart */}
            <div className="chart-container donut-chart">
              <h3>Répartition par Statut</h3>
              <Doughnut data={donutData} options={{
                responsive: true,
                plugins: {
                  legend: { position: 'bottom' },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => {
                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        const percent = total > 0 ? ((ctx.parsed as number) / total * 100).toFixed(1) : '0.0';
                        return `${ctx.label}: ${percent}%`;
                      }
                    }
                  }
                }
              }} />
            </div>
          </section>

          {/* Bar & Line Charts */}
          <section className="dashboard-section charts-section">
            {/* Bar Chart par catégorie */}
            <div className="chart-container bar-chart">
              <h3>Matériels par Catégorie</h3>
              <Bar data={barData} options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
              }} />
            </div>

            {/* Line Chart */}
            <div className="chart-container line-chart">
              <h3>Évolution des Mouvements (6 derniers mois)</h3>
              {dashboardData.monthlyEvolution.length > 0 ? (
                <Line data={lineData} options={{
                  responsive: true,
                  plugins: { legend: { position: 'bottom' } },
                  scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }} />
              ) : (
                <div className="line-chart-placeholder">
                  <TrendingUp size={48} />
                  <p>Aucune donnée d'évolution disponible</p>
                  <small>Les données apparaîtront une fois que des opérations auront été enregistrées</small>
                </div>
              )}
            </div>
          </section>

          {/* Compteurs & Historique */}
          <section className="dashboard-section operations-section">
            <div className="operations-counters">
              <div className="counter-card clickable" onClick={handleNavigateToInventaires}>
                <div className="counter-icon"><ClipboardList size={24} /></div>
                <div className="counter-content">
                  <h4>Nouveaux Inventaires</h4>
                  <p className="counter-value">{dashboardData.newInventories}</p>
                </div>
              </div>

              <div className="counter-card clickable" onClick={handleNavigateToIncidents}>
                <div className="counter-icon"><AlertTriangle size={24} /></div>
                <div className="counter-content">
                  <h4>Incidents Ouverts</h4>
                  <p className="counter-value">{dashboardData.openIncidents}</p>
                </div>
              </div>

              <div className="counter-card clickable" onClick={handleNavigateToAffectations}>
                <div className="counter-icon"><Pin size={24} /></div>
                <div className="counter-content">
                  <h4>Nouvelles Affectations</h4>
                  <p className="counter-value">{dashboardData.newAffectations}</p>
                </div>
              </div>
            </div>

            <div className="recent-operations">
              <h3>Historique Récent des Opérations</h3>
              <div className="operations-list">
                {filteredRecentOperations.length > 0 ? filteredRecentOperations.map(op => (
                  <div key={op.id} className="operation-item">
                    <div className="operation-icon">{getOperationIcon(op.type)}</div>
                    <div className="operation-content">
                      <p className="operation-description">{op.description}</p>
                      <div className="operation-meta">
                        <span className="operation-date">{op.date}</span>
                        <span className={`operation-status ${op.status.toLowerCase()}`}>{op.status}</span>
                      </div>
                    </div>
                  </div>
                )) : <p>Aucune opération récente disponible</p>}
              </div>
            </div>
          </section>

        </main>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;