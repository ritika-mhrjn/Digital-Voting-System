import React, { useState, useEffect } from "react";
import AddVoterModal from "./AddVoterModal";
import EditVoterModal from "./EditVoterModal";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext"; 
import { getVoters, verifyVoter } from "../api/endpoints";

const VotersList = () => {
  const { t } = useLanguage();
  const { token } = useAuth(); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVoters = async () => {
    try {
      if (!token) return; 
      const response = await getVoters(token); 
      setVoters(response.data || response || []);
    } catch (error) {
      console.error("Error fetching voters:", error);
      setVoters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoters();
  }, [token]); 

  const handleAddSuccess = () => {
    fetchVoters();
  };

  const handleVerify = async (voterId) => {
    try {
      await verifyVoter(voterId, token);
      alert("Voter verified successfully!");
      fetchVoters();
    } catch (error) {
      console.error("Error verifying voter:", error);
      alert("Error verifying voter");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this voter?")) {
      setVoters(voters.filter((v) => v._id !== id));
      alert("Voter deleted");
    }
  };

  const handleUpdate = async (updatedVoter) => {
    setVoters(voters.map((v) => (v._id === updatedVoter._id ? updatedVoter : v)));
    setShowEditModal(false);
    alert("Voter updated (frontend only)");
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-slate-700">
          {t("voters")} {t("list")}
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          {t("addnew")}
        </button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="p-3 border">Voter ID</th>
            <th className="p-3 border">{t("fullName")}</th>
            <th className="p-3 border">National ID</th>
            <th className="p-3 border">Date of Birth</th>
            <th className="p-3 border">Verify</th>
            <th className="p-3 border">{t("action")}</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="6" className="text-center py-4 text-gray-500 italic">
                Loading...
              </td>
            </tr>
          ) : voters.length > 0 ? (
            voters.map((v) => (
              <tr key={v._id || v.id} className="hover:bg-slate-50">
                <td className="p-3 border">{v.voterId}</td>
                <td className="p-3 border">{v.fullName}</td>
                <td className="p-3 border">{v.nationalId || "N/A"}</td>
                <td className="p-3 border">{v.dateOfBirth || "N/A"}</td>
                <td className="p-3 border">
                  <span className={`px-2 py-1 rounded text-xs ${
                    v.hasRegistered 
                      ? "bg-green-100 text-green-800" 
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {v.hasRegistered ? "Verified" : "Not Verified"}
                  </span>
                  {!v.hasRegistered && (
                    <button
                      onClick={() => handleVerify(v.voterId)}
                      className="ml-2 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                    >
                      Verify
                    </button>
                  )}
                </td>
                <td className="p-3 border">
                  <button
                    onClick={() => {
                      setSelectedVoter(v);
                      setShowEditModal(true);
                    }}
                    className="bg-blue-800 hover:bg-blue-900 text-white px-3 py-1  rounded mr-2"
                  >
                    {t("edit")}
                  </button>
                  <button
                    onClick={() => handleDelete(v._id || v.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  >
                    {t("delete")}
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center py-4 text-gray-500 italic">
                No voters found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showAddModal && (
        <AddVoterModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={handleAddSuccess}
        />
      )}
      
      {showEditModal && (
        <EditVoterModal
          voter={selectedVoter}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

export default VotersList;