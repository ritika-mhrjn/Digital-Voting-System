import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  LogOut,
  Menu,
  Home,
  Users,
  User,
  UserCheck,
  BarChart2,
  Plus,
  Upload,
  X
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";

import {
  getCandidates,
  getElections,
  createElection,
  getVoters,
  updateElection,
  deleteElection,
  verifyVoter,
  addCandidate
} from "../api/endpoints";

const ElectoralCommitteeDashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const [activeSection, setActiveSection] = useState("dashboard");
  const [elections, setElections] = useState([]);
  const [newElection, setNewElection] = useState({ title: "", startDate: "", endDate: "" });
  const [voters, setVoters] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editedDates, setEditedDates] = useState({ startDate: "", endDate: "" });
  const [loading, setLoading] = useState(false);

  // Candidate Registration Form States
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [candidateFormData, setCandidateFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    age: "",
    gender: "",
    partyName: "",
    position: "Mayor",
    manifesto: "",
    photo: "",
    politicalSign: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [candidateLoading, setCandidateLoading] = useState(false);

  const positions = [ "Mayor"];

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <Home className="w-5 h-5" /> },
    { id: "voters", label: "Voters", icon: <Users className="w-5 h-5" /> },
    { id: "candidates", label: "Candidates", icon: <UserCheck className="w-5 h-5" /> },
    { id: "elections", label: "Elections", icon: <BarChart2 className="w-5 h-5" /> },
  ];

  useEffect(() => {
    console.log('Current user:', user);
    console.log('User role:', user?.role);
    console.log('Has electoral_committee role:', user?.role === 'electoral_committee');
    console.log('Has admin role:', user?.role === 'admin');
  }, [user]);

  // Reusable function to fetch elections
  const fetchElectionsData = async () => {
    try {
      const electionsResponse = await getElections();
      const electionsData = electionsResponse.data || electionsResponse || [];
      setElections(Array.isArray(electionsData) ? electionsData : []);
    } catch (error) {
      console.error("Error fetching elections:", error);
      setElections([]);
    }
  };

  // Reusable function to fetch voters
  const fetchVotersData = async () => {
    try {
      const votersResponse = await getVoters();
      console.log('Voters response:', votersResponse);
      setVoters(votersResponse.data || votersResponse || []);
    } catch (error) {
      console.error("Error fetching voters:", error);
    }
  };

  // Fetch candidates
  const fetchCandidatesData = async () => {
    try {
      const candidatesData = await getCandidates();
      setCandidates(candidatesData.data || candidatesData || []);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchElectionsData();
        await fetchCandidatesData();
        await fetchVotersData();
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Candidate Form Handlers
  const handleCandidateInputChange = (e) => {
    const { name, value } = e.target;
    setCandidateFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateCandidateForm = () => {
    const errors = {};

    if (!candidateFormData.fullName.trim()) errors.fullName = "Full name is required";
    if (!candidateFormData.email.trim()) errors.email = "Email is required";
    if (!candidateFormData.password) errors.password = "Password is required";
    if (candidateFormData.password && candidateFormData.password.length < 6) errors.password = "Password must be at least 6 characters";
    if (!candidateFormData.age) errors.age = "Age is required";
    if (candidateFormData.age && (candidateFormData.age < 18 || candidateFormData.age > 100)) errors.age = "Age must be between 18 and 100";
    if (!candidateFormData.gender) errors.gender = "Gender is required";
    if (!candidateFormData.partyName.trim()) errors.partyName = "Party name is required";
    if (!candidateFormData.position) errors.position = "Position is required";
    if (!candidateFormData.manifesto.trim()) errors.manifesto = "Manifesto is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCandidateSubmit = async (e) => {
    e.preventDefault();

    if (!validateCandidateForm()) return;

    setCandidateLoading(true);
    try {
      // Prepare candidate data according to your schema
      const candidatePayload = {
        fullName: candidateFormData.fullName,
        email: candidateFormData.email,
        password: candidateFormData.password,
        age: parseInt(candidateFormData.age),
        gender: candidateFormData.gender,
        partyName: candidateFormData.partyName,
        position: candidateFormData.position,
        manifesto: candidateFormData.manifesto,
        photo: candidateFormData.photo || "",
        politicalSign: candidateFormData.politicalSign || ""
      };

      console.log('Creating candidate:', candidatePayload);

      const response = await addCandidate(candidatePayload);

      if (response.success || response.data) {
        // Reset form
        setCandidateFormData({
          fullName: "",
          email: "",
          password: "",
          age: "",
          gender: "",
          partyName: "",
          position: "",
          manifesto: "",
          photo: "",
          politicalSign: ""
        });
        setFormErrors({});
        setShowCandidateForm(false);

        // Refresh candidates list
        await fetchCandidatesData();

        alert("Candidate registered successfully!");
      } else {
        alert(response.message || "Failed to register candidate");
      }
    } catch (error) {
      console.error("Error registering candidate:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to register candidate";
      alert(`Error: ${errorMessage}`);
    } finally {
      setCandidateLoading(false);
    }
  };

  // Handle election form changes
  const handleChange = (e) => {
    setNewElection({
      ...newElection,
      [e.target.name]: e.target.value
    });
  };

  // Create election function
  const handleCreateElection = async () => {
    console.log('Creating election with data:', newElection);

    if (!newElection.title || !newElection.startDate || !newElection.endDate) {
      alert("Please fill all fields");
      return;
    }

    if (!["admin", "electoral_committee"].includes(user?.role)) {
      alert("Only admins or committee members can create elections");
      return;
    }

    // Validate dates
    if (new Date(newElection.endDate) <= new Date(newElection.startDate)) {
      alert("End date must be after start date");
      return;
    }

    try {
      const electionPayload = {
        title: newElection.title,
        startDate: newElection.startDate,
        endDate: newElection.endDate,
        description: `Election for ${newElection.title}`,
        candidates: [],
        eligibleVoterIds: []
      };

      console.log('Sending election payload:', electionPayload);

      const response = await createElection(electionPayload);
      console.log('Create election response:', response);

      if (response.success || response.data) {
        setNewElection({ title: "", startDate: "", endDate: "" });
        await fetchElectionsData();
        alert("Election created successfully!");
      } else {
        alert(response.message || "Failed to create election");
      }
    } catch (error) {
      console.error("Error creating election:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to create election";
      alert(`Error: ${errorMessage}`);
    }
  };

  // Verify voter function
  const handleVerifyVoter = async (voterId) => {
    if (!window.confirm("Are you sure you want to verify this voter?")) {
      return;
    }

    try {
      const response = await verifyVoter(voterId);

      if (response.success) {
        // Update the voter's verification status locally
        setVoters(prevVoters =>
          prevVoters.map(voter =>
            voter._id === voterId || voter.id === voterId
              ? { ...voter, verified: true }
              : voter
          )
        );
        alert("Voter verified successfully!");
      } else {
        alert(response.message || "Failed to verify voter");
      }
    } catch (error) {
      console.error("Error verifying voter:", error);
      alert("Failed to verify voter");
    }
  };

  // DELETE election
  const handleDeleteElection = async (electionId) => {
    if (!window.confirm("Are you sure you want to DELETE this election? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await deleteElection(electionId);

      if (response.success) {
        // Update state immediately for better UX
        setElections(prevElections =>
          prevElections.filter(election => election._id !== electionId)
        );

        alert("Election deleted successfully!");
      } else {
        alert(response.message || "Failed to delete election");
        await fetchElectionsData();
      }
    } catch (error) {
      console.error("Error deleting election:", error);
      alert("Failed to delete election");
      await fetchElectionsData();
    } finally {
      setLoading(false);
    }
  };

  // Update election
  const handleUpdateElection = async (electionId) => {
    if (!editedDates.startDate || !editedDates.endDate) {
      alert("Please fill both dates");
      return;
    }

    if (new Date(editedDates.endDate) <= new Date(editedDates.startDate)) {
      alert("End date must be after start date");
      return;
    }

    try {
      const response = await updateElection(
        electionId,
        { startDate: editedDates.startDate, endDate: editedDates.endDate }
      );

      if (response.success) {
        setEditingId(null);
        setEditedDates({ startDate: "", endDate: "" });
        await fetchElectionsData();
        alert("Election updated successfully!");
      } else {
        alert(response.message || "Failed to update election");
      }
    } catch (error) {
      console.error("Error updating election:", error);
      alert("Failed to update election");
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleBack = () => setSelectedCandidate(null);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-[#f0e7ed] shadow-sm flex justify-center items-center px-6 py-4 fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="logo" className="h-18 w-auto object-contain" />
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-800 to-blue-400 text-transparent bg-clip-text tracking-wide">
            Electoral Committee Dashboard
          </h1>
        </div>
      </header>

      <div className="flex flex-1 mt-20">
        {/* Sidebar */}
        <aside className="w-64 bg-[#f1e8ff] shadow-md flex flex-col fixed left-0 top-20 bottom-0 text-slate-800">
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setSelectedCandidate(null);
                  setShowCandidateForm(false);
                }}
                className={`flex items-center gap-3 w-full text-left px-3 py-2 mt-4 rounded-lg transition-all ${activeSection === section.id
                  ? "bg-indigo-500/90 text-white font-semibold shadow-sm"
                  : "text-indigo-800/90 hover:bg-indigo-300"
                  }`}
              >
                {section.icon}
                <span className="font-medium tracking-wide text-base">
                  {section.label}
                </span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-300 bg-[#f3e8ff]">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-700 text-white hover:bg-blue-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-semibold text-base tracking-wide">Logout</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 p-8 overflow-auto ml-64">
          {/* Dashboard Section */}
          {activeSection === "dashboard" && (
            <div className="space-y-8">
              {/* Create Election Form */}
              <div className="bg-white border border-gray-300 p-6 mt-11 rounded-lg shadow-md max-w-md mx-auto space-y-5" style={{ minHeight: "340px" }}>
                <h3 className="text-2xl font-bold text-blue-800 mb-4 text-center">Create New Election</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <label className="block text-md font-medium text-gray-700 w-1/3">
                      Location:
                    </label>
                    <input
                      type="text"
                      name="title"
                      placeholder="Enter Election Location"
                      value={newElection.title}
                      onChange={handleChange}
                      className="w-2/3 border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#bbf3ea]"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="text-md font-medium text-gray-700 w-1/3">
                      Start Date:
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={newElection.startDate}
                      onChange={handleChange}
                      min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                      className="w-2/3 border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#bbf3ea]"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="text-md font-medium text-gray-700 w-1/3">
                      End Date:
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={newElection.endDate}
                      onChange={handleChange}
                      min={newElection.startDate || new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                      className="w-2/3 border border-gray-400 p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#bbf3ea]"
                    />
                  </div>
                  <button
                    onClick={handleCreateElection}
                    className="w-full bg-blue-700 text-white hover:bg-blue-800 py-2 rounded"
                  >
                    Create Election
                  </button>
                </div>
              </div>

              {/* Manage Created Elections */}
              <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md max-w-6xl mx-auto space-y-4">
                <h3 className="text-2xl font-bold text-blue-800 text-center mb-2">Created Elections</h3>
                {elections.length === 0 ? (
                  <p className="text-center text-gray-600">No elections created yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {elections.map((e) => (
                      <li
                        key={e._id || e.id}
                        className="flex flex-col md:flex-row justify-between items-start md:items-center py-3 px-4 hover:bg-gray-50 rounded transition"
                      >
                        <div>
                          <p className="font-semibold text-blue-900">{e.title}</p>
                          <p className="text-sm text-gray-600">
                            Start: {new Date(e.startDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            End: {new Date(e.endDate).toLocaleDateString()}
                          </p>
                        </div>

                        {editingId === e._id ? (
                          <div className="flex flex-col md:flex-row gap-2 mt-3 md:mt-0">
                            <input
                              type="date"
                              value={editedDates.startDate}
                              onChange={(ev) =>
                                setEditedDates({ ...editedDates, startDate: ev.target.value })
                              }
                              min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                              className="border p-1 rounded text-sm"
                            />
                            <input
                              type="date"
                              value={editedDates.endDate}
                              onChange={(ev) =>
                                setEditedDates({ ...editedDates, endDate: ev.target.value })
                              }
                              min={
                                editedDates.startDate
                                  ? editedDates.startDate
                                  : new Date(Date.now() + 86400000).toISOString().split("T")[0]
                              }
                              className="border p-1 rounded text-sm"
                            />
                            <button
                              onClick={() => handleUpdateElection(e._id)}
                              className="bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded "
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded "
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 mt-3 md:mt-0">
                            <button
                              onClick={() => {
                                setEditingId(e._id);
                                setEditedDates({
                                  startDate: e.startDate.split('T')[0],
                                  endDate: e.endDate.split('T')[0],
                                });
                              }}
                              className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded"
                            >
                              Manage
                            </button>
                            <button
                              onClick={() => handleDeleteElection(e._id)}
                              className="bg-[#ff5154]  hover:bg-[#fc161a] text-white px-3 py-1 rounded"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Voters Section */}
          {activeSection === "voters" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-indigo-500/90">Voter List</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{voters.length}</p>
                      <p className="text-sm text-gray-600">Total Voters</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                  <div className="flex items-center">
                    <UserCheck className="w-8 h-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-gray-800">
                        {voters.filter(v => v.verified).length}
                      </p>
                      <p className="text-sm text-gray-600">Verified Voters</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
                  <div className="flex items-center">
                    <User className="w-8 h-8 text-yellow-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-gray-800">
                        {voters.filter(v => !v.verified).length}
                      </p>
                      <p className="text-sm text-gray-600">Pending Verification</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-[#0acbae]">Registered Voters</h3>
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                    {voters.length} voters
                  </span>
                </div>

                {voters.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No voters registered yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Voter Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Voter ID</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {voters.map((v) => (
                          <tr key={v._id || v.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                                  <User className="w-4 h-4 text-indigo-600" />
                                </div>
                                <span className="font-medium text-gray-800">{v.fullName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{v.voterId}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${v.verified
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                                }`}>
                                <div className={`w-2 h-2 rounded-full mr-1 ${v.verified ? "bg-green-400" : "bg-yellow-400"
                                  }`}></div>
                                {v.verified ? "Verified" : "Pending"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Candidates Section */}
          {activeSection === "candidates" && (
            <div>
              {showCandidateForm ? (
                // Candidate Registration Form
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-indigo-500/90">Register New Candidate</h2>
                    <button
                      onClick={() => setShowCandidateForm(false)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back to Candidates
                    </button>
                  </div>

                  {/* Candidate Form */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <form onSubmit={handleCandidateSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Full Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            name="fullName"
                            required
                            value={candidateFormData.fullName}
                            onChange={handleCandidateInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter full name"
                          />
                          {formErrors.fullName && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
                          )}
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            name="email"
                            required
                            value={candidateFormData.email}
                            onChange={handleCandidateInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter email address"
                          />
                          {formErrors.email && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                          )}
                        </div>

                        {/* Password */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password *
                          </label>
                          <input
                            type="password"
                            name="password"
                            required
                            value={candidateFormData.password}
                            onChange={handleCandidateInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter password"
                          />
                          {formErrors.password && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
                          )}
                        </div>

                        {/* Party Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Party Name *
                          </label>
                          <input
                            type="text"
                            name="partyName"
                            required
                            value={candidateFormData.partyName}
                            onChange={handleCandidateInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter party name"
                          />
                          {formErrors.partyName && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.partyName}</p>
                          )}
                        </div>

                        {/* Age */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Age *
                          </label>
                          <input
                            type="number"
                            name="age"
                            required
                            min="21"
                            max="100"
                            value={candidateFormData.age}
                            onChange={handleCandidateInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Minimum 21 years"
                          />
                          {formErrors.age && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.age}</p>
                          )}
                        </div>

                        {/* Gender */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gender *
                          </label>
                          <select
                            name="gender"
                            required
                            value={candidateFormData.gender}
                            onChange={handleCandidateInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                          {formErrors.gender && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.gender}</p>
                          )}
                        </div>

                        {/* Position */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Position *
                          </label>
                          <select
                            name="position"
                            required
                            value={candidateFormData.position}
                            onChange={handleCandidateInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Position</option>
                            {positions.map((position) => (
                              <option key={position} value={position}>
                                {position}
                              </option>
                            ))}
                          </select>
                          {formErrors.position && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.position}</p>
                          )}
                        </div>

                        {/* Photo URL */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Photo URL
                          </label>
                          <input
                            type="url"
                            name="photo"
                            value={candidateFormData.photo}
                            onChange={handleCandidateInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter photo URL"
                          />
                        </div>

                        {/* Political Sign URL */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Political Symbol URL
                          </label>
                          <input
                            type="url"
                            name="politicalSign"
                            value={candidateFormData.politicalSign}
                            onChange={handleCandidateInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter political symbol URL"
                          />
                        </div>

                        {/* Manifesto */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Manifesto *
                          </label>
                          <textarea
                            name="manifesto"
                            required
                            value={candidateFormData.manifesto}
                            onChange={handleCandidateInputChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter candidate's manifesto and promises"
                          />
                          {formErrors.manifesto && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.manifesto}</p>
                          )}
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowCandidateForm(false)}
                          className="px-6 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={candidateLoading}
                          className="px-6 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50"
                        >
                          {candidateLoading ? "Registering..." : "Register Candidate"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : !selectedCandidate ? (
                // Candidates List View
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-indigo-500/90">Candidates</h2>
                    <button
                      onClick={() => setShowCandidateForm(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Add New Candidate
                    </button>
                  </div>

                  {candidates.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg shadow-md text-center">
                      <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg mb-4">No candidates registered yet.</p>
                      <button
                        onClick={() => setShowCandidateForm(true)}
                        className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                      >
                        Register First Candidate
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {candidates.map((c) => (
                        <div
                          key={c._id || c.id}
                          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => setSelectedCandidate(c)}
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <img
                              src={c.photo || c.profilePic || "/default-profile.png"}
                              alt={c.fullName || c.name}
                              className="w-16 h-16 rounded-full object-cover border"
                            />
                            <div>
                              <h3 className="font-semibold text-lg text-gray-800">{c.fullName || c.name}</h3>
                              <p className="text-blue-600 font-medium">{c.partyName || c.party}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Position:</span> {c.position}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Party:</span> {c.partyName || c.party}
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {c.manifesto || c.bio}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // Candidate Detail View
                <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={handleBack}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>Back to Candidates</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-6">
                    <img 
                      src={selectedCandidate.photo || selectedCandidate.profilePic || "/default-profile.png"} 
                      alt={selectedCandidate.fullName || selectedCandidate.name} 
                      className="w-24 h-24 rounded-full object-cover border" 
                    />
                    <div>
                      <h3 className="text-2xl font-semibold">{selectedCandidate.fullName || selectedCandidate.name}</h3>
                      <p className="text-gray-600">{selectedCandidate.email}</p>
                      <p className="text-blue-600 font-medium">{selectedCandidate.partyName || selectedCandidate.party}</p>
                      <p className="mt-2">{selectedCandidate.manifesto || selectedCandidate.bio}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Elections Section */}
          {activeSection === "elections" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Elections</h2>
              {elections.length === 0 ? (
                <p>No elections yet.</p>
              ) : (
                <ul className="bg-white p-4 rounded shadow space-y-2">
                  {elections.map((e) => (
                    <li
                      key={e._id || e.id}
                      className="border p-3 rounded flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50"
                    >
                      <div>
                        <p className="font-semibold text-blue-900">{e.title}</p>
                        <p className="text-sm text-gray-600">
                          Start: {new Date(e.startDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          End: {new Date(e.endDate).toLocaleDateString()}
                        </p>
                      </div>

                      {editingId === e._id ? (
                        <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0">
                          <input
                            type="date"
                            value={editedDates.startDate}
                            onChange={(ev) =>
                              setEditedDates({ ...editedDates, startDate: ev.target.value })
                            }
                            min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                            className="border p-1 rounded text-sm"
                          />
                          <input
                            type="date"
                            value={editedDates.endDate}
                            onChange={(ev) =>
                              setEditedDates({ ...editedDates, endDate: ev.target.value })
                            }
                            min={
                              editedDates.startDate
                                ? editedDates.startDate
                                : new Date(Date.now() + 86400000).toISOString().split("T")[0]
                            }
                            className="border p-1 rounded text-sm"
                          />
                          <button
                            onClick={() => handleUpdateElection(e._id)}
                            className="bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-gray-500 hover:bg-gray-600 py-1 px-2 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-2 md:mt-0">
                          <button
                            onClick={() => {
                              setEditingId(e._id);
                              setEditedDates({
                                startDate: e.startDate.split('T')[0],
                                endDate: e.endDate.split('T')[0],
                              });
                            }}
                            className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => handleDeleteElection(e._id)}
                            className="bg-[#ff5154]  hover:bg-[#fc161a] text-white px-3 py-1 rounded "
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ElectoralCommitteeDashboard;