import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Button from "../components/common/Button";
import DashboardCard from "../components/cards/DashboardCard";
import EventCard from "../components/cards/EventCard";
import PageContainer from "../components/layout/PageContainer";
import "./Home.css";

const Home=()=> 
{
  const{isAuthenticated,user}=useAuth();                                   //checking the user authentication
  const mockFeaturedEvents = [
    {
      _id: "1",
      eventName: "Tech Conference 2026",
      eventDescription:
        "Join us for the biggest tech conference of the year with speakers from top tech companies.",
      eventType: "normal",
      eventStartDate: new Date("2026-03-15"),
      registrationDeadline: new Date("2026-03-10"),
      registrationFee: 0,
      registrationCount: 150,
      registrationLimit: 500,
      status: "published",
    },
    {
      _id: "2",
      eventName: "Music Festival 2026",
      eventDescription:
        "Experience amazing performances from top artists in this three-day music festival.",
      eventType: "normal",
      eventStartDate: new Date("2026-04-20"),
      registrationDeadline: new Date("2026-04-15"),
      registrationFee: 1500,
      registrationCount: 80,
      registrationLimit: 200,
      status: "published",
    },
    {
      _id: "3",
      eventName: "Coding Bootcamp",
      eventDescription:
        "Learn modern web development in this intensive workshop.",
      eventType: "normal",
      eventStartDate: new Date("2026-05-05"),
      registrationDeadline: new Date("2026-05-01"),
      registrationFee: 500,
      registrationCount: 25,
      registrationLimit: 50,
      status: "published",
    },
  ];
  const platformStats= //mocking data not needed not asked
  {
    totalEvents: 150,
    totalUsers: 5000,
    activeOrganizers: 50,
  };
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to Felicity Platform</h1>
          <p className="hero-subtitle">
            Your premier event management platform for organizing and
            participating in events. Join thousands of users managing their
            events efficiently.
          </p>
          {
          !isAuthenticated?
          (
            <div className="hero-actions">
              <Button as={Link} to="/register" variant="primary" size="large">Get Started</Button>   {/*not working*/}
              <Button as={Link} to="/events" variant="outline" size="large">Browse Events</Button>   {/*not working*/}
            </div>
          ):(
            <div className="hero-actions">
              <Button as={Link} to="/dashboard" variant="primary" size="large">Go to Dashboard</Button>
              <Button as={Link} to="/events" variant="outline" size="large">Browse Events</Button>
            </div>
          )}
        </div>
      </section>
      {/* Platform Stats */}{/* Featured Events */}{/* Features Section */}
      {/*contains some dummy values and some real values need to update and integrate with backeground */}
      <PageContainer>
        {/* Platform Stats */}
        <section className="stats-section">
          <h2 className="section-title">Platform Statistics</h2>
          <div className="stats-grid">
            <DashboardCard
              title="Total Events"
              value={platformStats.totalEvents}
              description="Events hosted on our platform"
              icon="📅"
              variant="primary"
            />
            <DashboardCard
              title="Active Users"
              value={platformStats.totalUsers.toLocaleString()}
              description="Registered participants"
              icon="👥"
              variant="success"
            />
            <DashboardCard
              title="Organizers"
              value={platformStats.activeOrganizers}
              description="Active event organizers"
              icon="🎯"
              variant="warning"
            />
          </div>
        </section>

        {/* Featured Events */}
        <section className="featured-events">
          <div className="section-header">
            <div>
              <h2 className="section-title">Featured Events</h2>
              <p className="section-subtitle">
                Discover exciting events happening around you
              </p>
            </div>
            <Button as={Link} to="/events" variant="outline">
              View All Events
            </Button>
          </div>

          <div className="events-grid">
            {mockFeaturedEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                userRole={user?.role || "participant"}
                onRegister={() =>
                  console.log("Register for event:", event.eventName)
                }
              />
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <h2 className="section-title">Why Choose Felicity Platform?</h2>
          <div className="features-grid">
            <Card>
              <div className="feature">
                <div className="feature-icon">🎟️</div>
                <h3 className="feature-title">Easy Event Management</h3>
                <p>
                  Create and manage events with our intuitive interface. From
                  registration to analytics, we've got you covered.
                </p>
              </div>
            </Card>

            <Card>
              <div className="feature">
                <div className="feature-icon">📊</div>
                <h3 className="feature-title">Real-time Analytics</h3>
                <p>
                  Get insights into your events with comprehensive analytics and
                  reporting tools.
                </p>
              </div>
            </Card>

            <Card>
              <div className="feature">
                <div className="feature-icon">📱</div>
                <h3 className="feature-title">Mobile-Friendly</h3>
                <p>
                  Access your events and tickets on any device. Our platform
                  works seamlessly across all screen sizes.
                </p>
              </div>
            </Card>
          </div>
        </section>
      </PageContainer>
    </div>
  );
};
export default Home;
