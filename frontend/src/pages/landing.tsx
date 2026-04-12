import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Box, Grid, Card, CardContent, Container } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import LockIcon from '@mui/icons-material/Lock';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import { styled, keyframes } from '@mui/system';

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
`;

const FloatingImage = styled('img')({
  animation: `${float} 3s ease-in-out infinite`,
  maxWidth: '100%',
  borderRadius: '20px',
});

const FeatureCard = styled(Card)({
  height: '100%',
  textAlign: 'center',
  padding: '20px',
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'translateY(-10px)',
  }
});

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGuestJoin = () => {
    const randomCode = Math.random().toString(36).substring(2, 10);
    navigate(`/meet/${randomCode}`);
  };

  return (
    <Box className="landingPageContainer">
      {/* Sticky Navbar */}
      <Box component="nav" className="navBar" sx={{ position: 'sticky', top: 0, zIndex: 1000, height: '65px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VideocamIcon sx={{ color: '#FF9839', fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>Meetrix</Typography>
        </Box>
        <Box className="navlist">
          <Button color="inherit" onClick={handleGuestJoin} sx={{ display: { xs: 'none', md: 'inline-flex' } }}>Join as Guest</Button>
          <Button color="inherit" onClick={() => navigate('/auth')}>Register</Button>
          <Button 
            variant="contained" 
            sx={{ bgcolor: '#FF9839', '&:hover': { bgcolor: '#e68a33' } }}
            onClick={() => navigate('/auth')}
          >
            Login
          </Button>
        </Box>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="xl">
        <Grid container className="landingMainContainer" spacing={4}>
          <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Box sx={{ mb: 3, display: 'inline-block', px: 2, py: 0.5, bgcolor: 'rgba(255, 152, 57, 0.15)', borderRadius: '20px', border: '1px solid #FF9839' }}>
              <Typography variant="caption" sx={{ color: '#FF9839', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
                New: HD Video Calls Now Available
              </Typography>
            </Box>
            <Typography variant="h1" sx={{ 
              fontWeight: 800, 
              fontSize: { xs: '2.8rem', sm: '3.5rem', md: '4.5rem' }, 
              lineHeight: 1.1, 
              mb: 3,
              color: 'white'
            }}>
              Connect with your <br />
              <span style={{ color: '#FF9839' }}>Loved Ones</span>
            </Typography>
            <Typography variant="h6" sx={{ color: '#cbd5e0', mb: 5, maxWidth: '550px', mx: { xs: 'auto', md: 0 }, lineHeight: 1.6 }}>
              Secure, crystal-clear video calls for teams and families. No downloads needed. Join meetings directly from your browser with zero hassle.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <Button 
                variant="contained" 
                size="large" 
                sx={{ 
                  bgcolor: '#FF9839', 
                  px: 5, 
                  py: 2, 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold',
                  borderRadius: '12px',
                  '&:hover': { bgcolor: '#e68a33' } 
                }}
                onClick={() => navigate('/auth')}
              >
                Get Started Free
              </Button>
              <Button 
                variant="outlined" 
                size="large" 
                sx={{ 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.5)', 
                  px: 5, 
                  py: 2, 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold',
                  borderRadius: '12px',
                  '&:hover': { borderColor: '#FF9839', color: '#FF9839', bgcolor: 'rgba(255,152,57,0.05)' } 
                }}
                onClick={handleGuestJoin}
              >
                Join as Guest
              </Button>
            </Box>
            <Typography variant="body2" sx={{ color: '#a0aec0', display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4caf50' }}></span>
              No credit card required • Free forever
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box sx={{ 
              position: 'relative',
              p: 2, 
              background: 'linear-gradient(135deg, rgba(255, 152, 57, 0.3), rgba(26, 26, 46, 0.8))', 
              borderRadius: '32px',
              boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <FloatingImage src="/favicon.svg" alt="App Preview" sx={{ width: { xs: '250px', md: '350px' } }} />
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Features Section */}
      <Container sx={{ py: 10 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FeatureCard>
              <CardContent>
                <VideocamIcon sx={{ fontSize: 50, color: '#FF9839', mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>HD Video Quality</Typography>
                <Typography variant="body1" color="text.secondary">
                  Experience crystal clear high-definition video calls with low latency and adaptive bitrate.
                </Typography>
              </CardContent>
            </FeatureCard>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FeatureCard>
              <CardContent>
                <LockIcon sx={{ fontSize: 50, color: '#FF9839', mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>Secure & Private</Typography>
                <Typography variant="body1" color="text.secondary">
                  Your privacy is our priority. All calls are encrypted and secure from end to end.
                </Typography>
              </CardContent>
            </FeatureCard>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FeatureCard>
              <CardContent>
                <ScreenShareIcon sx={{ fontSize: 50, color: '#FF9839', mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>Screen Sharing</Typography>
                <Typography variant="body1" color="text.secondary">
                  Collaborate effectively with high-quality screen sharing and interactive features.
                </Typography>
              </CardContent>
            </FeatureCard>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: '#1a1a2e', color: 'white', py: 4, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="body2">
          &copy; {new Date().getFullYear()} Meetrix. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default LandingPage;
