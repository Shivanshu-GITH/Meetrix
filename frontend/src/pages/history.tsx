import React, { useEffect, useState, useContext } from 'react';
import { 
    Box, Typography, Container, IconButton, Card, 
    CardContent, Grid, Tooltip, CircularProgress, 
    Button, Snackbar, Alert, Avatar 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VideocamIcon from '@mui/icons-material/Videocam';
import HistoryIcon from '@mui/icons-material/History';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContextDefinition';
import withAuth from '../utils/withAuth';

interface Meeting {
    _id?: string;
    meetingCode: string;
    date: string;
}

const History: React.FC = () => {
    const navigate = useNavigate();
    const { getHistoryOfUser, addToUserHistory } = useContext(AuthContext);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await getHistoryOfUser() as Meeting[];
                const list = Array.isArray(data) ? data : [];
                const sortedData = [...list].sort(
                    (a, b) =>
                        new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
                );
                setMeetings(sortedData);
            } catch (err) {
                console.log(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [getHistoryOfUser]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} at ${hours}:${minutes}`;
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setSnackbarMessage("Meeting code copied!");
        setSnackbarOpen(true);
    };

    const handleRejoin = async (code: string) => {
        try {
            await addToUserHistory(code);
            navigate(`/meet/${code}`);
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
            {/* Dark Navbar */}
            <Box sx={{ 
                position: 'sticky', top: 0, zIndex: 1000, 
                bgcolor: '#1a1a2e', color: 'white', 
                height: '70px', display: 'flex', alignItems: 'center', 
                px: { xs: 2, md: 4 }, boxShadow: 3 
            }}>
                <Tooltip title="Back to Home">
                    <IconButton onClick={() => navigate('/home')} sx={{ color: 'white', mr: 2 }}>
                        <ArrowBackIcon />
                    </IconButton>
                </Tooltip>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Meeting History</Typography>
            </Box>

            <Container maxWidth="md" sx={{ py: 6 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                        <CircularProgress sx={{ color: '#FF9839' }} />
                    </Box>
                ) : (
                    <>
                        {meetings.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <HistoryIcon sx={{ fontSize: 100, color: '#FF9839', mb: 2 }} />
                                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>No meeting history yet</Typography>
                                <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>Join a meeting to see your history here</Typography>
                                <Button 
                                    variant="contained" 
                                    size="large"
                                    onClick={() => navigate('/home')}
                                    sx={{ bgcolor: '#FF9839', '&:hover': { bgcolor: '#e68a33' } }}
                                >
                                    Start a Meeting
                                </Button>
                            </Box>
                        ) : (
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        {meetings.length} meetings total
                                    </Typography>
                                </Box>

                                <Grid container spacing={2}>
                                    {meetings.map((meeting, index) => (
                                        <Grid size={12} key={meeting._id ?? index}>
                                            <Card variant="outlined" sx={{ 
                                                borderRadius: '12px', 
                                                '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                                                transition: 'all 0.2s'
                                            }}>
                                                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                                        <Avatar sx={{ bgcolor: 'rgba(255, 152, 57, 0.1)', color: '#FF9839', width: 50, height: 50 }}>
                                                            <VideocamIcon />
                                                        </Avatar>
                                                        <Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Typography variant="h6" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                                                                    {meeting.meetingCode}
                                                                </Typography>
                                                                <Tooltip title="Copy Code">
                                                                    <IconButton size="small" onClick={() => handleCopyCode(meeting.meetingCode)}>
                                                                        <ContentCopyIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {formatDate(meeting.date)}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <Button 
                                                        variant="contained" 
                                                        size="medium"
                                                        onClick={() => handleRejoin(meeting.meetingCode)}
                                                        sx={{ bgcolor: '#1a1a2e', '&:hover': { bgcolor: '#0f3460' } }}
                                                    >
                                                        Rejoin
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}
                    </>
                )}
            </Container>

            <Snackbar 
                open={snackbarOpen} 
                autoHideDuration={3000} 
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity="success" variant="filled">
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

const WrappedHistory = withAuth(History);
export default WrappedHistory;
