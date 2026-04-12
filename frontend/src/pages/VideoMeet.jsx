import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import { 
    Box, Button, TextField, Typography, IconButton, 
    Badge, Tooltip, Paper, Snackbar
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import CallEndIcon from '@mui/icons-material/CallEnd';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import server from '../environment';
import styles from '../styles/videoComponent.module.css';

const peerConfigConnections = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

let connections = {};

const VideoMeetComponent = () => {
    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoref = useRef();

    const navigate = useNavigate();

    const [videoAvailable, setVideoAvailable] = useState(false);
    const [audioAvailable, setAudioAvailable] = useState(false);
    const [video, setVideo] = useState(true); // Default to on
    const [audio, setAudio] = useState(true); // Default to on
    const [screen, setScreen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState(localStorage.getItem("username") || "");
    const [videos, setVideos] = useState([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const { url: roomParam } = useParams();
    const meetingCode = roomParam ?? "";
    const prevScreen = useRef(false);

    const handleCopyCode = async () => {
        const joinUrl = `${window.location.origin}/meet/${meetingCode}`;
        try {
            await navigator.clipboard.writeText(joinUrl);
            setSnackbarOpen(true);
        } catch {
            try {
                await navigator.clipboard.writeText(meetingCode);
                setSnackbarOpen(true);
            } catch {
                /* ignore */
            }
        }
    };

    useEffect(() => {
        getPermissions();
    }, []);

    const getPermissions = async () => {
        let hasVideo = false;
        let hasAudio = false;

        try {
            const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoStream) {
                hasVideo = true;
                setVideoAvailable(true);
                videoStream.getTracks().forEach((t) => t.stop());
            }
        } catch (e) {
            console.log("Video permission error: ", e);
        }

        try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioStream) {
                hasAudio = true;
                setAudioAvailable(true);
                audioStream.getTracks().forEach((t) => t.stop());
            }
        } catch (e) {
            console.log("Audio permission error: ", e);
        }

        if (navigator.mediaDevices.getDisplayMedia) {
            setScreenAvailable(true);
        }

        if (hasVideo || hasAudio) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: hasVideo,
                    audio: hasAudio
                });
                window.localStream = stream;
                if (localVideoref.current) {
                    localVideoref.current.srcObject = stream;
                }
            } catch (e) {
                console.log("Failed to get combined media stream:", e);
            }
        }
    };

    useEffect(() => {
        if (askForUsername || !meetingCode) {
            return undefined;
        }

        connectToSocketServer(meetingCode);

        return () => {
            Object.keys(connections).forEach((peerId) => {
                try {
                    connections[peerId].close();
                } catch {
                    /* ignore */
                }
                delete connections[peerId];
            });
            const s = socketRef.current;
            if (s) {
                s.removeAllListeners();
                s.disconnect();
                socketRef.current = null;
            }
            try {
                window.localStream?.getTracks().forEach((t) => t.stop());
            } catch {
                /* ignore */
            }
            window.localStream = undefined;
        };
    }, [askForUsername, meetingCode]);

    const getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop());
        } catch (e) { }

        window.localStream = stream;
        localVideoref.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }));
                    })
                    .catch(e => console.log(e));
            });
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                window.localStream = blackSilence();
                localVideoref.current.srcObject = window.localStream;

                for (let id in connections) {
                    connections[id].addStream(window.localStream);
                    connections[id].createOffer().then((description) => {
                        connections[id].setLocalDescription(description)
                            .then(() => {
                                socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }));
                            })
                            .catch(e => console.log(e));
                    });
                }
            } catch (e) { }
        });
    };

    const getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .catch((e) => console.log(e));
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) { }
        }
    };

    useEffect(() => {
        getUserMedia();
    }, [video, audio]);

    const getDisplayMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop());
        } catch (e) { }

        window.localStream = stream;
        localVideoref.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }));
                    })
                    .catch(e => console.log(e));
            });
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false);
            getUserMedia();
        });
    };

    useEffect(() => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices
                    .getDisplayMedia({ video: true, audio: true })
                    .then(getDisplayMediaSuccess)
                    .catch((e) => {
                        console.log(e);
                        setScreen(false);
                    });
            }
        } else if (prevScreen.current && !askForUsername) {
            getUserMedia();
        }
        prevScreen.current = screen;
    }, [screen, askForUsername]);

    const silence = () => {
        let ctx = new AudioContext();
        let oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    };

    const black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height });
        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    };

    const connectToSocketServer = (roomId) => {
        const socket = io(server, {
            transports: ["websocket", "polling"],
            withCredentials: true
        });
        socketRef.current = socket;

        socket.on("signal", gotMessageFromServer);
        socket.on("chat-message", addMessage);

        socket.on("user-left", (id) => {
            setVideos((videos) => videos.filter((video) => video.socketId !== id));
        });

        socket.on("user-joined", (id, clients) => {
            clients.forEach((socketListId) => {
                connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

                connections[socketListId].onicecandidate = (event) => {
                    if (event.candidate != null) {
                        socket.emit("signal", socketListId, JSON.stringify({ ice: event.candidate }));
                    }
                };

                connections[socketListId].onaddstream = (event) => {
                    setVideos((videos) => {
                        const exists = videos.some((v) => v.socketId === socketListId);
                        if (exists) {
                            return videos.map((v) =>
                                v.socketId === socketListId ? { ...v, stream: event.stream } : v
                            );
                        }
                        return [
                            ...videos,
                            {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true,
                            },
                        ];
                    });
                };

                if (window.localStream !== undefined && window.localStream !== null) {
                    connections[socketListId].addStream(window.localStream);
                } else {
                    const blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                    window.localStream = blackSilence();
                    connections[socketListId].addStream(window.localStream);
                }
            });

            if (id === socketIdRef.current) {
                for (const id2 in connections) {
                    if (id2 === socketIdRef.current) continue;

                    connections[id2].createOffer().then((description) => {
                        connections[id2]
                            .setLocalDescription(description)
                            .then(() => {
                                socket.emit(
                                    "signal",
                                    id2,
                                    JSON.stringify({ sdp: connections[id2].localDescription })
                                );
                            })
                            .catch((e) => console.log(e));
                    });
                }
            }
        });

        socket.on("connect", () => {
            socketIdRef.current = socket.id;
            socket.emit("join-call", roomId);
        });
    };

    const gotMessageFromServer = (fromId, message) => {
        const signal = JSON.parse(message);

        if (fromId !== socketIdRef.current && connections[fromId]) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit("signal", fromId, JSON.stringify({ "sdp": connections[fromId].localDescription }));
                            }).catch(e => console.log(e));
                        }).catch(e => console.log(e));
                    }
                }).catch(e => console.log(e));
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
            }
        }
    };

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);

        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prev) => prev + 1);
        }
    };

    const sendMessage = () => {
        if (!message.trim() || !socketRef.current) return;
        socketRef.current.emit("chat-message", message.trim(), username);
        setMessage("");
    };

    const handleVideo = () => setVideo(!video);
    const handleAudio = () => setAudio(!audio);
    const handleScreen = () => setScreen(!screen);
    const handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        } catch (e) { }
        navigate("/home");
    };

    const openChat = () => {
        setShowModal(true);
        setNewMessages(0);
    };

    const closeChat = () => setShowModal(false);

    if (!meetingCode) {
        return <Navigate to="/home" replace />;
    }

    return (
        <Box className={styles.meetVideoContainer}>
            {askForUsername ? (
                <Box className={styles.lobbyContainer}>
                    <Paper className={styles.lobbyCard} elevation={10}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                            <VideocamIcon sx={{ color: '#FF9839', fontSize: 40 }} />
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Meetrix</Typography>
                        </Box>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            You're about to join the meeting
                        </Typography>

                        <video className={styles.lobbyVideo} ref={localVideoref} autoPlay muted></video>

                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                            <IconButton 
                                onClick={handleVideo} 
                                sx={{ bgcolor: video ? 'rgba(0,0,0,0.1)' : '#f44336', color: video ? 'inherit' : 'white', '&:hover': { bgcolor: video ? 'rgba(0,0,0,0.2)' : '#d32f2f' } }}
                            >
                                {video ? <VideocamIcon /> : <VideocamOffIcon />}
                            </IconButton>
                            <IconButton 
                                onClick={handleAudio} 
                                sx={{ bgcolor: audio ? 'rgba(0,0,0,0.1)' : '#f44336', color: audio ? 'inherit' : 'white', '&:hover': { bgcolor: audio ? 'rgba(0,0,0,0.2)' : '#d32f2f' } }}
                            >
                                {audio ? <MicIcon /> : <MicOffIcon />}
                            </IconButton>
                        </Box>

                        <TextField
                            fullWidth
                            label="Display Name"
                            variant="outlined"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        <Button 
                            fullWidth 
                            variant="contained" 
                            size="large"
                            disabled={!username.trim()}
                            onClick={() => {
                                if (!username.trim()) return;
                                setAskForUsername(false);
                            }}
                            sx={{ bgcolor: '#FF9839', py: 1.5, fontSize: '1.1rem', '&:hover': { bgcolor: '#e68a33' } }}
                        >
                            Join meeting
                        </Button>
                    </Paper>
                </Box>
            ) : (
                <>
                    {/* Meeting Info */}
                    <Box className={styles.meetingInfo} sx={{ 
                        bgcolor: 'rgba(26, 33, 62, 0.9)', 
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 152, 57, 0.3)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        padding: '10px 20px',
                        borderRadius: '12px'
                    }}>
                        <Typography sx={{ fontWeight: 'bold', color: '#FF9839', fontSize: '1.1rem' }}>
                            Room ID: <span style={{ color: 'white', fontFamily: 'monospace', marginLeft: '8px' }}>{meetingCode}</span>
                        </Typography>
                        <Tooltip title="Copy join link">
                            <IconButton size="small" onClick={handleCopyCode} sx={{ color: 'white', ml: 1, '&:hover': { color: '#FF9839' } }}>
                                <ContentCopyIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* Conference View */}
                    <Box className={styles.conferenceView}>
                        {videos.map((v) => (
                            <Box key={v.socketId} className={styles.videoTile}>
                                <video 
                                    ref={(el) => { if (el) el.srcObject = v.stream; }} 
                                    autoPlay 
                                    playsInline
                                ></video>
                                <Box sx={{ position: 'absolute', bottom: 10, left: 10, bgcolor: 'rgba(0,0,0,0.5)', px: 1, borderRadius: 1 }}>
                                    <Typography variant="caption">Participant</Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    {/* Local Video */}
                    <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted></video>

                    {/* Control Bar */}
                    <Box className={styles.buttonContainers}>
                        <Tooltip title={video ? "Turn off camera" : "Turn on camera"}>
                            <IconButton onClick={handleVideo} sx={{ color: 'white', bgcolor: video ? 'rgba(255,255,255,0.1)' : '#f44336', '&:hover': { bgcolor: video ? 'rgba(255,255,255,0.2)' : '#d32f2f' } }}>
                                {video ? <VideocamIcon /> : <VideocamOffIcon />}
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={audio ? "Mute mic" : "Unmute mic"}>
                            <IconButton onClick={handleAudio} sx={{ color: 'white', bgcolor: audio ? 'rgba(255,255,255,0.1)' : '#f44336', '&:hover': { bgcolor: audio ? 'rgba(255,255,255,0.2)' : '#d32f2f' } }}>
                                {audio ? <MicIcon /> : <MicOffIcon />}
                            </IconButton>
                        </Tooltip>

                        {screenAvailable && (
                            <Tooltip title={screen ? "Stop sharing" : "Share screen"}>
                                <IconButton onClick={handleScreen} sx={{ color: screen ? '#FF9839' : 'white', bgcolor: 'rgba(255,255,255,0.1)' }}>
                                    {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                                </IconButton>
                            </Tooltip>
                        )}

                        <Tooltip title="Chat">
                            <IconButton onClick={openChat} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}>
                                <Badge badgeContent={newMessages} color="error">
                                    <ChatIcon />
                                </Badge>
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="End Call">
                            <IconButton onClick={handleEndCall} sx={{ color: 'white', bgcolor: '#f44336', '&:hover': { bgcolor: '#d32f2f' }, ml: 2 }}>
                                <CallEndIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* Chat Panel */}
                    <Box className={styles.chatRoom} sx={{ transform: showModal ? 'translateX(0)' : 'translateX(100%)' }}>
                        <Box className={styles.chatContainer}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>In-call Messages</Typography>
                                <IconButton onClick={closeChat} sx={{ color: 'white' }}>
                                    <CloseIcon />
                                </IconButton>
                            </Box>

                            <Box className={styles.chattingDisplay}>
                                {messages.map((msg, index) => (
                                    <Box key={index} className={styles.messageBubble}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#FF9839', mb: 0.5 }}>
                                            {msg.sender}
                                        </Typography>
                                        <Typography variant="body2">{msg.data}</Typography>
                                    </Box>
                                ))}
                            </Box>

                            <Box className={styles.chattingArea}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Send a message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    sx={{ 
                                        bgcolor: 'rgba(255,255,255,0.05)', 
                                        borderRadius: '8px',
                                        '& .MuiOutlinedInput-root': { color: 'white' } 
                                    }}
                                />
                                <IconButton onClick={sendMessage} sx={{ color: '#FF9839' }}>
                                    <SendIcon />
                                </IconButton>
                            </Box>
                        </Box>
                    </Box>

                    <Snackbar 
                        open={snackbarOpen} 
                        autoHideDuration={2000} 
                        onClose={() => setSnackbarOpen(false)}
                        message="Join link copied to clipboard"
                    />
                </>
            )}
        </Box>
    );
};

export default VideoMeetComponent;
