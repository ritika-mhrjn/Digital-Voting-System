import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { loginUser } from "../api/endpoints"; // import login API

const Login = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    idType: "citizenship",
    idNumber: "",
    voterid: "",
    role: "voter",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await loginUser(credentials); // call backend API
      // Save JWT and user info in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("userRole", data.role);

      // Redirect based on role
      if (data.role === "admin") navigate("/admin-dashboard");
      else if (data.role === "candidate") navigate("/candidate-dashboard");
      else if (data.role === "electrol committee") navigate("/electrol-committee-dashboard");
      else navigate("/voter-dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    }
  };

  const handleBack = () => {
    navigate("/register");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      {/* Back Button */}
      <div className="w-full max-w-md mb-4">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t("back")}</span>
        </button>
      </div>

      {/* Login Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-center">{t("login")}</h2>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("email")} <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={credentials.email}
            onChange={handleChange}
            placeholder={t("emailPlaceholder")}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("password")} <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            placeholder={t("passwordPlaceholder")}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
            required
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("role")} <span className="text-red-500">*</span>
          </label>
          <select
            name="role"
            value={credentials.role}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
          >
            <option value="voter">{t("voter")}</option>
            <option value="candidate">{t("candidate")}</option>
            <option value="admin">{t("admin")}</option>
            <option value="electrol committee">{t("electrolCommittee")}</option>
          </select>
        </div>

        {/* ID Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("idType")} <span className="text-red-500">*</span>
          </label>
          <select
            name="idType"
            value={credentials.idType}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
            required
          >
            <option value="citizenship">{t("citizenship")}</option>
            <option value="national">{t("national")}</option>
            <option value="passport">{t("passport")}</option>
          </select>
        </div>

        {/* ID Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {credentials.idType === "passport"
              ? t("passport")
              : credentials.idType === "national"
              ? t("national")
              : t("citizenship")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="idNumber"
            value={credentials.idNumber}
            onChange={handleChange}
            placeholder={t("idPlaceholder")}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
            required
          />
        </div>

        {/* Voter ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("voterid")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="voterid"
            value={credentials.voterid}
            onChange={handleChange}
            placeholder={t("voteridPlaceholder")}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-800 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          {t("login")}
        </button>
      </form>
    </div>
  );
};

export default Login;
