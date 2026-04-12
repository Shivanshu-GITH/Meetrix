import axios from "axios";
import { createContext, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";
import httpStatus from "http-status";

export const AuthContext = createContext({});

const client = axios.create({
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

export const AuthProvider = ({ children }) => {
    const [userData, setUserData] = useState(null);

    const router = useNavigate();

    const handleRegister = useCallback(async (name, username, password) => {
        const request = await client.post("/register", {
            name: name,
            username: username,
            password: password
        });

        if (request.status === httpStatus.CREATED) {
            return request.data.message;
        }
    }, []);

    const handleLogin = useCallback(async (username, password) => {
        const request = await client.post("/login", {
            username: username,
            password: password
        });

        if (request.status === httpStatus.OK) {
            localStorage.setItem("token", request.data.token);
            localStorage.setItem("username", request.data.username);
            router("/home");
        }
    }, [router]);

    const getHistoryOfUser = useCallback(async () => {
        const request = await client.get("/get_all_activity");
        return request.data;
    }, []);

    const addToUserHistory = useCallback(async (meetingCode) => {
        const request = await client.post("/add_to_activity", {
            meeting_code: meetingCode
        });
        return request;
    }, []);

    const isLoggedIn = useCallback(() => {
        return !!localStorage.getItem("token");
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
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
