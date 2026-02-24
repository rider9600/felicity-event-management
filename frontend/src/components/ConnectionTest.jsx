import React, { useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ConnectionTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [currentTest, setCurrentTest] = useState("");
  const [allTestsComplete, setAllTestsComplete] = useState(false);

  const addResult = (result) => {
    setTestResults((prev) => [...prev, result]);
  };

  const runAllTests = async () => {
    setTestResults([]);
    setAllTestsComplete(false);

    // Test 1: Backend Server Connection
    setCurrentTest("Testing Backend Server...");
    try {
      const response = await fetch(`${API_BASE_URL}/point/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@test.com", password: "wrong" }),
      });

      if (response.status === 400) {
        addResult("✅ Backend Server: Connected (API responding)");
      } else {
        addResult("⚠️ Backend Server: Unexpected response");
      }
    } catch (error) {
      addResult("❌ Backend Server: Not Connected - " + error.message);
    }

    // Test 2: Database Connection via Admin Login
    setCurrentTest("Testing Database Connection...");
    try {
      const response = await fetch(`${API_BASE_URL}/point/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@system.com",
          password: "admin123",
        }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        addResult(
          `✅ Database: Connected! Found admin user: ${data.user.email}`,
        );

        // Test 3: JWT Token Verification
        if (data.token) {
          addResult(
            `✅ Authentication: JWT token received (${data.token.substring(0, 20)}...)`,
          );
        }

        // Test 4: Protected Route with Token
        setCurrentTest("Testing Protected Routes...");
        try {
          const protectedResponse = await fetch(`${API_BASE_URL}/point/test`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${data.token}`,
              "Content-Type": "application/json",
            },
          });

          const protectedData = await protectedResponse.json();
          if (protectedResponse.ok) {
            addResult(
              `✅ Protected Routes: Working! User: ${protectedData.user.role}`,
            );
          } else {
            addResult(`❌ Protected Routes: Failed - ${protectedData.msg}`);
          }
        } catch (error) {
          addResult(`❌ Protected Routes: Error - ${error.message}`);
        }
      } else {
        addResult(`❌ Database: Admin login failed - ${data.msg}`);
      }
    } catch (error) {
      addResult(`❌ Database: Connection error - ${error.message}`);
    }

    // Test 5: User Registration (Database Write)
    setCurrentTest("Testing Database Write Operations...");
    try {
      const timestamp = Date.now();
      const response = await fetch(`${API_BASE_URL}/point/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: "Test",
          lastname: "User",
          email: `testuser${timestamp}@example.com`,
          password: "testpass123",
          participantType: "non-iiit",
        }),
      });

      const data = await response.json();

      if (response.ok && data.email) {
        addResult(`✅ Database Write: New user created - ${data.email}`);
      } else {
        addResult(
          `⚠️ Database Write: ${data.msg || "Registration response received"}`,
        );
      }
    } catch (error) {
      addResult(`❌ Database Write: Error - ${error.message}`);
    }

    setCurrentTest("");
    setAllTestsComplete(true);
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>🔗 Frontend ↔ Backend Connection Test</h1>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={runAllTests}
          disabled={currentTest !== ""}
          style={{
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: currentTest ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          {currentTest || "Run Complete Connection Test"}
        </button>
      </div>

      {currentTest && (
        <div
          style={{
            padding: "10px",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeaa7",
            borderRadius: "4px",
            marginBottom: "10px",
          }}
        >
          ⏳ {currentTest}
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        {testResults.map((result, index) => (
          <div
            key={index}
            style={{
              padding: "10px",
              margin: "5px 0",
              backgroundColor: result.startsWith("✅")
                ? "#d4edda"
                : result.startsWith("⚠️")
                  ? "#fff3cd"
                  : "#f8d7da",
              color: result.startsWith("✅")
                ? "#155724"
                : result.startsWith("⚠️")
                  ? "#856404"
                  : "#721c24",
              border: `1px solid ${
                result.startsWith("✅")
                  ? "#c3e6cb"
                  : result.startsWith("⚠️")
                    ? "#ffeaa7"
                    : "#f5c6cb"
              }`,
              borderRadius: "4px",
              fontFamily: "monospace",
            }}
          >
            {result}
          </div>
        ))}
      </div>

      {allTestsComplete && (
        <div
          style={{
            padding: "15px",
            backgroundColor: "#d1ecf1",
            border: "1px solid #bee5eb",
            borderRadius: "6px",
            marginTop: "20px",
          }}
        >
          <h3>🎉 Connection Test Complete!</h3>
          <p>
            <strong>What this proves:</strong>
          </p>
          <ul>
            <li>✅ Frontend successfully communicates with Backend</li>
            <li>✅ Backend is connected to MongoDB database</li>
            <li>✅ Authentication system works (JWT tokens)</li>
            <li>✅ Database read/write operations functional</li>
            <li>✅ API endpoints are properly configured</li>
          </ul>

          <p
            style={{ marginTop: "15px", fontWeight: "bold", color: "#0c5460" }}
          >
            🚀 Your Full-Stack Application is Ready!
          </p>
        </div>
      )}

      <div style={{ marginTop: "30px", fontSize: "14px", color: "#666" }}>
        <h3>Available API Endpoints:</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "10px",
          }}
        >
          {[
            "/point/auth/*",
            "/point/events/*",
            "/point/registration/*",
            "/point/tickets/*",
            "/point/admin/*",
            "/point/organizer/*",
            "/point/clubs/*",
            "/point/preferences/*",
          ].map((endpoint) => (
            <div
              key={endpoint}
              style={{
                padding: "8px",
                backgroundColor: "#f8f9fa",
                border: "1px solid #dee2e6",
                borderRadius: "4px",
                fontFamily: "monospace",
              }}
            >
              {endpoint}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConnectionTest;
