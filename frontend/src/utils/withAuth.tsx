import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

const isTokenExpired = (token: string) => {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (typeof payload.exp !== "number") {
            return true;
        }
        return (payload.exp as number) * 1000 < Date.now();
    } catch {
        return true;
    }
};

interface WithAuthProps { [key: string]: unknown; }

const withAuth = <P extends WithAuthProps>(WrappedComponent: React.ComponentType<P>) => {
    const AuthComponent = (props: P) => {
        const router = useNavigate();
        const [checked, setChecked] = useState(false);
        const [allowed, setAllowed] = useState(false);

        useEffect(() => {
            const checkAuth = () => {
                const token = localStorage.getItem("token");
                const provider = localStorage.getItem("authProvider");
                const ok = Boolean(token && token !== "" && token !== "undefined");
                if (!ok) {
                    router("/auth");
                    setAllowed(false);
                    setChecked(true);
                    return;
                }
                if (provider !== "firebase" && isTokenExpired(token!)) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("username");
                    localStorage.removeItem("name");
                    router("/auth");
                    setAllowed(false);
                    setChecked(true);
                    return;
                }
                setAllowed(true);
                setChecked(true);
            };
            checkAuth();
        }, [router]);

        if (!checked) {
            return (
                <Box
                    sx={{
                        minHeight: "100vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "background.default",
                    }}
                >
                    <CircularProgress color="primary" />
                </Box>
            );
        }

        return allowed ? <WrappedComponent {...props} /> : null;
    };

    return AuthComponent;
};

export default withAuth;
