import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

const AboutUs = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { language, setLanguage, t } = useLanguage();

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-blue-50 shadow-md rounded-b-lg">
                <nav className="flex flex-col md:flex-row justify-between items-center px-4 md:px-10 py-3">
                    <div className="flex items-center mb-3 md:mb-0">
                        <img
                            src="/logo.png"
                            alt="Voting System Logo"
                            className="h-16 md:h-20 w-auto object-contain cursor-pointer"
                            onClick={() => navigate("/")}
                        />
                    </div>

                    <div className="flex items-center space-x-4 md:space-x-10 font-semibold mb-3 md:mb-0">
                        <button
                            onClick={() => navigate("/")}
                            className={`text-sm md:text-lg transition ${location.pathname === "/" ? "text-blue-500" : "text-gray-900 hover:text-blue-500"}`}>
                            {t("home")}
                        </button>
                        <button
                            onClick={() => navigate("/about")}
                            className={`text-sm md:text-lg transition ${location.pathname === "/about" ? "text-blue-500" : "text-gray-900 hover:text-blue-500"}`}>
                            {t("aboutUs")}
                        </button>
                        <button
                            onClick={() => navigate("/contact")}
                            className={`text-sm md:text-lg transition ${location.pathname === "/contact" ? "text-blue-500" : "text-gray-900 hover:text-blue-500"}`}>
                            {t("contactUs")}
                        </button>
                    </div>

                    <div className="flex items-center space-x-3">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="px-2 py-1 md:px-3 md:py-1 border border-gray-300 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium text-sm md:text-base"
                        >
                            <option value="en">{t("english")}</option>
                            <option value="np">{t("nepali")}</option>
                        </select>

                        <button
                            onClick={() => navigate("/login")}
                            className="px-2 py-1 md:px-3 md:py-1 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium text-sm md:text-base"
                        >
                            {t("loginRegister")}
                        </button>
                    </div>
                </nav>
            </header>

            {/* Main Content */}
            <div className="flex flex-col items-center px-6 pt-32 pb-16 mt-0">
                <h1 className="text-3xl md:text-4xl font-bold text-blue-800 text-center mb-8"
                    style={{ fontFamily: "Cooper BT, serif" }}>
                    {t("aboutNayamat")}
                </h1>

                <div className="flex flex-col md:flex-row items-start gap-8 max-w-5xl mx-auto w-full my-10">
                    <div className="flex-1 text-left">
                        <p className="text-base md:text-2xl text-black leading-relaxed drop-shadow-md"
                            style={{ fontFamily: "Cooper BT, serif" }}>
                            {t("about")}
                        </p>
                    </div>
                    <div className="flex-shrink-0 w-full md:w-2/5">
                        <img
                            src="/about.webp"
                            alt="aboutUs"
                            className="w-full h-72 md:h-96 object-cover shadow-md rounded-sm"
                        />
                    </div>
                </div>

                <div className="mt-10 p-6 mb-10 max-w-5xl mx-auto w-full">
                    <div className="flex flex-col md:flex-row items-start gap-8">
                        <div className="flex-shrink-0 w-full md:w-2/5">
                            <img
                                src="/e-voting.jpeg"
                                alt="E-Voting System"
                                className="w-full h-72 md:h-96 object-cover shadow-md rounded-sm"
                            />
                        </div>

                        <div className="flex-1 text-left">
                            <h2 className="text-3xl font-semibold text-blue-800 mb-2 md:mt-0"
                                style={{ fontFamily: "Cooper BT, serif" }}>
                                {t("aim")}
                            </h2>
                            <p className="text-base md:text-2xl text-black pt-2 leading-relaxed drop-shadow-md"
                                style={{ fontFamily: "Cooper BT, serif" }}>
                                {t("aimPart")}
                            </p>
                        </div>
                    </div>
                </div>
                <p className="text-gray-700 max-w-3xl text-left font-medium text-lg pb-10"
                    style={{ fontFamily: "Cooper BT, serif" }}>
                    {t("future")}
                </p>
            </div>
        </div>
    );
};
export default AboutUs;