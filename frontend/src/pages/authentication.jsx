import React, { useState, useContext } from 'react';
import { 
    TextField, Button, CircularProgress, Snackbar, Alert, 
    Avatar, Paper, Box, Grid, Typography, IconButton, InputAdornment,
    Tabs, Tab
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import { styled } from '@mui/system';
import { AuthContext } from '../contexts/AuthContext';

const DecorativeBox = styled(Box)({
    position: 'relative',
    height: '100%',
    width: '100%',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    overflow: 'hidden',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(255, 152, 57, 0.1)',
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        bottom: '10%',
        left: '5%',
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.05)',
    }
});

const Authentication = () => {
    const [formState, setFormState] = useState(0); // 0 = login, 1 = register
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { handleLogin, handleRegister } = useContext(AuthContext);

    const handleAuth = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (formState === 0) {
                if (!username || !password) {
                    throw new Error("Please fill all fields");
                }
                await handleLogin(username, password);
            } else {
                if (!name || !username || !password) {
                    throw new Error("Please fill all fields");
                }
                const result = await handleRegister(name, username, password);
                setSuccessMessage(result || "User registered successfully!");
                setSnackbarOpen(true);
                setFormState(0);
                setName("");
                setPassword("");
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Grid container component="main" sx={{ height: '100vh' }}>
            {/* Left Column - Decorative */}
            <Grid item sm={4} md={7} sx={{ display: { xs: 'none', sm: 'block' } }}>
                <DecorativeBox>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, zIndex: 1 }}>
                        <VideocamIcon sx={{ fontSize: 60, color: '#FF9839' }} />
                        <Typography variant="h2" sx={{ fontWeight: 'bold' }}>Meetrix</Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontStyle: 'italic', textAlign: 'center', px: 4, zIndex: 1, maxWidth: '600px' }}>
                        "Distance means so little when someone means so much. Stay connected, stay close."
                    </Typography>
                </DecorativeBox>
            </Grid>

            {/* Right Column - Form */}
            <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{
                    my: 8, mx: 4,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    maxWidth: '400px', width: '100%'
                }}>
                    <Avatar sx={{ m: 1, bgcolor: '#FF9839' }}>
                        <LockOutlinedIcon />
                    </Avatar>
                    <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
                        {formState === 0 ? "Welcome Back" : "Create Account"}
                    </Typography>

                    <Tabs 
                        value={formState} 
                        onChange={(e, val) => { setFormState(val); setError(""); }} 
                        sx={{ mb: 4, borderBottom: 1, borderColor: 'divider', width: '100%' }}
                        variant="fullWidth"
                    >
                        <Tab label="Sign In" />
                        <Tab label="Sign Up" />
                    </Tabs>

                    <Box component="form" noValidate onSubmit={handleAuth} sx={{ mt: 1, width: '100%' }}>
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
                            label="Username"
                            name="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoFocus={formState === 0}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        {error && (
                            <Typography color="error" variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                                {error}
                            </Typography>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{ mt: 3, mb: 2, py: 1.5, bgcolor: '#FF9839', '&:hover': { bgcolor: '#e68a33' } }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : (formState === 0 ? "Login" : "Register")}
                        </Button>

                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Button 
                                onClick={() => { setFormState(formState === 0 ? 1 : 0); setError(""); }}
                                sx={{ color: '#0f3460', textTransform: 'none' }}
                            >
                                {formState === 0 ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Grid>

            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
                <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Grid>
    );
};

export default Authentication;
