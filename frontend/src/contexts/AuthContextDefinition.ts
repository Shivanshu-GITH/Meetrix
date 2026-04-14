import { createContext } from "react";

export interface UserData {
    token: string;
    username: string;
    name: string;
}

export interface AuthContextType {
    userData: UserData | null;
    setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
    handleRegister: (name: string, username: string, password: string) => Promise<string | undefined>;
    handleLogin: (username: string, password: string) => Promise<void>;
    handleFirebaseEmailRegister: (name: string, email: string, password: string) => Promise<void>;
    handleFirebaseEmailLogin: (email: string, password: string) => Promise<void>;
    handleGoogleLogin: () => Promise<void>;
    handleForgotPassword: (email: string) => Promise<void>;
    getHistoryOfUser: () => Promise<unknown>;
    addToUserHistory: (meetingCode: string) => Promise<unknown>;
    isLoggedIn: () => boolean;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);
