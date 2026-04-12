import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

const withAuth = (WrappedComponent) => {
    const AuthComponent = (props) => {
        const router = useNavigate();
        const [checked, setChecked] = useState(false);
        const [allowed, setAllowed] = useState(false);

        useEffect(() => {
            const token = localStorage.getItem("token");
            const ok = Boolean(token && token !== "" && token !== "undefined");
            if (!ok) {
                router("/auth");
            }
            setAllowed(ok);
            setChecked(true);
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
