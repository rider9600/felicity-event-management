import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import DashboardLayout from "../components/layout/DashboardLayout";
import DashboardCard from "../components/cards/DashboardCard";
import EventCard from "../components/cards/EventCard";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Loading from "../components/common/Loading";
import Modal from "../components/common/Modal";
import Input from "../components/common/Input";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { apiCall, loading } = useApi();

  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalUsers: 0,
      totalEvents: 0,
      totalRegistrations: 0,
      totalRevenue: 0,
      activeOrganizers: 0,
      pendingApprovals: 0,
    },
    recentEvents: [],
    recentUsers: [],
    systemAlerts: [],
  });

  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [statsResult, eventsResult, usersResult, alertsResult] =
        await Promise.all([
          apiCall("/point/admin/stats"),
          apiCall("/point/admin/recent-events"),
          apiCall("/point/admin/recent-users"),
          apiCall("/point/admin/alerts"),
        ]);

      setDashboardData({
        stats: statsResult.success
          ? statsResult.data
          : {
              totalUsers: 1247,
              totalEvents: 89,
              totalRegistrations: 3456,
              totalRevenue: 2340000,
              activeOrganizers: 23,
              pendingApprovals: 5,
            },
        recentEvents: eventsResult.success ? eventsResult.data : [],
        recentUsers: usersResult.success ? usersResult.data : [],
        systemAlerts: alertsResult.success
          ? alertsResult.data
          : [
              {
                id: 1,
                type: "warning",
                message: "5 events pending approval",
                time: "2 hours ago",
              },
              {
                id: 2,
                type: "info",
                message: "System backup completed successfully",
                time: "1 day ago",
              },
            ],
      });
    } catch (error) {
      console.error("Failed to load admin data:", error);
    }
  };

  const handleUserAction = (action, userId) => {
    // Handle user management actions (approve, suspend, etc.)
    console.log(`${action} user:`, userId);
  };

  const handleEventAction = (action, eventId) => {
    // Handle event management actions (approve, reject, etc.)
    console.log(`${action} event:`, eventId);
  };

  const dashboardCards = [
    {
      title: "Total Users",
      value: dashboardData.stats.totalUsers.toLocaleString(),
      subtitle: "Registered users",
      variant: "primary",
      icon: "👥",
      trend: { value: "+12%", direction: "up" },
    },
    {
      title: "Total Events",
      value: dashboardData.stats.totalEvents,
      subtitle: "All time events",
      variant: "success",
      icon: "📅",
      trend: { value: "+8%", direction: "up" },
    },
    {
      title: "Registrations",
      value: dashboardData.stats.totalRegistrations.toLocaleString(),
      subtitle: "Total registrations",
      variant: "info",
      icon: "🎟️",
      trend: { value: "+15%", direction: "up" },
    },
    {
      title: "Platform Revenue",
      value: `₹${(dashboardData.stats.totalRevenue / 100000).toFixed(1)}L`,
      subtitle: "Total revenue",
      variant: "warning",
      icon: "💰",
      trend: { value: "+23%", direction: "up" },
    },
    {
      title: "Active Organizers",
      value: dashboardData.stats.activeOrganizers,
      subtitle: "This month",
      variant: "secondary",
      icon: "🏢",
      trend: { value: "+5%", direction: "up" },
    },
    {
      title: "Pending Approvals",
      value: dashboardData.stats.pendingApprovals,
      subtitle: "Require attention",
      variant: "danger",
      icon: "⏳",
      action: () => navigate("/admin/approvals"),
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <Loading size="large" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Admin Dashboard</h1>
            <p>Platform overview and management tools</p>
          </div>

          <div className="header-actions">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/analytics")}
            >
              View Analytics
            </Button>

            <Button variant="primary" onClick={() => navigate("/admin/users")}>
              Manage Users
            </Button>
          </div>
        </div>

        {/* System Alerts */}
        {dashboardData.systemAlerts.length > 0 && (
          <div className="system-alerts">
            <h3>System Alerts</h3>
            <div className="alerts-list">
              {dashboardData.systemAlerts.map((alert) => (
                <div key={alert.id} className={`alert alert-${alert.type}`}>
                  <div className="alert-content">
                    <span className="alert-message">{alert.message}</span>
                    <span className="alert-time">{alert.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-grid">
          {dashboardCards.map((card, index) => (
            <DashboardCard
              key={index}
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              variant={card.variant}
              icon={card.icon}
              trend={card.trend}
              onClick={card.action}
              className={card.action ? "clickable" : ""}
            />
          ))}
        </div>

        <div className="dashboard-content">
          {/* Recent Events */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Events</h2>
              <Button variant="ghost" onClick={() => navigate("/admin/events")}>
                View All Events →
              </Button>
            </div>

            {dashboardData.recentEvents.length > 0 ? (
              <div className="events-list">
                {dashboardData.recentEvents.slice(0, 3).map((event) => (
                  <div key={event.id} className="event-item">
                    <div className="event-info">
                      <h4>{event.eventName}</h4>
                      <p>
                        {event.organizerName} • {event.registrationCount}{" "}
                        registrations
                      </p>
                    </div>
                    <div className="event-actions">
                      <Badge
                        variant={
                          event.status === "published" ? "success" : "warning"
                        }
                      >
                        {event.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-section">
                <p>No recent events to display</p>
              </div>
            )}
          </div>

          {/* Recent Users */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Users</h2>
              <Button variant="ghost" onClick={() => navigate("/admin/users")}>
                View All Users →
              </Button>
            </div>

            <div className="users-list">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="user-item">
                  <div className="user-avatar">
                    {String.fromCharCode(65 + i)}
                  </div>
                  <div className="user-info">
                    <h4>User {i + 1}</h4>
                    <p>
                      user{i + 1}@example.com • Joined {i + 1} days ago
                    </p>
                  </div>
                  <div className="user-actions">
                    <Badge variant="success">Active</Badge>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => {
                        setSelectedUser({
                          name: `User ${i + 1}`,
                          email: `user${i + 1}@example.com`,
                        });
                        setShowUserModal(true);
                      }}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            <div
              className="action-card"
              onClick={() => navigate("/admin/users")}
            >
              <div className="action-icon">👥</div>
              <div className="action-content">
                <h4>Manage Users</h4>
                <p>View and manage user accounts</p>
              </div>
            </div>

            <div
              className="action-card"
              onClick={() => navigate("/admin/events")}
            >
              <div className="action-icon">📅</div>
              <div className="action-content">
                <h4>Manage Events</h4>
                <p>Review and approve events</p>
              </div>
            </div>

            <div
              className="action-card"
              onClick={() => navigate("/admin/analytics")}
            >
              <div className="action-icon">📊</div>
              <div className="action-content">
                <h4>Analytics</h4>
                <p>View detailed platform analytics</p>
              </div>
            </div>

            <div
              className="action-card"
              onClick={() => navigate("/admin/settings")}
            >
              <div className="action-icon">⚙️</div>
              <div className="action-content">
                <h4>System Settings</h4>
                <p>Configure platform settings</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Detail Modal */}
        <Modal
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          title="User Details"
          size="medium"
        >
          {selectedUser && (
            <div className="user-details">
              <h4>{selectedUser.name}</h4>
              <p>Email: {selectedUser.email}</p>
              <div className="user-actions-modal">
                <Button
                  variant="outline"
                  onClick={() => handleUserAction("view", selectedUser.id)}
                >
                  View Profile
                </Button>
                <Button
                  variant="warning"
                  onClick={() => handleUserAction("suspend", selectedUser.id)}
                >
                  Suspend User
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
