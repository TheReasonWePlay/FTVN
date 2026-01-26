import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

import {
  Package,
  AlertTriangle,
  ClipboardList,
  BarChart3,
  PieChart,
  TrendingUp,
  Pin
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
  materielsByStatus: Record<string, number>;
  materielsByCategory: Record<string, number>;
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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const [breadcrumb, setBreadcrumb] = useState(['Accueil', 'Tableau de bord']);
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    data: {
      totalMateriels: 0,
      materielsByStatus: {},
      materielsByCategory: {},
      newInventories: 0,
      openIncidents: 0,
      newAffectations: 0,
      recentOperations: [],
      monthlyEvolution: []
    },
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

    fetchData().then(() => {
      if (!isMounted) return;
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleBackClick = () => {
    if (breadcrumb.length > 1) {
      const newBreadcrumb = breadcrumb.slice(0, -1);
      setBreadcrumb(newBreadcrumb);
    } else {
      // Refresh page if on main dashboard 
      fetchData();
    }
  };
//----test----commit-----
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

  const getStatusClass = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'disponible': return 'available';
      case 'affecté': return 'affected';
      case 'en panne': return 'repair';
      case 'hors service': return 'out-of-service';
      default: return 'unknown';
    }
  };

  const handleNavigateToMateriels = () => {
    navigate('/equipment');
  };

  const handleNavigateToIncidents = () => {
    navigate('/incidents');
  };

  const handleNavigateToInventaires = () => {
    navigate('/inventories');
  };

  const handleNavigateToAffectations = () => {
    navigate('/affectations');
  };

  if (dashboardState.loading) {
    return (
      <div className={`dashboard-container ${isDarkMode ? 'dark' : 'light'}`}>
        <LoadingState message="Chargement du tableau de bord..." />
      </div>
    );
  }

  if (dashboardState.error || !dashboardState.data) {
    return (
      <div className={`dashboard-container ${isDarkMode ? 'dark' : 'light'}`}>
        <ErrorState
          message={dashboardState.error || "Aucune donnée disponible"}
          onRetry={fetchData}
        />
      </div>
    );
  }

  const dashboardData = dashboardState.data;

  // Prepare chart data
  const donutData = {
    labels: Array.isArray(dashboardData.materielsByStatus)
      ? dashboardData.materielsByStatus.map(item => item.statut)
      : Object.keys(dashboardData.materielsByStatus),
    datasets: [{
      data: Array.isArray(dashboardData.materielsByStatus)
        ? dashboardData.materielsByStatus.map(item => item.count)
        : Object.values(dashboardData.materielsByStatus),
      backgroundColor: Array.isArray(dashboardData.materielsByStatus)
        ? dashboardData.materielsByStatus.map(item => getStatusColor(item.statut))
        : Object.keys(dashboardData.materielsByStatus).map(getStatusColor),
      borderWidth: 1,
    }],
  };

  const barData = {
    labels: Array.isArray(dashboardData.materielsByCategory)
      ? dashboardData.materielsByCategory.map(item => item.categorie)
      : Object.keys(dashboardData.materielsByCategory),
    datasets: [{
      label: 'Nombre de matériels',
      data: Array.isArray(dashboardData.materielsByCategory)
        ? dashboardData.materielsByCategory.map(item => item.count)
        : Object.values(dashboardData.materielsByCategory),
      backgroundColor: 'var(--element-bg)',
      borderWidth: 1,
    }],
  };

  const lineData = {
    labels: dashboardData.monthlyEvolution.map(d => new Date(d.month + '-01').toLocaleDateString('fr-FR', { month: 'short' })),
    datasets: [
      {
        label: 'Affectations',
        data: dashboardData.monthlyEvolution.map(d => d.affectations),
        borderColor: '#10B981',
        backgroundColor: '#10B981',
        tension: 0.1,
      },
      {
        label: 'Incidents',
        data: dashboardData.monthlyEvolution.map(d => d.incidents),
        borderColor: '#EF4444',
        backgroundColor: '#EF4444',
        tension: 0.1,
      },
      {
        label: 'Inventaires',
        data: dashboardData.monthlyEvolution.map(d => d.inventaires),
        borderColor: '#0a577a',
        backgroundColor: '#0a577a',
        tension: 0.1,
      },
      {
        label: 'Ajout de matériels',
        data: dashboardData.monthlyEvolution.map(d => d.materiels || 0),
        borderColor: '#8B5CF6',
        backgroundColor: '#8B5CF6',
        tension: 0.1,
      },
    ],
  };

  const filteredRecentOperations = dashboardData.recentOperations.filter(op =>
    op.type !== 'incident' || op.status.toLowerCase() === 'ouvert'
  );

  return (
    <ErrorBoundary>
      <div className={`dashboard-container ${isDarkMode ? 'dark' : 'light'}`}>
        {/* Header */}
        <PageHeader title='Tableau de bord' onBack={handleBackClick} />

        {/* Main Content */}
        <main className="dashboard-content">
          {/* Section 1: Info Cards and Donut Chart */}
          <section className="dashboard-section">
            <div className="info-cards">
              <div className="info-card clickable main-card" onClick={handleNavigateToMateriels}>
                <div className="card-icon">
                  <Package size={24} />
                </div>
                <div className="card-content">
                  <h3>Total Matériels</h3>
                  <p className="card-value">{dashboardData.totalMateriels}</p>
                </div>
              </div>

              <div className="info-card clickable count-card" onClick={handleNavigateToMateriels}>
                <div className="card-icon">
                  <BarChart3 size={24} />
                </div>
                <div className="card-content">
                  <h3>Par Statut</h3>
                  <div className="status-breakdown">
                    {Array.isArray(dashboardData.materielsByStatus)
                      ? dashboardData.materielsByStatus.map((item) => (
                          <div key={item.statut} className="status-item">
                            <span className={`status-dot ${getStatusClass(item.statut)}`}></span>
                            <span>{item.statut}: {item.count}</span>
                          </div>
                        ))
                      : Object.entries(dashboardData.materielsByStatus).map(([status, count]) => (
                          <div key={status} className="status-item">
                            <span className={`status-dot ${getStatusClass(status)}`}></span>
                            <span>{status}: {count}</span>
                          </div>
                        ))
                    }
                  </div>
                </div>
              </div>

              <div className="info-card clickable count-card" onClick={handleNavigateToMateriels}>
                <div className="card-icon">
                  <PieChart size={24} />
                </div>
                <div className="card-content">
                  <h3>Par Catégorie</h3>
                  <div className="category-breakdown">
                    {Array.isArray(dashboardData.materielsByCategory)
                      ? dashboardData.materielsByCategory.map((item) => (
                          <div key={item.categorie} className="category-item">
                            <span>{item.categorie}: {item.count}</span>
                          </div>
                        ))
                      : Object.entries(dashboardData.materielsByCategory).map(([category, count]) => (
                          <div key={category} className="category-item">
                            <span>{category}: {count}</span>
                          </div>
                        ))
                    }
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-container donut-chart">
              <h3>Répartition par Statut</h3>
              <Doughnut
                data={donutData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                          const percentage = total > 0 ? ((context.parsed as number) / total * 100).toFixed(1) : '0.0';
                          return `${context.label}: ${percentage}%`;
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </section>

          {/* Section 2: Bar Chart and Line Chart */}
          <section className="dashboard-section">
            <div className="chart-container bar-chart">
              <h3>Matériels par Catégorie</h3>
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.label}: ${context.parsed.y}`,
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                }}
              />
            </div>

            <div className="chart-container line-chart">
              <h3>Évolution des Mouvements (6 derniers mois)</h3>
              {dashboardData.monthlyEvolution.length > 0 ? (
                <Line
                  data={lineData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.dataset.label}: ${context.parsed.y}`,
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="line-chart-placeholder">
                  <TrendingUp size={48} />
                  <p>Aucune donnée d'évolution disponible</p>
                  <small>Les données apparaîtront une fois que des opérations auront été enregistrées</small>
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Critical Operations and Recent History */}
          <section className="dashboard-section">
            <div className="operations-counters">
              <div className="counter-card clickable" onClick={handleNavigateToInventaires}>
                <div className="counter-icon">
                  <ClipboardList size={24} />
                </div>
                <div className="counter-content">
                  <h4>Nouveaux Inventaires</h4>
                  <p className="counter-value">{dashboardData.newInventories}</p>
                </div>
              </div>

              <div className="counter-card clickable" onClick={handleNavigateToIncidents}>
                <div className="counter-icon">
                  <AlertTriangle size={24} />
                </div>
                <div className="counter-content">
                  <h4>Incidents Ouverts</h4>
                  <p className="counter-value">{dashboardData.openIncidents}</p>
                </div>
              </div>

              <div className="counter-card clickable" onClick={handleNavigateToAffectations}>
                <div className="counter-icon">
                  <Pin size={24} />
                </div>
                <div className="counter-content">
                  <h4>Nouvelles Affectations</h4>
                  <p className="counter-value">{dashboardData.newAffectations}</p>
                </div>
              </div>
            </div>

            <div className="recent-operations">
              <h3>Historique Récent des Opérations</h3>
              <div className="operations-list">
                {filteredRecentOperations.length > 0 ? (
                  filteredRecentOperations.map((operation) => (
                    // Fix: Use string id for React key as per API
                    <div key={operation.id} className="operation-item">
                      <div className="operation-icon">
                        {getOperationIcon(operation.type)}
                      </div>
                      <div className="operation-content">
                        <p className="operation-description">{operation.description}</p>
                        <div className="operation-meta">
                          <span className="operation-date">{operation.date}</span>
                          <span className={`operation-status ${operation.status.toLowerCase()}`}>
                            {operation.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>Aucune opération récente disponible</p>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
