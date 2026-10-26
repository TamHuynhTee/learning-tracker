import { createContext, useContext } from "react";

export interface AuthUser {
  id: string;
  email: string | null;
}
export const AuthContext = createContext<{ user: AuthUser | null; loading: boolean }>({
  user: null,
  loading: true,
});
export function useAuth() {
  return useContext(AuthContext);
}
