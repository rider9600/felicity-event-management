import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import DashboardLayout from "../components/layout/DashboardLayout";
import DashboardCard from "../components/cards/DashboardCard";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Loading from "../components/common/Loading";
import Badge from "../components/common/Badge";
import "./Analytics.css";

const Analytics = () => {
  const { user } = useAuth();
  const { apiCall, loading } = useApi();

  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    eventMetrics: [],
    organizerMetrics: [],
    userMetrics: {},
    revenueData: {},
    periodData: [],
  });

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    try {
      const endpoint =
        user?.role === "admin"
          ? "/point/admin-analytics"
          : "/point/organizer-analytics";

      const result = await apiCall(
        `${endpoint}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
      );

      if (result.success) {
        setAnalyticsData({
          overview: result.data.overview || {},
          eventMetrics: result.data.eventMetrics || [],
          organizerMetrics: result.data.organizerMetrics || [],
          userMetrics: result.data.userMetrics || {},
          revenueData: result.data.revenueData || {},
          periodData: result.data.periodData || [],
        });
      } else {
        console.error("Analytics API failed:", result.error);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
  };

  const exportData = async () => {
    try {
      const result = await apiCall("/point/analytics/export", {
        method: "POST",
        body: JSON.stringify(dateRange),
      });

      if (result.success) {
        // Handle file download
        console.log("Export successful");
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const overviewCards = [
    {
      title: user?.role === "admin" ? "Total Platform Events" : "Your Events",
      value: analyticsData.overview.totalEvents || 0,
      subtitle: "In selected period",
      variant: "primary",
      icon: "📅",
      trend: { value: "+12%", direction: "up" },
    },
    {
      title: "Total Registrations",
      value: (analyticsData.overview.totalRegistrations || 0).toLocaleString(),
      subtitle: "Event sign-ups",
      variant: "success",
      icon: "👥",
      trend: { value: "+18%", direction: "up" },
    },
    {
      title: "Revenue Generated",
      value: `₹${((analyticsData.overview.totalRevenue || 0) / 100000).toFixed(1)}L`,
      subtitle: "Registration fees",
      variant: "warning",
      icon: "💰",
      trend: { value: "+15%", direction: "up" },
    },
    {
      title: "Average Event Size",
      value: (analyticsData.overview.averageEventSize || 0).toFixed(1),
      subtitle: "Registrations per event",
      variant: "info",
      icon: "📊",
      trend: { value: "+5%", direction: "up" },
    },
  ];

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "events", label: "Events", icon: "📅" },
    ...(user?.role === "admin"
      ? [{ id: "organizers", label: "Organizers", icon: "🏢" }]
      : []),
    { id: "users", label: "Users", icon: "👥" },
    { id: "revenue", label: "Revenue", icon: "💰" },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <Loading size="large" />
      </DashboardLayout>
    );
  }

  const renderOverview = () => (
    <div className="analytics-overview">
      <div className="stats-grid">
        {overviewCards.map((card, index) => (
          <DashboardCard
            key={index}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            variant={card.variant}
            icon={card.icon}
            trend={card.trend}
          />
        ))}
      </div>

      <div className="overview-details">
        <div className="detail-card">
          <h4>Popular Category</h4>
          <div className="category-info">
            <Badge variant="primary">
              {analyticsData.overview.popularCategory}
            </Badge>
            <span>Most registrations</span>
          </div>
        </div>

        <div className="detail-card">
          <h4>Conversion Rate</h4>
          <div className="conversion-info">
            <span className="rate">
              {((analyticsData.overview.conversionRate || 0) * 100).toFixed(1)}%
            </span>
            <span>Views to registrations</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="analytics-events">
      <h3>Event Performance</h3>
      <div className="events-table">
        <div className="table-header">
          <div>Event Name</div>
          <div>Date</div>
          <div>Registrations</div>
          <div>Revenue</div>
          <div>Performance</div>
        </div>

        {analyticsData.eventMetrics.map((event, index) => (
          <div key={index} className="table-row">
            <div className="event-name">{event.name}</div>
            <div>{new Date(event.date).toLocaleDateString()}</div>
            <div>{event.registrations}</div>
            <div>₹{(event.revenue / 1000).toFixed(0)}k</div>
            <div>
              <Badge
                variant={
                  event.registrations > 200
                    ? "success"
                    : event.registrations > 100
                      ? "warning"
                      : "secondary"
                }
              >
                {event.registrations > 200
                  ? "Excellent"
                  : event.registrations > 100
                    ? "Good"
                    : "Average"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="analytics-users">
      <h3>User Analytics</h3>
      <div className="user-stats">
        <div className="stat-card">
          <div className="stat-number">
            {analyticsData.userMetrics.newUsers}
          </div>
          <div className="stat-label">New Users</div>
        </div>

        <div className="stat-card">
          <div className="stat-number">
            {analyticsData.userMetrics.returningUsers}
          </div>
          <div className="stat-label">Returning Users</div>
        </div>

        <div className="stat-card">
          <div className="stat-number">
            {analyticsData.userMetrics.userGrowth}%
          </div>
          <div className="stat-label">Growth Rate</div>
        </div>

        <div className="stat-card">
          <div className="stat-info">Top Demographic</div>
          <div className="stat-value">
            {analyticsData.userMetrics.topDemographic}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRevenue = () => (
    <div className="analytics-revenue">
      <h3>Revenue Analysis</h3>
      <div className="revenue-overview">
        <div className="revenue-card">
          <h4>This Month</h4>
          <div className="revenue-amount">
            ₹{(analyticsData.revenueData.thisMonth / 100000).toFixed(1)}L
          </div>
          <div className="revenue-growth">
            +{analyticsData.revenueData.growth}% from last month
          </div>
        </div>

        <div className="revenue-breakdown">
          <h4>Revenue Breakdown</h4>
          <div className="breakdown-item">
            <span>Registration Fees</span>
            <span>
              ₹
              {(
                analyticsData.revenueData.breakdown?.registrationFees /
                  100000 || 0
              ).toFixed(1)}
              L
            </span>
          </div>
          <div className="breakdown-item">
            <span>Merchandise</span>
            <span>
              ₹
              {(
                analyticsData.revenueData.breakdown?.merchandise / 100000 || 0
              ).toFixed(1)}
              L
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "events":
        return renderEvents();
      case "users":
        return renderUsers();
      case "revenue":
        return renderRevenue();
      default:
        return renderOverview();
    }
  };

  return (
    <DashboardLayout>
      <div className="analytics-page">
        <div className="analytics-header">
          <div className="header-content">
            <h1>
              {user?.role === "admin"
                ? "Platform Analytics"
                : "Event Analytics"}
            </h1>
            <p>
              Track performance and insights for{" "}
              {user?.role === "admin" ? "the platform" : "your events"}
            </p>
          </div>

          <div className="header-controls">
            <div className="date-range">
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
              />
              <span>to</span>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
              />
            </div>

            <Button variant="outline" onClick={exportData}>
              Export Data
            </Button>
          </div>
        </div>

        <div className="analytics-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="analytics-content">{renderTabContent()}</div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
