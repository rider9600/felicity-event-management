import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import DashboardLayout from "../components/layout/DashboardLayout";
import Card from "../components/Card";
import Button from "../components/common/Button";
import Loading from "../components/common/Loading";
import "./OrganizerAnalytics.css";

const OrganizerAnalytics = () => {
  const { user } = useAuth();
  const { apiCall, loading } = useApi();
  const [analytics, setAnalytics] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const result = await apiCall("/point/events/organizer/analytics");
      if (result.success || result.totals) {
        setAnalytics(result);
      } else {
        console.error("Failed to load analytics");
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Loading size="large" />
      </DashboardLayout>
    );
  }

  if (!analytics) {
    return (
      <DashboardLayout>
        <div className="no-data">
          <p>No completed events to display analytics.</p>
        </div>
      </DashboardLayout>
    );
  }

  const { totals = {}, events = [] } = analytics;

  return (
    <DashboardLayout>
      <div className="organizer-analytics">
        <h1>Event Analytics</h1>

        {/* Overall Stats */}
        <div className="analytics-summary">
          <Card className="stat-card">
            <div className="stat-label">Total Registrations</div>
            <div className="stat-value">{totals.registrations || 0}</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-label">Total Sales</div>
            <div className="stat-value">{totals.sales || 0}</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">₹{totals.revenue || 0}</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-label">Total Attendance</div>
            <div className="stat-value">{totals.attendance || 0}</div>
          </Card>
        </div>

        {/* Per-Event Breakdown */}
        <div className="events-breakdown">
          <h3>Breakdown by Event</h3>
          {events.length > 0 ? (
            <table className="events-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Registrations</th>
                  <th>Sales</th>
                  <th>Revenue</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.eventId}>
                    <td>{event.eventName}</td>
                    <td>{event.registrations}</td>
                    <td>{event.sales}</td>
                    <td>₹{event.revenue}</td>
                    <td>{event.attendance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No events to display.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrganizerAnalytics;
