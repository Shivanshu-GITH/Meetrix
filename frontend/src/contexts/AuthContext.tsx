import axios from "axios";
import type { AxiosInstance } from "axios";
import React, { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
} from "firebase/auth";
import server from "../environment";
import { auth, googleProvider } from "../firebase";
import { AuthContext } from "./AuthContextDefinition";
import type { UserData } from "./AuthContextDefinition";

const client: AxiosInstance = axios.create({
    baseURL: `${server}/api/v1/users`
});

client.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

function readUserDataFromStorage(): UserData | null {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return {
        token,
        username: localStorage.getItem("username") ?? "",
        name: localStorage.getItem("name") ?? "",
    };
}

function setSessionStorage(token: string, username: string, name: string) {
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    localStorage.setItem("name", name);
}

function clearSessionStorage() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("name");
    localStorage.removeItem("authProvider");
}

function getLocalHistoryKey(username: string) {
    return `meetrix_history_${username}`;
}

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [userData, setUserData] = useState<UserData | null>(readUserDataFromStorage);

    const router = useNavigate();

    const handleRegister = useCallback(async (name: string, username: string, password: string) => {
        const request = await client.post("/register", {
            name: name,
            username: username,
            password: password
        });

        if (request.status === 201) {
            return request.data.message;
        }
    }, []);

    const handleLogin = useCallback(async (username: string, password: string) => {
        const request = await client.post("/login", {
            username: username,
            password: password
        });

        if (request.status === 200) {
            const { token, username: u, name } = request.data;
            setSessionStorage(token, u, name ?? "");
            localStorage.setItem("authProvider", "backend");
            setUserData({ token, username: u, name: name ?? "" });
            router("/home");
        }
    }, [router]);

    const handleFirebaseEmailRegister = useCallback(async (name: string, email: string, password: string) => {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
            await updateProfile(credential.user, { displayName: name.trim() });
        }
        const token = await credential.user.getIdToken();
        const resolvedName = name.trim() || credential.user.displayName || email.split("@")[0];
        setSessionStorage(token, email, resolvedName);
        localStorage.setItem("authProvider", "firebase");
        setUserData({
            token,
            username: email,
            name: resolvedName,
        });
        router("/home");
    }, [router]);

    const handleFirebaseEmailLogin = useCallback(async (email: string, password: string) => {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const token = await credential.user.getIdToken();
        const resolvedName = credential.user.displayName || email.split("@")[0];
        setSessionStorage(token, email, resolvedName);
        localStorage.setItem("authProvider", "firebase");
        setUserData({
            token,
            username: email,
            name: resolvedName,
        });
        router("/home");
    }, [router]);

    const handleGoogleLogin = useCallback(async () => {
        const credential = await signInWithPopup(auth, googleProvider);
        const token = await credential.user.getIdToken();
        const email = credential.user.email ?? credential.user.uid;
        const resolvedName = credential.user.displayName || email.split("@")[0];
        setSessionStorage(token, email, resolvedName);
        localStorage.setItem("authProvider", "firebase");
        setUserData({
            token,
            username: email,
            name: resolvedName,
        });
        router("/home");
    }, [router]);

    const handleForgotPassword = useCallback(async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    }, []);

    const getHistoryOfUser = useCallback(async () => {
        const provider = localStorage.getItem("authProvider");
        if (provider === "firebase") {
            const username = localStorage.getItem("username") ?? "guest";
            const raw = localStorage.getItem(getLocalHistoryKey(username)) ?? "[]";
            try {
                return JSON.parse(raw);
            } catch {
                return [];
            }
        }
        const request = await client.get("/get_all_activity");
        return request.data;
    }, []);

    const addToUserHistory = useCallback(async (meetingCode: string) => {
        const provider = localStorage.getItem("authProvider");
        if (provider === "firebase") {
            const username = localStorage.getItem("username") ?? "guest";
            const key = getLocalHistoryKey(username);
            const existingRaw = localStorage.getItem(key) ?? "[]";
            let existing: { meetingCode: string; date: string }[] = [];
            try {
                existing = JSON.parse(existingRaw);
            } catch {
                existing = [];
            }
            const next = [{ meetingCode, date: new Date().toISOString() }, ...existing];
            localStorage.setItem(key, JSON.stringify(next.slice(0, 100)));
            return { status: 200, data: { ok: true } };
        }
        const request = await client.post("/add_to_activity", {
            meeting_code: meetingCode
        });
        return request;
    }, []);

    const isLoggedIn = useCallback(() => {
        return !!localStorage.getItem("token");
    }, []);

    const logout = useCallback(async () => {
        try {
            const provider = localStorage.getItem("authProvider");
            if (provider === "firebase") {
                await signOut(auth);
            } else {
                await client.post("/logout");
            }
        } catch {
            /* still clear session client-side */
        }
        clearSessionStorage();
        setUserData(null);
        router("/auth");
    }, [router]);

    const value = useMemo(
        () => ({
            userData,
            setUserData,
            handleRegister,
            handleLogin,
            handleFirebaseEmailRegister,
            handleFirebaseEmailLogin,
            handleGoogleLogin,
            handleForgotPassword,
            getHistoryOfUser,
            addToUserHistory,
            isLoggedIn,
            logout
        }),
        [
            userData,
            handleRegister,
            handleLogin,
            handleFirebaseEmailRegister,
            handleFirebaseEmailLogin,
            handleGoogleLogin,
            handleForgotPassword,
            getHistoryOfUser,
            addToUserHistory,
            isLoggedIn,
            logout
        ]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
