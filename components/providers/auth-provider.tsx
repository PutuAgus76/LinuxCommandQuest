"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  auth as firebaseAuth, 
  googleProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut 
} from "@/lib/firebaseClient";
import { 
  getClientToken, 
  setClientToken, 
  getLinuxUsername, 
  setLinuxUsername, 
  logoutClient 
} from "@/lib/clientAuth";
import { onAuthStateChanged } from "firebase/auth";

export interface UserInfo {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isMock: boolean;
}

export interface AuthContextType {
  user: UserInfo | null;
  token: string | null;
  loading: boolean;
  syncLoading: boolean;
  syncError: string | null;
  isAuthenticated: boolean;
  loginMock: (username: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSync: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { parseApiResponse } from "@/lib/apiHelper";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Sync profile and workspace to database
  const syncProfile = async (authToken: string) => {
    setSyncLoading(true);
    setSyncError(null);
    try {
      const res = await fetch("/api/profile/sync", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        }
      });
      
      await parseApiResponse(res);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error("Profile sync error:", err);
      setSyncError(err.message || "Gagal menyinkronkan profil ke database.");
      setIsAuthenticated(false);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleAuthState = async (firebaseUser: any) => {
    if (firebaseUser) {
      const idToken = await firebaseUser.getIdToken();
      const uInfo: UserInfo = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        isMock: false
      };
      
      // Update state
      setUser(uInfo);
      setToken(idToken);
      setClientToken(idToken);
      
      // Trigger sync
      await syncProfile(idToken);
    } else {
      // Check if we have mock token
      const mockToken = getClientToken();
      if (mockToken && mockToken.startsWith("mock_user_")) {
        const username = getLinuxUsername();
        const uInfo: UserInfo = {
          uid: `mock_uid_${username}`,
          email: `${username}@linuxquest.local`,
          displayName: username.charAt(0).toUpperCase() + username.slice(1),
          photoURL: null,
          isMock: true
        };
        setUser(uInfo);
        setToken(mockToken);
        await syncProfile(mockToken);
      } else {
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    // 1. Firebase Auth listener (if configured)
    let unsubscribe = () => {};
    if (firebaseAuth) {
      unsubscribe = onAuthStateChanged(firebaseAuth, (fUser: any) => {
        handleAuthState(fUser);
      });
    } else {
      // If Firebase not configured, check local mock auth immediately
      handleAuthState(null);
    }

    // 2. Local mock auth change listener
    const handleMockChange = () => {
      if (!firebaseAuth) {
        handleAuthState(null);
      }
    };
    
    window.addEventListener("auth-state-change", handleMockChange);

    return () => {
      unsubscribe();
      window.removeEventListener("auth-state-change", handleMockChange);
    };
  }, []);

  const loginMock = async (username: string) => {
    setLoading(true);
    const mockTok = `mock_user_${username}`;
    setLinuxUsername(username);
    setClientToken(mockTok);
    
    const uInfo: UserInfo = {
      uid: `mock_uid_${username}`,
      email: `${username}@linuxquest.local`,
      displayName: username.charAt(0).toUpperCase() + username.slice(1),
      photoURL: null,
      isMock: true
    };
    setUser(uInfo);
    setToken(mockTok);
    await syncProfile(mockTok);
    setLoading(false);
  };

  const loginGoogle = async () => {
    if (!firebaseAuth || !googleProvider) {
      throw new Error("Firebase Auth is not configured.");
    }
    setLoading(true);
    try {
      await signInWithPopup(firebaseAuth, googleProvider);
    } catch (err: any) {
      console.error("Firebase Google login failed:", err);
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    logoutClient();
    if (firebaseAuth) {
      await firebaseSignOut(firebaseAuth);
    }
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setLoading(false);
  };

  const refreshSync = async () => {
    const activeTok = getClientToken();
    if (activeTok) {
      await syncProfile(activeTok);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        syncLoading,
        syncError,
        isAuthenticated,
        loginMock,
        loginGoogle,
        logout,
        refreshSync
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
