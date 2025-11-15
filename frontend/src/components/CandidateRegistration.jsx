import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Upload } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { addCandidate } from "../api/endpoints";
import { Link } from "react-router-dom";

const CandidateRegistration = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { user, token } = useAuth();

    const [formData, setFormData] = useState({
        fullName: "",
        partyName: "",
        manifesto: "",
        age: "",
        gender: "",
        position: "",
        photo: "",
    });

    const [formErrors, setFormErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState("");

    const positions = [
        "Mayor",
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === "fullName") {
            const lettersOnly = value.replace(/[^a-zA-Z\s]/g, "").slice(0, 30);
            setFormData((prev) => ({ ...prev, [name]: lettersOnly }));

        } else if (name === "partyName") {
            const lettersOnly = value.replace(/[^a-zA-Z\s]/g, "").slice(0, 15);
            setFormData((prev) => ({ ...prev, [name]: lettersOnly }));

        } else if (name === "age") {
            let numbersOnly = value.replace(/\D/g, "").slice(0, 2);
            setFormData((prev) => ({ ...prev, [name]: numbersOnly }));

        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({ ...prev, photo: file }));
            const previewUrl = URL.createObjectURL(file);
            setPhotoPreview(previewUrl);
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.fullName.trim())
            errors.fullName = "Full name is required";
        if (!formData.partyName.trim())
            errors.partyName = "Party name is required";
        if (!formData.manifesto.trim())
            errors.manifesto = "Manifesto is required";
        if (!formData.age)
            errors.age = "Age is required";
        if (formData.age < 18)
            errors.age = "Candidate must be at least 18 years old";
        if (!formData.gender)
            errors.gender = "Gender is required";
        if (!formData.position)
            errors.position = "Position is required";
        if (!formData.photo)
            errors.photo = "Photo is required";
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        setFormErrors(errors);

        if (Object.keys(errors).length === 0) {
            setLoading(true);

            try {
                const formPayload = new FormData();
                formPayload.append("fullName", formData.fullName);
                formPayload.append("partyName", formData.partyName);
                formPayload.append("manifesto", formData.manifesto);
                formPayload.append("age", formData.age);
                formPayload.append("gender", formData.gender);
                formPayload.append("position", formData.position);
                formPayload.append("photo", formData.photo);
                formPayload.append("createdBy", user?._id || user?.id);

                const response = await addCandidate(formPayload, token);

                if (response.success) {
                    alert("Candidate registered successfully!");
                    navigate("/candidate-dashboard");
                } else {
                    alert(response.message || "Failed to register candidate");
                }
            } catch (error) {
                console.error("Candidate registration failed:", error);
                alert("Error: " + (error.response?.data?.message || error.message));
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBack = () => {
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
                    {/* Back Button */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={handleBack}
                            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>{t("back") || "Back"}</span>
                        </button>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-800 rounded-full mb-4">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {t("candidateRegistration")}
                        </h1>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            {t("candidateRegistrationIntro")}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t("fullName")} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                placeholder="Enter your full name"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            {formErrors.fullName && <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>}
                        </div>

                        {/* Age */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t("age")} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleInputChange}
                                placeholder="Enter your age"
                                min="18"
                                max="100"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            {formErrors.age && <p className="text-red-500 text-sm mt-1">{formErrors.age}</p>}
                        </div>

                        {/* Gender */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t("gender")} <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value=""> {t("selectGender")}</option>
                                <option value="male">{t("male")}</option>
                                <option value="female">{t("female")}</option>
                                <option value="other">{t("other")}</option>
                            </select>
                            {formErrors.gender && <p className="text-red-500 text-sm mt-1">{formErrors.gender}</p>}
                        </div>

                        {/* Party Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t("partyName")} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="partyName"
                                value={formData.partyName}
                                onChange={handleInputChange}
                                placeholder="Enter your party name"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            {formErrors.partyName && <p className="text-red-500 text-sm mt-1">{formErrors.partyName}</p>}
                        </div>

                        {/* Position */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t("position")} <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="position"
                                value={formData.position}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="">Select Position</option>
                                {positions.map((position) => (
                                    <option key={position} value={position}>
                                        {position}
                                    </option>
                                ))}
                            </select>
                            {formErrors.position && <p className="text-red-500 text-sm mt-1">{formErrors.position}</p>}
                        </div>

                        {/* Manifesto */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t("manifesto")} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="manifesto"
                                value={formData.manifesto}
                                onChange={handleInputChange}
                                placeholder="Describe your manifesto, campaign promises, and vision..."
                                rows="6"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-vertical"
                            />
                            {formErrors.manifesto && <p className="text-red-500 text-sm mt-1">{formErrors.manifesto}</p>}
                        </div>

                        {/* Photo Upload */}
                        <div className="border border-gray-300 rounded-xl p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t("profilePhoto")} <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-4">
                                {photoPreview ? (
                                    <img
                                        src={photoPreview}
                                        alt="Preview"
                                        className="w-28 h-28 rounded-full object-cover border"
                                    />
                                ) : (
                                    <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center border">
                                        <User className="w-10 h-10 text-gray-400" />
                                    </div>
                                )}
                                <div className="flex flex-col items-center">
                                    <label className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-300 text-blue-700 cursor-pointer hover:bg-blue-100 text-xs flex items-center gap-1">
                                        <Upload className="w-4 h-4" />
                                        {t("uploadPhoto")}
                                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                    </label>
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        JPG, PNG, WebP • Max 5MB
                                    </p>
                                </div>
                            </div>

                            {formErrors.photo && <p className="text-red-500 text-sm mt-1">{formErrors.photo}</p>}
                        </div>

                        {/* Submit Button */}
                        <div className="flex flex-col items-center bg-white rounded-2xl shadow-lg p-6 border border-gray-200 space-y-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-800 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 min-w-[260px]" >
                                {loading ?
                                    (<>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin">
                                        </div>
                                        <span>Registering...</span>
                                    </>
                                    ) : (
                                        <>
                                            <User className="w-5 h-5" />
                                            <span>  {t("registerAsCandidate")}</span>
                                        </>
                                    )}
                            </button>
                            <p className="text-center text-gray-600 text-sm font-bold">
                                {t('alreadyRegistered')}{" "}
                                <Link
                                    to="/login"
                                    className="text-blue-600 underline hover:text-blue-800" >
                                    {t("login")}
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CandidateRegistration;
