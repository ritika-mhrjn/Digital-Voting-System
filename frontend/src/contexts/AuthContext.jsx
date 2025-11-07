import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    
    // Validate token on initial load
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp && decoded.exp > currentTime) {
          return storedToken;
        } else {
          // Token expired, clear storage
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");
          return null;
        }
      } catch (error) {
        // Invalid token, clear storage
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        return null;
      }
    }
    return null;
  });

  const [user, setUser] = useState(() => {
    if (!token) return null;
    const u = localStorage.getItem("user") || sessionStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });

  const [loading] = useState(false);

  // ✅ Automatically set token header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // ✅ Login function
  const login = (newToken, userInfo, persist = true) => {
    setToken(newToken);
    setUser(userInfo || null);

    if (persist) {
      localStorage.setItem("token", newToken);
      if (userInfo) localStorage.setItem("user", JSON.stringify(userInfo));
    } else {
      sessionStorage.setItem("token", newToken);
      if (userInfo) sessionStorage.setItem("user", JSON.stringify(userInfo));
    }
  };

  // ✅ Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
    
    // Clear all auth-related items from storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("voterId");
    localStorage.removeItem("fullName");
    localStorage.removeItem("profilePic");
    
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    
    // Remove Authorization header
    delete axios.defaults.headers.common["Authorization"];
    
    // Reload to clear any cached state
    window.location.href = "/login";
  };

  // ✅ Update Bio
  const updateBio = (newBio) => {
    setUser((prev) => {
      const updated = { ...prev, bio: newBio };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  // ✅ Update Profile Pic
  const updateProfilePic = (newUrl) => {
    setUser((prev) => {
      const updated = { ...prev, profilePic: newUrl };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  // Update Political Sign
  const updatePoliticalSign = async (url) => {
      setUser((u) => ({ ...u, politicalSign: url }));
      await updateUserProfile(user.id, { politicalSign: url });
    };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout,
        updateBio,
        updateProfilePic,
        updatePoliticalSign,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
