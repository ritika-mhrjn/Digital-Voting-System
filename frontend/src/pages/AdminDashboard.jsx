import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import {
  Menu,
  Home,
  Users,
  FileText,
  LogOut,
  BarChart2,
  User,
  Edit,
  Trash2,
  Plus,
  UserCheck,
  Mail,
  Calendar,
  Hash
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { 
  getAdminStats, 
  getWinningCandidates, 
  getVoters, 
  verifyVoter, 
  updateVoter, 
  deleteVoter,
  addVoter,
  getCandidates
} from "../api/endpoints";
import LivePoll from "../components/LivePoll";
import LivePollHero from "../components/LivePollHero";
import { useAuth } from "../contexts/AuthContext";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: <Home className="w-5 h-5" /> },
  { id: "votes", label: "Votes", icon: <BarChart2 className="w-5 h-5" /> },
  { id: "voters", label: "Voters", icon: <Users className="w-5 h-5" /> },
  { id: "candidates", label: "Candidates", icon: <FileText className="w-5 h-5" /> },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [sampleStats, setSampleStats] = useState(null);
  const [winningCandidates, setWinningCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active section state
  const [activeSection, setActiveSection] = useState("dashboard");

  // Voter management states
  const [voters, setVoters] = useState([]);
  const [votersLoading, setVotersLoading] = useState(false);

  // Candidate management states
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  // Optimized modal state management for voters
  const [editModalData, setEditModalData] = useState({
    isOpen: false,
    voterId: null,
    formData: {
      voterId: "",
      fullName: "",
      nationalId: "",
      dateOfBirth: ""
    }
  });

  const [addModalData, setAddModalData] = useState({
    isOpen: false,
    formData: {
      voterId: "",
      fullName: "",
      nationalId: "",
      dateOfBirth: ""
    }
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [stats, winners] = await Promise.all([
          getAdminStats(),
          getWinningCandidates(),
        ]);
        setSampleStats(stats);
        setWinningCandidates(winners);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Fetch data when sections are active
  useEffect(() => {
    if (activeSection === "voters") {
      fetchVotersData();
    } else if (activeSection === "candidates") {
      fetchCandidatesData();
    }
  }, [activeSection]);

  const fetchVotersData = async () => {
    try {
      setVotersLoading(true);
      const votersResponse = await getVoters();
      console.log('Voters response:', votersResponse);
      setVoters(votersResponse.data || votersResponse || []);
    } catch (error) {
      console.error("Error fetching voters:", error);
      alert("Failed to load voters");
    } finally {
      setVotersLoading(false);
    }
  };

  const fetchCandidatesData = async () => {
    try {
      setCandidatesLoading(true);
      const candidatesResponse = await getCandidates();
      console.log('Candidates response:', candidatesResponse);
      setCandidates(candidatesResponse.data || candidatesResponse || []);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      alert("Failed to load candidates");
    } finally {
      setCandidatesLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleMenuClick = (id) => {
    setActiveSection(id);
  };

  const handleMoreInfo = (type) => {
    alert(`More details about ${type} will appear here later.`);
  };

  // Voter Management Functions (existing code)
  const handleVerifyVoter = async (voterId) => {
    if (!window.confirm("Are you sure you want to verify this voter?")) {
      return;
    }

    try {
      const response = await verifyVoter(voterId);
      
      if (response.success) {
        setVoters(prevVoters => 
          prevVoters.map(voter => 
            voter.voterId === voterId 
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

  // Optimized modal handlers for voters (existing code)
  const handleEditVoter = useCallback((voter) => {
    setEditModalData({
      isOpen: true,
      voterId: voter._id,
      formData: {
        voterId: voter.voterId,
        fullName: voter.fullName,
        dateOfBirth: voter.dateOfBirth ? new Date(voter.dateOfBirth).toISOString().split('T')[0] : '',
        nationalId: voter.nationalId || ''
      }
    });
  }, []);

  const handleEditFormChange = useCallback((field, value) => {
    setEditModalData(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: value
      }
    }));
  }, []);

  const handleNewVoterChange = useCallback((field, value) => {
    setAddModalData(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: value
      }
    }));
  }, []);

  const handleSaveEdit = async () => {
    try {
      const response = await updateVoter(editModalData.voterId, editModalData.formData);
      
      if (response.success) {
        setVoters(prevVoters => 
          prevVoters.map(voter => 
            voter._id === editModalData.voterId 
              ? { ...voter, ...editModalData.formData }
              : voter
          )
        );
        setEditModalData({ 
          isOpen: false, 
          voterId: null, 
          formData: {
            voterId: "",
            fullName: "",
            nationalId: "",
            dateOfBirth: ""
          }
        });
        alert("Voter updated successfully!");
      } else {
        alert(response.message || "Failed to update voter");
      }
    } catch (error) {
      console.error("Error updating voter:", error);
      alert("Failed to update voter");
    }
  };

  const handleDeleteVoter = async (voterId) => {
    if (!window.confirm("Are you sure you want to delete this voter? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await deleteVoter(voterId);
      
      if (response.success) {
        setVoters(prevVoters => prevVoters.filter(voter => voter._id !== voterId));
        alert("Voter deleted successfully!");
      } else {
        alert(response.message || "Failed to delete voter");
      }
    } catch (error) {
      console.error("Error deleting voter:", error);
      alert("Failed to delete voter");
    }
  };

  const handleAddVoter = async () => {
    if (!addModalData.formData.voterId || !addModalData.formData.fullName) {
      alert("Voter ID and Full Name are required");
      return;
    }

    try {
      const response = await addVoter(addModalData.formData);
      
      if (response.success) {
        setVoters(prevVoters => [...prevVoters, { 
          ...addModalData.formData, 
          _id: Date.now().toString(), 
          verified: false 
        }]);
        setAddModalData({
          isOpen: false,
          formData: {
            voterId: "",
            fullName: "",
            nationalId: "",
            dateOfBirth: ""
          }
        });
        alert("Voter added successfully!");
      } else {
        alert(response.message || "Failed to add voter");
      }
    } catch (error) {
      console.error("Error adding voter:", error);
      alert("Failed to add voter");
    }
  };

  // Section Components
  const DashboardSection = () => (
    <>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">
        {t("dashboard")}
      </h1>

      <LivePollHero electionId={null} title="Live AI Winner Prediction" />
      <div className="mb-6">
        <LivePoll />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-[#4BCBEB] text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-4xl font-extrabold">
              {sampleStats?.candidates ?? 0}
            </h2>
            <p className="text-sm mt-2 opacity-90">
              {t("total")} {t("candidates")}
            </p>
          </div>
          <button
            onClick={() => handleMoreInfo("candidates")}
            className="mt-4 self-start text-white border border-white/50 rounded-lg py-1.5 px-4 text-sm hover:bg-white/20"
          >
            {t("moreInfo")}
          </button>
        </div>

        <div className="bg-[#FE9496] text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-4xl font-extrabold">
              {sampleStats?.totalVoters ?? 0}
            </h2>
            <p className="text-sm mt-2 opacity-90">
              {t("total")} {t("voters")}
            </p>
          </div>
          <button
            onClick={() => handleMoreInfo("voters")}
            className="mt-4 self-start text-white border border-white/50 rounded-lg py-1.5 px-4 text-sm hover:bg-white/20"
          >
            {t("moreInfo")}
          </button>
        </div>

        <div className="bg-[#1BCFB4] text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-4xl font-extrabold">
              {sampleStats?.voted ?? 0}
            </h2>
            <p className="text-sm mt-2 opacity-90">
              {t("voters")} {t("voted")}
            </p>
          </div>
          <button
            onClick={() => handleMoreInfo("voted")}
            className="mt-4 self-start text-white border border-white/50 rounded-lg py-1.5 px-4 text-sm hover:bg-white/20"
          >
            {t("moreInfo")}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-slate-700 mb-4">
          Winning Candidates (Mayor)
        </h2>
        <Bar
          data={{
            labels: winningCandidates.map((c) => c.name),
            datasets: [
              {
                label: "Votes",
                data: winningCandidates.map((c) => c.votes),
                backgroundColor: ["#2563eb", "#16a34a", "#f59e0b"],
                borderRadius: 6,
              },
            ],
          }}
        />
      </div>
    </>
  );

  const VotesSection = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-indigo-500/90">Votes</h2>
      
    </div>
  );

  const VoterManagementSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-indigo-500/90">Voter Management</h2>
        <button
          onClick={() => setAddModalData({ 
            isOpen: true, 
            formData: {
              voterId: "",
              fullName: "",
              nationalId: "",
              dateOfBirth: ""
            }
          })}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Voter
        </button>
      </div>
      
      {/* Verification Summary */}
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

      {/* Voters Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[#0acbae]">Registered Voters</h3>
          <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
            {voters.length} voters
          </span>
        </div>
        
        {votersLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
            <p className="mt-2">Loading voters...</p>
          </div>
        ) : voters.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No voters registered yet.</p>
            <p className="text-gray-400">Click "Add Voter" to register new voters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Voter Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Voter ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">National ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date of Birth</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {voters.map((v) => (
                  <tr key={v._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                          <User className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="font-medium text-gray-800">{v.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{v.voterId}</td>
                    <td className="py-3 px-4 text-gray-600">{v.nationalId || 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {v.dateOfBirth ? new Date(v.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        v.verified 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-1 ${
                          v.verified ? "bg-green-400" : "bg-yellow-400"
                        }`}></div>
                        {v.verified ? "Verified" : "Pending"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {!v.verified ? (
                          <button
                            onClick={() => handleVerifyVoter(v.voterId)}
                            className="bg-[#0acbae] hover:bg-[#0aa890] text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                          >
                            Verify
                          </button>
                        ) : (
                          <span className="text-green-600 text-sm font-medium">Verified ✓</span>
                        )}
                        <button
                          onClick={() => handleEditVoter(v)}
                          className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded"
                          title="Edit Voter"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVoter(v._id)}
                          className="bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                          title="Delete Voter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const CandidateManagementSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-indigo-500/90">Candidate Information</h2>
      </div>

      {/* Candidates Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[#0acbae]">Registered Candidates</h3>
          <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
            {candidates.length} candidates
          </span>
        </div>
        
        {candidatesLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
            <p className="mt-2">Loading candidates...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-8">
            <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No candidates registered yet.</p>
            <p className="text-gray-400">Candidates will appear here once registered by the electoral committee.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Candidate</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Party</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Position</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Age</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Gender</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={candidate._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                          <User className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-800 block">{candidate.fullName}</span>
                          {candidate.photo && (
                            <span className="text-xs text-gray-500">Has photo</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {candidate.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{candidate.partyName}</td>
                    <td className="py-3 px-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {candidate.position}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {candidate.age} years
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{candidate.gender}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return loading ? <p className="text-center text-gray-600">{t("loading")}...</p> : <DashboardSection />;
      case "votes":
        return <VotesSection />;
      case "voters":
        return <VoterManagementSection />;
      case "candidates":
        return <CandidateManagementSection />;
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-[#f6f3fc] text-slate-800 transition-all duration-200 h-screen fixed top-0 left-0 z-40 ${collapsed ? "w-20" : "w-64"
          }`}
      >
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between p-4 border-b-3 border-gray-500">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Logo"
                className={`h-10 w-10 object-contain rounded-full border border-indigo-200 ${collapsed ? "mx-auto" : ""
                  }`}
              />
              {!collapsed && (
                <div>
                  <h1 className="text-xl font-extrabold text-indigo-800 tracking-wide">
                    {t("NayaMat")}
                  </h1>
                  <p className="text-sm text-indigo-600 font-medium">
                    {t("adminPanel")}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => setCollapsed((s) => !s)}
              className="hidden md:inline-flex p-2 rounded hover:bg-indigo-100/70 text-indigo-600"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3 p-4 border-b-2 border-gray-400">
            <div className="relative">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-indigo-500 rounded-full shadow-sm">
                <User className="w-6 h-6 text-white" />
              </div>
              <span
                onClick={() => setIsOnline((s) => !s)}
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-indigo-100 ${isOnline ? "bg-emerald-400" : "bg-slate-300"
                  }`}
                title={isOnline ? "Online" : "Offline"}
                style={{ cursor: "pointer" }}
              />
            </div>
            {!collapsed && (
              <div>
                <p className="text-base font-semibold text-indigo-900">
                  {t("systemAdministrator")}
                </p>
                <p className="text-sm text-indigo-600 font-medium">
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
          {menuItems.map((m) => {
            const active = m.id === activeSection;
            return (
              <button
                key={m.id}
                onClick={() => handleMenuClick(m.id)}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition text-base ${active
                    ? "bg-indigo-500/90 text-white font-semibold shadow-sm"
                    : "text-indigo-800/90 hover:bg-indigo-300"
                  }`}
              >
                {m.icon}
                {!collapsed && (
                  <span className="font-medium tracking-wide">{m.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sticky bottom-0 bg-[#f3e8ff] p-4 border-t border-gray-300 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-700 text-white hover:bg-blue-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && (
              <span className="font-semibold text-base tracking-wide">
                {t ? t("logout") : "Logout"}
              </span>
            )}
          </button>
        </div>
      </aside>

      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 flex justify-end items-center p-4.5 bg-[#f6eefd] border-b-3 border-gray-500">
          <div className="flex items-center h-11 gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-800 rounded-full">
              <User className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl text-black font-bold">
              {t("systemAdministrator")}
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="p-6">
            {renderActiveSection()}
          </div>
        </main>
      </div>

      {/* Edit Voter Modal */}
      {editModalData.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="absolute inset-0 bg-transparent"
            onClick={() => setEditModalData({ 
              isOpen: false, 
              voterId: null, 
              formData: {
                voterId: "",
                fullName: "",
                nationalId: "",
                dateOfBirth: ""
              }
            })}
          ></div>
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 relative z-10 border-2 border-blue-300">
            <h3 className="text-xl font-bold mb-4 text-blue-800">Edit Voter</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voter ID
                </label>
                <input
                  type="text"
                  value={editModalData.formData.voterId}
                  onChange={(e) => handleEditFormChange('voterId', e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editModalData.formData.fullName}
                  onChange={(e) => handleEditFormChange('fullName', e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  National ID
                </label>
                <input
                  type="text"
                  value={editModalData.formData.nationalId}
                  onChange={(e) => handleEditFormChange('nationalId', e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={editModalData.formData.dateOfBirth}
                  onChange={(e) => handleEditFormChange('dateOfBirth', e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={() => setEditModalData({ 
                    isOpen: false, 
                    voterId: null, 
                    formData: {
                      voterId: "",
                      fullName: "",
                      nationalId: "",
                      dateOfBirth: ""
                    }
                  })}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Voter Modal */}
      {addModalData.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="absolute inset-0 bg-transparent"
            onClick={() => setAddModalData({ 
              isOpen: false, 
              formData: {
                voterId: "",
                fullName: "",
                nationalId: "",
                dateOfBirth: ""
              }
            })}
          ></div>
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 relative z-10 border-2 border-green-300">
            <h3 className="text-xl font-bold mb-4 text-green-800">Add New Voter</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voter ID *
                </label>
                <input
                  type="text"
                  value={addModalData.formData.voterId}
                  onChange={(e) => handleNewVoterChange('voterId', e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter voter ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={addModalData.formData.fullName}
                  onChange={(e) => handleNewVoterChange('fullName', e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  National ID
                </label>
                <input
                  type="text"
                  value={addModalData.formData.nationalId}
                  onChange={(e) => handleNewVoterChange('nationalId', e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter national ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={addModalData.formData.dateOfBirth}
                  onChange={(e) => handleNewVoterChange('dateOfBirth', e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={() => setAddModalData({ 
                    isOpen: false, 
                    formData: {
                      voterId: "",
                      fullName: "",
                      nationalId: "",
                      dateOfBirth: ""
                    }
                  })}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddVoter}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
                >
                  Add Voter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;