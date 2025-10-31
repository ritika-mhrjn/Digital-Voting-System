import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import LanguageSelection from "./pages/LanguageSelection";
import Registration from "./pages/Registration";
import Login from "./pages/Login";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import AdminDashboard from "./pages/AdminDashboard";
import VoterDashboard from "./pages/VoterDashboard";
import CandidateDashboard from "./pages/CandidateDashboard";
import ElectrolCommitteeDashboard from "./pages/ElectrolCommitteeDashboard";
import Votes from "./pages/Votes";
import VotersList from "./pages/VotersList";
import CandidatesList from "./pages/CandidatesList";

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LanguageSelection />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />

          <Route path="/admin-dashboard" element={<AdminDashboard />}>
            <Route path="votes" element={<Votes />} />
            <Route path="voters" element={<VotersList />} />
            <Route path="candidates" element={<CandidatesList />} />
          </Route>

          <Route path="/candidate-dashboard" element={<CandidateDashboard />} />
          <Route path="/voter-dashboard" element={<VoterDashboard />} />
          <Route path="/electrol-committee-dashboard" element={<ElectrolCommitteeDashboard />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
