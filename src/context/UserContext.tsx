import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { setApiUserId, userApi } from "../api/client";
import type { User } from "../types";

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const STORAGE_KEY = "streamd-user";

function loadStoredUser(): User | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as User;
    // Set the API user ID immediately so requests work from the start
    setApiUserId(parsed.id);
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser);
  const [loading, setLoading] = useState(!!user);

  useEffect(() => {
    if (!user) return;

    // Validate the stored user still exists on the server
    userApi
      .validate(user.id)
      .then((validated) => {
        setApiUserId(validated.id);
        setUser(validated);
      })
      .catch(() => {
        // User no longer exists — clear stored state
        setApiUserId(null);
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function login(u: User) {
    setApiUserId(u.id);
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  }

  function logout() {
    setApiUserId(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <UserContext.Provider value={{ user, loading, login, logout }}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
