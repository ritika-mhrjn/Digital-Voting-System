import { createContext, useContext, useState, useEffect } from "react";
import {jwtDecode}  from "jwt-decode";
import { updateUserProfile } from "../api/endpoints";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp && decoded.exp > currentTime) {
          return storedToken;
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");
          return null;
        }
      } catch (error) {
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

  const login = (newToken, userInfo, persist = true) => {
    try {
      const decoded = jwtDecode(newToken);
      
      const userData = {
        ...userInfo,
        id: decoded.id || userInfo?.id,
        role: decoded.role || userInfo?.role,
        fullName: userInfo?.fullName || decoded.fullName,
        email: userInfo?.email || decoded.email
      };

      setToken(newToken);
      setUser(userData);

      if (persist) {
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("userRole", userData.role);
        if (userData.email) localStorage.setItem("userEmail", userData.email);
        if (userData.voterId) localStorage.setItem("voterId", userData.voterId);
        if (userData.fullName) localStorage.setItem("fullName", userData.fullName);
      } else {
        sessionStorage.setItem("token", newToken);
        sessionStorage.setItem("user", JSON.stringify(userData));
      }

    } catch (error) {
      console.error('Error during login:', error);
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

  const logout = () => {
    setToken(null);
    setUser(null);
    
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("voterId");
    localStorage.removeItem("fullName");
    localStorage.removeItem("profilePic");
    
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    
    window.location.href = "/login";
  };

  const updateUser = async (updates) => {
    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      // Update localStorage
      const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
      storage.setItem("user", JSON.stringify(updatedUser));
      
      if (updates.role) localStorage.setItem("userRole", updates.role);
      if (updates.email) localStorage.setItem("userEmail", updates.email);
      if (updates.voterId) localStorage.setItem("voterId", updates.voterId);
      if (updates.fullName) localStorage.setItem("fullName", updates.fullName);
      if (updates.profilePic) localStorage.setItem("profilePic", updates.profilePic);
      
      if (user.id && Object.keys(updates).length > 0) {
        await updateUserProfile(user.id, updates);
      }
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const updateBio = async (newBio) => {
    return await updateUser({ bio: newBio });
  };

  const updateProfilePic = async (newUrl) => {
    return await updateUser({ profilePic: newUrl });
  };

  const updatePoliticalSign = async (url) => {
    return await updateUser({ politicalSign: url });
  };

  const updateSignName = async (signName) => {
    return await updateUser({ signName });
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout,
        updateUser, 
        updateBio,
        updateProfilePic,
        updatePoliticalSign,
        updateSignName,
        setUser 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;