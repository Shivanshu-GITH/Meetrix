import React, { useContext, useState } from "react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    CircularProgress,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    Snackbar,
    Tab,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import GoogleIcon from "@mui/icons-material/Google";
import { styled } from "@mui/system";
import { AuthContext } from "../contexts/AuthContextDefinition";

const DecorativeBox = styled(Box)({
    position: "relative",
    height: "100%",
    width: "100%",
    background: "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    overflow: "hidden",
    padding: "2rem",
    "&::before": {
        content: '""',
        position: "absolute",
        top: "-10%",
        right: "-10%",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "rgba(255, 152, 57, 0.1)",
    },
    "&::after": {
        content: '""',
        position: "absolute",
        bottom: "10%",
        left: "5%",
        width: "150px",
        height: "150px",
        borderRadius: "50%",
        background: "rgba(255, 255, 255, 0.05)",
    },
});

const Authentication: React.FC = () => {
    const [formState, setFormState] = useState(0);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        handleFirebaseEmailLogin,
        handleFirebaseEmailRegister,
        handleGoogleLogin,
        handleForgotPassword,
    } = useContext(AuthContext);

    const toUserMessage = (err: unknown, fallback: string) => {
        if (!(err instanceof Error)) return fallback;
        const msg = err.message.toLowerCase();
        if (msg.includes("invalid-credential")) return "Invalid email or password.";
        if (msg.includes("email-already-in-use")) return "This email is already registered.";
        if (msg.includes("weak-password")) return "Use a stronger password (at least 8 characters).";
        if (msg.includes("popup-closed-by-user")) return "Google sign-in was cancelled.";
        if (msg.includes("too-many-requests")) return "Too many attempts. Please try again later.";
        if (msg.includes("user-not-found")) return "No account exists for this email.";
        return fallback;
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (!email.trim() || !password.trim()) {
                throw new Error("Please fill all required fields.");
            }
            if (formState === 0) {
                await handleFirebaseEmailLogin(email.trim(), password);
            } else {
                if (!name.trim()) {
                    throw new Error("Please enter your full name.");
                }
                await handleFirebaseEmailRegister(name.trim(), email.trim(), password);
            }
        } catch (err: unknown) {
            setError(toUserMessage(err, "Authentication failed."));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError("");
        setLoading(true);
        try {
            await handleGoogleLogin();
        } catch (err: unknown) {
            setError(toUserMessage(err, "Google sign-in failed."));
        } finally {
            setLoading(false);
        }
    };

    const onForgotPassword = async () => {
        if (!email.trim()) {
            setError("Enter your email first to reset password.");
            return;
        }
        setError("");
        setLoading(true);
        try {
            await handleForgotPassword(email.trim());
            setSuccessMessage("Password reset email sent.");
            setSnackbarOpen(true);
        } catch (err: unknown) {
            setError(toUserMessage(err, "Could not send reset email."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Grid container component="main" sx={{ minHeight: "100vh" }}>
            <Grid size={{ xs: 0, md: 7 }} sx={{ display: { xs: "none", md: "block" } }}>
                <DecorativeBox>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4, zIndex: 1 }}>
                        <VideocamIcon sx={{ fontSize: 60, color: "#FF9839" }} />
                        <Typography variant="h2" sx={{ fontWeight: "bold" }}>
                            Meetrix
                        </Typography>
                    </Box>
                    <Typography
                        variant="h5"
                        sx={{ fontStyle: "italic", textAlign: "center", px: 4, zIndex: 1, maxWidth: "600px" }}
                    >
                        "Distance means so little when someone means so much. Stay connected, stay close."
                    </Typography>
                </DecorativeBox>
            </Grid>

            <Grid
                size={{ xs: 12, md: 5 }}
                component={Paper}
                elevation={6}
                square
                sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
                <Box
                    sx={{
                        my: { xs: 4, md: 8 },
                        mx: { xs: 2, sm: 4 },
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        maxWidth: "430px",
                        width: "100%",
                    }}
                >
                    <Avatar sx={{ m: 1, bgcolor: "#FF9839" }}>
                        <LockOutlinedIcon />
                    </Avatar>
                    <Typography component="h1" variant="h4" sx={{ fontWeight: "bold", mb: 2, textAlign: "center" }}>
                        {formState === 0 ? "Welcome Back" : "Create Account"}
                    </Typography>

                    <Tabs
                        value={formState}
                        onChange={(_, val) => {
                            setFormState(val);
                            setError("");
                        }}
                        sx={{ mb: 3, borderBottom: 1, borderColor: "divider", width: "100%" }}
                        variant="fullWidth"
                    >
                        <Tab label="Sign In" />
                        <Tab label="Sign Up" />
                    </Tabs>

                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<GoogleIcon />}
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        sx={{ py: 1.2, textTransform: "none", fontWeight: 600 }}
                    >
                        Continue with Google
                    </Button>

                    <Divider sx={{ width: "100%", my: 2.5 }}>or</Divider>

                    <Box component="form" noValidate onSubmit={handleAuth} sx={{ width: "100%" }}>
                        {formState === 1 && (
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="Full Name"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                            />
                        )}
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoFocus={formState === 0}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword((s) => !s)}>
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        {formState === 0 && (
                            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                                <Button onClick={onForgotPassword} size="small" sx={{ textTransform: "none", p: 0 }}>
                                    Forgot password?
                                </Button>
                            </Box>
                        )}

                        {error && (
                            <Typography color="error" variant="body2" sx={{ mt: 2, textAlign: "center" }}>
                                {error}
                            </Typography>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{ mt: 3, mb: 1, py: 1.5, bgcolor: "#FF9839", "&:hover": { bgcolor: "#e68a33" } }}
                        >
                            {loading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : formState === 0 ? (
                                "Sign In"
                            ) : (
                                "Create Account"
                            )}
                        </Button>

                        <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                            <Button
                                onClick={() => {
                                    setFormState(formState === 0 ? 1 : 0);
                                    setError("");
                                }}
                                sx={{ color: "#0f3460", textTransform: "none" }}
                            >
                                {formState === 0
                                    ? "Don't have an account? Sign Up"
                                    : "Already have an account? Sign In"}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Grid>

            <Snackbar open={snackbarOpen} autoHideDuration={5000} onClose={() => setSnackbarOpen(false)}>
                <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: "100%" }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Grid>
    );
};

export default Authentication;
