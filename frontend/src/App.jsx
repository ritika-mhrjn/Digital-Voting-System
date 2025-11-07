// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";

import Heropg from "./components/heropg";
import Registration from "./components/Registration";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import AdminDashboard from "./pages/AdminDashboard";
import CandidateDashboard from "./pages/CandidateDashboard";
import ElectoralCommitteeDashboard from "./pages/ElectoralCommitteeDashboard";
import VoterDashboard from "./pages/VoterDashboard";
import Votes from "./pages/Votes";
import CandidatesList from "./pages/CandidatesList";
import VotersList from "./pages/VotersList";
import Login from "./pages/Login";
import ProtectedLayout from "./layouts/ProtectedLayout";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<Heropg />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/login" element={<Login />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />

            {/* Protected Routes - Admin Dashboard with Nested Routes */}
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedLayout>
                  <AdminDashboard />
                </ProtectedLayout>
              }
            >
              {/* Nested pages */}
              <Route path="votes" element={<Votes />} />
              <Route path="candidates" element={<CandidatesList />} />
              <Route path="voters" element={<VotersList />} />
            </Route>

            {/* Protected Routes - Candidate Dashboard */}
            <Route
              path="/candidate-dashboard"
              element={
                <ProtectedLayout>
                  <CandidateDashboard />
                </ProtectedLayout>
              }
            />

            {/* Protected Routes - Voter Dashboard */}
            <Route
              path="/voter-dashboard"
              element={
                <ProtectedLayout>
                  <VoterDashboard />
                </ProtectedLayout>
              }
            />

            {/* Protected Routes - Electoral Committee Dashboard */}
            <Route
              path="/electoral-committee-dashboard"
              element={
                <ProtectedLayout>
                  <ElectoralCommitteeDashboard />
                </ProtectedLayout>
              }
            />
          </Routes>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
