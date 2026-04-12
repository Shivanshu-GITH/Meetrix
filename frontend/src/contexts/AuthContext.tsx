import axios from "axios";
import type { AxiosInstance } from "axios";
import React, { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";
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
            localStorage.setItem("token", token);
            localStorage.setItem("username", u);
            if (name != null) {
                localStorage.setItem("name", name);
            } else {
                localStorage.removeItem("name");
            }
            setUserData({ token, username: u, name: name ?? "" });
            router("/home");
        }
    }, [router]);

    const getHistoryOfUser = useCallback(async () => {
        const request = await client.get("/get_all_activity");
        return request.data;
    }, []);

    const addToUserHistory = useCallback(async (meetingCode: string) => {
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
            await client.post("/logout");
        } catch {
            /* still clear session client-side */
        }
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("name");
        setUserData(null);
        router("/auth");
    }, [router]);

    const value = useMemo(
        () => ({
            userData,
            setUserData,
            handleRegister,
            handleLogin,
            getHistoryOfUser,
            addToUserHistory,
            isLoggedIn,
            logout
        }),
        [
            userData,
            handleRegister,
            handleLogin,
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
