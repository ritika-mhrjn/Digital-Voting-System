import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react"; // Import Eye and EyeOff icons
import { useLanguage } from "../contexts/LanguageContext";
import { loginCandidate } from "../api/endpoints";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

const LoginCandidate = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); 

    const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "password") {
      setCredentials(prev => ({ ...prev, [name]: value.slice(0, 30) }));
    } else if (name === "email") {
      setCredentials(prev => ({ ...prev, [name]: value.slice(0, 40) }));
    } else {
      setCredentials(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!credentials.email.trim()) errs.email = "Email is required";
    else if (!credentials.email.includes("@")) errs.email = "Invalid email address";

    if (!credentials.password) errs.password = "Password is required";
    else if (credentials.password.length < 6)
      errs.password = "Password must be at least 6 characters";

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationErrors = validateForm();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      console.log("Sending request to backend...");
      const res = await loginCandidate(credentials);
      console.log("Backend response:", res.data);

      const token = res?.data?.token;
      const user = res?.data;

      console.log("user: ", user);

      if (!token || !user) {
        throw new Error("Invalid response from server");
      }

      login(token, user, true);

      navigate("/candidate-dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please check your credentials."
      );
    }

  };

  const handleBack = () => navigate("/login");

  const isAlreadyLoggedIn = !!user;

  useEffect(() => {
    if (isAlreadyLoggedIn) {
      if (user?.role === "admin") navigate("/admin-dashboard");
      else if (user?.role === "candidate") navigate("/candidate-dashboard");
      else if (user?.role === "electoral_committee") navigate("/electoral-committee-dashboard");
      else if (user?.role === "voter") navigate("/voter-dashboard");
    }
  }, [isAlreadyLoggedIn, user, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md mb-4">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t("back")}</span>
        </button>
      </div>

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
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("password")} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder={t("passwordPlaceholder")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all pr-10"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <Eye className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        <button
          type="submit"
          className="w-20 bg-blue-800 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          {t("login")}
        </button>
      </form>
    </div>
  );
};

export default LoginCandidate;