import React, { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";

const EditVoterModal = ({ voter, onClose, onUpdate }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    voterId: "",
    fullName: "",
    dateOfBirth: "",
    nationalId: "",
  });

  useEffect(() => {
    if (voter) {
      setFormData({
        voterId: voter.voterId || "",
        fullName: voter.fullName || "",
        dateOfBirth: voter.dateOfBirth || "",
        nationalId: voter.nationalId || "",
      });
    }
  }, [voter]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      ...voter,
      ...formData
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-center">
          Edit Voter
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Voter ID
            </label>
            <input
              name="voterId"
              value={formData.voterId}
              onChange={handleChange}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400"
              required
              disabled // Voter ID should not be editable as it's the unique identifier
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("fullName")} *
            </label>
            <input
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              National ID
            </label>
            <input
              name="nationalId"
              value={formData.nationalId}
              onChange={handleChange}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              {t("close")}
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVoterModal;