import React, { useState, useEffect } from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import {
  addVoter,
  getCandidates,
  getElections,
  createElection,
  getVoters,
  updateElection,
  deleteElection
} from "../api/endpoints";

const ElectoralCommitteeDashboard = () => {
  const { token, user, logout } = useAuth();
  const { t } = useLanguage();

  const [activeSection, setActiveSection] = useState("dashboard");
  const [elections, setElections] = useState([]);
  const [newElection, setNewElection] = useState({ title: "", startDate: "", endDate: "" });
  const [voters, setVoters] = useState([]);
  const [newVoter, setNewVoter] = useState({ id: "", name: "" });
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editedDates, setEditedDates] = useState({ startDate: "", endDate: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('Current user:', user);
    console.log('User role:', user?.role);
    console.log('Has electoral_committee role:', user?.role === 'electoral_committee');
    console.log('Has admin role:', user?.role === 'admin');
  }, [user]);

  // Reusable function to fetch elections
  const fetchElectionsData = async () => {
    try {
      const electionsResponse = await getElections(token);
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
      const votersResponse = await getVoters(token);
      console.log('Voters response:', votersResponse);
      setVoters(votersResponse.data || votersResponse || []);
    } catch (error) {
      console.error("Error fetching voters:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        await fetchElectionsData();
        // PASS TOKEN TO getCandidates
        const candidatesData = await getCandidates(token);
        setCandidates(candidatesData.data || candidatesData || []);

        const votersResponse = await getVoters(token);
        console.log('Voters response:', votersResponse);
        setVoters(votersResponse.data || votersResponse || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [token]);

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

      const response = await createElection(electionPayload, token);
      console.log('Create election response:', response);

      // Handle different response structures
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

  // Add voter function
  const handleAddVoter = async () => {
    if (!newVoter.id || !newVoter.name) {
      alert("Enter both Voter ID and Name");
      return;
    }

    if (voters.some(v => v.id === newVoter.id || v.voterId === newVoter.id)) {
      alert("Voter ID already exists!");
      return;
    }

    try {
      await addVoter(newVoter, token);
      setNewVoter({ id: "", name: "" });
      await fetchVotersData();
      alert("Voter added successfully!");
    } catch (error) {
      console.error("Failed to add voter:", error);
      alert("Failed to add voter");
    }
  };

  // DELETE election - FIXED VERSION
  const handleDeleteElection = async (electionId) => {
    if (!window.confirm("Are you sure you want to DELETE this election? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await deleteElection(electionId, token);

      if (response.success) {
        // Update state immediately for better UX
        setElections(prevElections => 
          prevElections.filter(election => election._id !== electionId)
        );
        
        alert("Election deleted successfully!");
      } else {
        alert(response.message || "Failed to delete election");
        // If something went wrong, refetch to sync with server
        await fetchElectionsData();
      }
    } catch (error) {
      console.error("Error deleting election:", error);
      alert("Failed to delete election");
      // On error, refetch to ensure UI matches server state
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
        { startDate: editedDates.startDate, endDate: editedDates.endDate },
        token
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
      <header className="bg-gray-100 shadow-sm flex justify-center items-center px-6 py-4 fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="logo" className="h-18 w-auto object-contain" />
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-900 to-blue-500 text-transparent bg-clip-text tracking-wide">
            Electoral Committee Dashboard
          </h1>
        </div>
      </header>

      <div className="flex flex-1 mt-20">
        {/* Fixed Sidebar */}
        <aside className="w-64 bg-blue-50 shadow-md flex flex-col fixed left-0 top-20 bottom-0">
          {/* Scrollable Navigation */}
          <nav className="flex-1 px-4 py-6 text-lg font-semibold space-y-2 overflow-y-auto">
            {["dashboard", "voters", "candidates", "elections"].map((section) => (
              <button
                key={section}
                onClick={() => { setActiveSection(section); setSelectedCandidate(null); }}
                className={`w-full text-left px-4 py-2 rounded-md transition ${activeSection === section ? "bg-gray-300 text-blue-900 font-semibold" : "hover:bg-blue-200 text-blue-950"
                  }`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          </nav>
          
          {/* Fixed Logout Button at Bottom */}
          <div className="p-4 border-t border-blue-200 bg-blue-50">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-800 text-white hover:bg-blue-900 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-semibold">{t("logout")}</span>
            </button>
          </div>
        </aside>

        {/* Main Content - Add left margin to account for fixed sidebar */}
        <main className="flex-1 p-8 overflow-auto ml-64">
          {/* Dashboard Section */}
          {activeSection === "dashboard" && (
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-blue-900 mb-4 text-left">Dashboard</h2>

              {/* Create Election Form */}
              <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md max-w-md mx-auto space-y-5" style={{ minHeight: "340px" }}>
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
                      className="w-2/3 border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-2/3 border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-2/3 border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleCreateElection}
                    className="w-full bg-blue-800 text-white py-2 rounded hover:bg-blue-900"
                  >
                    Create Election
                  </button>
                </div>
              </div>

              {/* Manage Created Elections */}
              <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md max-w-6xl mx-auto space-y-4">
                <h3 className="text-xl font-bold text-blue-800 text-center mb-2">Created Elections</h3>
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
                              className="bg-blue-800 text-white px-3 py-1 rounded hover:bg-blue-900"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="bg-blue-800 text-white px-3 py-1 rounded hover:bg-blue-900"
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
                              className="bg-blue-800 text-white px-3 py-1 rounded hover:bg-blue-900"
                            >
                              Manage
                            </button>
                            <button
                              onClick={() => handleDeleteElection(e._id)}
                              className="bg-gray-500  hover:bg-gray-600 text-white px-3 py-1 rounded"
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
            <div>
              <div className="bg-white p-6 rounded-lg shadow-md max-w-sm ml-10 mb-8 mt-3" style={{ minHeight: "250px" }}>
                <h3 className="text-xl font-bold text-blue-800 mb-4 text-center">Add New Voter</h3>
                <input
                  type="text"
                  placeholder="Voter ID"
                  value={newVoter.id}
                  onChange={(e) => setNewVoter({ ...newVoter, id: e.target.value })}
                  className="w-full border p-2 rounded mb-3"
                />
                <input
                  type="text"
                  placeholder="Voter Name"
                  value={newVoter.name}
                  onChange={(e) => setNewVoter({ ...newVoter, name: e.target.value })}
                  className="w-full border p-2 rounded mb-3"
                />
                <button
                  onClick={handleAddVoter}
                  className="w-full bg-blue-800 text-white py-2 rounded hover:bg-blue-900 transition"
                >
                  Add Voter
                </button>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Registered Voters</h3>
                {voters.length === 0 ? (
                  <p>No voters registered yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {voters.map((v) => (
                      <li key={v._id || v.id} className="py-2 flex justify-between">
                        {v.fullName} <span>ID: {v.voterId}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Candidates Section */}
          {activeSection === "candidates" && (
            <div>
              {!selectedCandidate ? (
                <>
                  <h2 className="text-2xl font-semibold mb-4">Candidates</h2>
                  <ul className="bg-white p-4 rounded shadow space-y-4">
                    {candidates.map((c) => (
                      <li
                        key={c._id || c.id}
                        className="border p-4 rounded cursor-pointer hover:bg-blue-50 flex items-center gap-4"
                        onClick={() => setSelectedCandidate(c)}
                      >
                        <img src={c.profilePic || "/default-profile.png"} alt={c.name} className="w-16 h-16 rounded-full object-cover border" />
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{c.name}</p>
                          <p className="text-gray-600">{c.email}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={handleBack}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>{t ? t("back") : "Back"}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-6">
                    <img src={selectedCandidate.profilePic || "/default-profile.png"} alt={selectedCandidate.name} className="w-24 h-24 rounded-full object-cover border" />
                    <div>
                      <h3 className="text-2xl font-semibold">{selectedCandidate.name}</h3>
                      <p className="text-gray-600">{selectedCandidate.email}</p>
                      <p className="mt-2">{selectedCandidate.bio}</p>
                      {selectedCandidate.signImg && (
                        <div className="flex items-center gap-2 mt-2">
                          <img src={selectedCandidate.signImg} alt="Sign" className="w-16 h-16 object-contain" />
                          <span className="font-medium text-gray-800">{selectedCandidate.signName}</span>
                        </div>
                      )}
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
                            className="bg-blue-800 text-white px-3 py-1 rounded hover:bg-blue-900"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-blue-800 text-white px-3 py-1 rounded hover:bg-blue-900"
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
                            className="bg-blue-800 text-white px-3 py-1 rounded hover:bg-blue-900"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => handleDeleteElection(e._id)}
                            className="bg-gray-500  hover:bg-gray-600 text-white px-3 py-1 rounded "
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