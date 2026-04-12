import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Button, TextField, IconButton, Snackbar, Alert, 
    Tooltip, Box, Typography, Container, Grid 
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import { styled, keyframes } from '@mui/system';
import { AuthContext } from '../contexts/AuthContext';
import withAuth from '../utils/withAuth';

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
  100% { transform: translateY(0px); }
`;

const AnimatedImage = styled('img')({
    animation: `${float} 4s ease-in-out infinite`,
    maxWidth: '100%',
    height: 'auto',
});

const HomeComponent = () => {
    const navigate = useNavigate();
    const { logout, addToUserHistory } = useContext(AuthContext);

    const [meetingCode, setMeetingCode] = useState("");
    const [error, setError] = useState("");
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const handleJoinMeeting = async () => {
        if (!meetingCode.trim()) {
            setError("Meeting code cannot be empty");
            setSnackbarOpen(true);
            return;
        }

        try {
            await addToUserHistory(meetingCode);
            navigate(`/meet/${meetingCode.trim()}`);
        } catch (err) {
            setError("Failed to join meeting. Please try again.");
            setSnackbarOpen(true);
        }
    };

    const handleCreateInstantMeeting = async () => {
        const generatedCode = Math.random().toString(36).substring(2, 10);
        try {
            await addToUserHistory(generatedCode);
            navigate(`/meet/${generatedCode}`);
        } catch (err) {
            setError("Failed to create meeting. Please try again.");
            setSnackbarOpen(true);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Navbar */}
            <Box component="nav" className="navBar" sx={{ position: 'sticky', top: 0, zIndex: 1000, height: '70px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VideoCallIcon sx={{ color: '#FF9839', fontSize: 32 }} />
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Meetrix</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 3 } }}>
                    <Tooltip title="View History">
                        <IconButton color="inherit" onClick={() => navigate('/history')}>
                            <HistoryIcon />
                        </IconButton>
                    </Tooltip>
                    <Typography variant="body1" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 500 }}>
                        {localStorage.getItem("username")}
                    </Typography>
                    <Button 
                        variant="outlined" 
                        color="inherit" 
                        startIcon={<LogoutIcon />}
                        onClick={logout}
                        sx={{ borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                    >
                        Logout
                    </Button>
                </Box>
            </Box>

            {/* Main Content */}
            <Container maxWidth="lg" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: { xs: 4, md: 8 } }}>
                <Grid container spacing={6} alignItems="center" justifyContent="center">
                    <Grid item xs={12} md={6}>
                        <Box sx={{ 
                            textAlign: { xs: 'center', md: 'left' },
                            bgcolor: 'white',
                            p: { xs: 3, md: 6 },
                            borderRadius: '24px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                            border: '1px solid #eee'
                        }}>
                            <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.5rem' }, color: '#1a1a2e' }}>
                                Start or Join a Meeting
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 5, lineHeight: 1.6 }}>
                                Connect instantly with your colleagues, friends, or family. Enter a code or start a fresh session.
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: '450px', mx: { xs: 'auto', md: 0 } }}>
                                {/* Option A - Join */}
                                <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <TextField 
                                        fullWidth
                                        variant="outlined"
                                        placeholder="Meeting Code (e.g. abc-123)"
                                        value={meetingCode}
                                        onChange={(e) => setMeetingCode(e.target.value)}
                                        sx={{ 
                                            bgcolor: '#f8f9fa', 
                                            '& .MuiOutlinedInput-root': { borderRadius: '12px' }
                                        }}
                                    />
                                    <Button 
                                        variant="contained" 
                                        onClick={handleJoinMeeting}
                                        sx={{ 
                                            px: 4, 
                                            py: { xs: 1.5, sm: 0 },
                                            bgcolor: '#1a1a2e', 
                                            borderRadius: '12px',
                                            fontWeight: 'bold',
                                            '&:hover': { bgcolor: '#0f3460' } 
                                        }}
                                    >
                                        Join
                                    </Button>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                                    <Box sx={{ flex: 1, height: '1px', bgcolor: '#eee' }} />
                                    <Typography variant="body2" sx={{ color: '#aaa', fontWeight: 'bold' }}>OR</Typography>
                                    <Box sx={{ flex: 1, height: '1px', bgcolor: '#eee' }} />
                                </Box>

                                {/* Option B - Create */}
                                <Button 
                                    fullWidth
                                    variant="contained" 
                                    size="large"
                                    color="success"
                                    startIcon={<VideoCallIcon />}
                                    onClick={handleCreateInstantMeeting}
                                    sx={{ 
                                        py: 2, 
                                        fontSize: '1.1rem', 
                                        fontWeight: 'bold', 
                                        borderRadius: '12px',
                                        boxShadow: '0 8px 20px rgba(76, 175, 80, 0.3)'
                                    }}
                                >
                                    New Instant Meeting
                                </Button>
                            </Box>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
                        <Box sx={{ position: 'relative' }}>
                            <Box sx={{ 
                                position: 'absolute', 
                                top: '50%', 
                                left: '50%', 
                                transform: 'translate(-50%, -50%)',
                                width: '120%', 
                                height: '120%', 
                                background: 'radial-gradient(circle, rgba(255,152,57,0.1) 0%, transparent 70%)',
                                zIndex: -1
                            }} />
                            <AnimatedImage src="/favicon.svg" alt="Dashboard Illustration" sx={{ width: '350px' }} />
                        </Box>
                    </Grid>
                </Grid>
            </Container>

            <Snackbar 
                open={snackbarOpen} 
                autoHideDuration={4000} 
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity="error" variant="filled">
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default withAuth(HomeComponent);
