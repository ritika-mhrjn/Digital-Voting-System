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
          // Set axios header immediately for initial load
          axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
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
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      
      // If we have a token but user data might be missing role, try to decode token
      const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!userData.role && storedToken) {
        try {
          const decoded = jwtDecode(storedToken);
          return { ...userData, role: decoded.role };
        } catch (error) {
          console.error('Error decoding token for role:', error);
        }
      }
      
      return userData;
    }
    return null;
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

  // ✅ Updated Login function with token decoding
  const login = (newToken, userInfo, persist = true) => {
    try {
      // Decode the token to get the actual user data including role
      const decoded = jwtDecode(newToken);
      
      // Create user object with data from both token and userInfo
      // The token should contain the most up-to-date role information
      const userData = {
        ...userInfo,
        id: decoded.id || userInfo?.id,
        role: decoded.role || userInfo?.role, // Priority to token role
        fullName: userInfo?.fullName || decoded.fullName,
        email: userInfo?.email || decoded.email
      };

      setToken(newToken);
      setUser(userData);

      if (persist) {
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userData));
        
        // Also store individual fields for easy access if needed
        localStorage.setItem("userRole", userData.role);
        if (userData.email) localStorage.setItem("userEmail", userData.email);
        if (userData.voterId) localStorage.setItem("voterId", userData.voterId);
        if (userData.fullName) localStorage.setItem("fullName", userData.fullName);
      } else {
        sessionStorage.setItem("token", newToken);
        sessionStorage.setItem("user", JSON.stringify(userData));
      }

      // Set axios default header
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

    } catch (error) {
      console.error('Error during login:', error);
      // Fallback: use the original userInfo if token decoding fails
      setToken(newToken);
      setUser(userInfo);

      if (persist) {
        localStorage.setItem("token", newToken);
        if (userInfo) localStorage.setItem("user", JSON.stringify(userInfo));
      } else {
        sessionStorage.setItem("token", newToken);
        if (userInfo) sessionStorage.setItem("user", JSON.stringify(userInfo));
      }
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