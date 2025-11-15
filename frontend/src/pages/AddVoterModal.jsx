import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { addVoter } from "../api/endpoints"; // Import the API function

const AddVoterModal = ({ onClose, onSuccess }) => {
  const { t } = useLanguage();
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    voterId: "", // Add voterId field since backend requires it
    fullName: "",
    dateOfBirth: "",
    nationalId: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use the API function instead of direct fetch
      await addVoter(formData, token);
      
      console.log("✅ New Voter Added");
      alert(`${t("voterAddedSuccess") || `Voter ${formData.fullName} added successfully!`}`);
      
      if (onSuccess) {
        onSuccess(); // Refresh the voter list
      }
      onClose();
    } catch (error) {
      console.error("❌ Error adding voter:", error);
      alert(t("voterAddError") || "Error adding voter. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-center">
          {t("addVoter")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Voter ID - Required by backend */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Voter ID *
            </label>
            <input
              name="voterId"
              placeholder="Enter unique Voter ID"
              value={formData.voterId}
              onChange={handleChange}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("fullName")} *
            </label>
            <input
              name="fullName"
              placeholder={t("fullNamePlaceholder")}
              value={formData.fullName}
              onChange={handleChange}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* National ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              National ID
            </label>
            <input
              name="nationalId"
              placeholder="Enter National ID"
              value={formData.nationalId}
              onChange={handleChange}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 disabled:opacity-50"
            >
              {t("close")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Adding..." : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVoterModal;