import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import {
    Box, Button, TextField, Typography, IconButton,
    Badge, Tooltip, Paper, Snackbar, Alert
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

function addLocalTracksToPeer(pc: RTCPeerConnection, stream: MediaStream | null) {
    if (!stream) return;
    stream.getTracks().forEach((track) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === track.kind);
        if (sender) {
            sender.replaceTrack(track).catch(() => {});
        } else {
            try {
                pc.addTrack(track, stream);
            } catch (e) {
                console.log(e);
            }
        }
    });
}

interface VideoParticipant {
    socketId: string;
    stream: MediaStream;
    autoplay: boolean;
    playsinline: boolean;
}

interface Message {
    sender: string;
    data: string;
}

const VideoMeetComponent: React.FC = () => {
    const socketRef = useRef<Socket | null>(null);
    const socketIdRef = useRef<string | undefined>(undefined);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const connectionsRef = useRef<{ [key: string]: RTCPeerConnection }>({});
    const audioCtxRef = useRef<AudioContext | null>(null);
    const getUserMediaRef = useRef<() => void>(() => {});
    const roomFullNavTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const navigate = useNavigate();

    const [videoAvailable, setVideoAvailable] = useState(false);
    const [audioAvailable, setAudioAvailable] = useState(false);
    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(true);
    const [screen, setScreen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState(localStorage.getItem("username") || "");
    const [videos, setVideos] = useState<VideoParticipant[]>([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [roomFullSnack, setRoomFullSnack] = useState({ open: false, message: "" });

    const { url: roomParam } = useParams<{ url: string }>();
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

    const silence = useCallback(() => {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) {
            return null;
        }
        if (!audioCtxRef.current) {
            audioCtxRef.current = new Ctx();
        }
        const ctx = audioCtxRef.current!;
        const oscillator = ctx.createOscillator();
        const dst = ctx.createMediaStreamDestination();
        oscillator.connect(dst);
        oscillator.start();
        ctx.resume().catch(() => {});
        const track = dst.stream.getAudioTracks()[0];
        return track ? Object.assign(track, { enabled: false }) : null;
    }, []);

    const black = useCallback(({ width = 640, height = 480 } = {}) => {
        const canvas = Object.assign(document.createElement("canvas"), { width, height });
        canvas.getContext("2d")!.fillRect(0, 0, width, height);
        const stream = (canvas as unknown as { captureStream: () => MediaStream }).captureStream();
        const track = stream.getVideoTracks()[0];
        return track ? Object.assign(track, { enabled: false }) : null;
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

        if (typeof navigator.mediaDevices.getDisplayMedia === 'function') {
            setScreenAvailable(true);
        }

        if (hasVideo || hasAudio) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: hasVideo,
                    audio: hasAudio
                });
                localStreamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } catch (e) {
                console.log("Failed to get combined media stream:", e);
            }
        }
    };

    useEffect(() => {
        const init = async () => {
            await getPermissions();
        };
        init();
    }, []);

    const getUserMediaSuccess = useCallback((stream: MediaStream) => {
        try {
            localStreamRef.current?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        } catch {
            /* ignore */
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        const peers = connectionsRef.current;
        for (const id of Object.keys(peers)) {
            if (id === socketIdRef.current) continue;
            const pc = peers[id];
            addLocalTracksToPeer(pc, localStreamRef.current);
            pc.createOffer()
                .then((description) =>
                    pc.setLocalDescription(description).then(() => {
                        socketRef.current?.emit(
                            "signal",
                            id,
                            JSON.stringify({ sdp: pc.localDescription })
                        );
                    })
                )
                .catch((e) => console.log(e));
        }

        stream.getTracks().forEach((track) => {
            track.onended = () => {
                setVideo(false);
                setAudio(false);
                try {
                    const silent = silence();
                    const videoTrack = black();
                    const tracks = [videoTrack, silent].filter(Boolean) as MediaStreamTrack[];
                    const newStream = new MediaStream(tracks);
                    localStreamRef.current = newStream;
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = newStream;
                    }
                    for (const id of Object.keys(connectionsRef.current)) {
                        if (id === socketIdRef.current) continue;
                        const pc = connectionsRef.current[id];
                        addLocalTracksToPeer(pc, localStreamRef.current);
                        pc.createOffer()
                            .then((description) =>
                                pc.setLocalDescription(description).then(() => {
                                    socketRef.current?.emit(
                                        "signal",
                                        id,
                                        JSON.stringify({ sdp: pc.localDescription })
                                    );
                                })
                            )
                            .catch((e) => console.log(e));
                    }
                } catch {
                    /* ignore */
                }
            };
        });
    }, [black, silence]);

    const getUserMedia = useCallback(() => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices
                .getUserMedia({ video, audio })
                .then(getUserMediaSuccess)
                .catch((e) => console.log(e));
        } else {
            try {
                const tracks = localVideoRef.current?.srcObject instanceof MediaStream ? localVideoRef.current?.srcObject?.getTracks() : [];
                tracks?.forEach((t) => t.stop());
            } catch {
                /* ignore */
            }
        }
    }, [video, audio, videoAvailable, audioAvailable, getUserMediaSuccess]);

    useEffect(() => {
        getUserMediaRef.current = getUserMedia;
    }, [getUserMedia]);

    useEffect(() => {
        getUserMedia();
    }, [getUserMedia]);

    const getDisplayMediaSuccess = useCallback((stream: MediaStream) => {
        try {
            localStreamRef.current?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        } catch {
            /* ignore */
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        for (const id of Object.keys(connectionsRef.current)) {
            if (id === socketIdRef.current) continue;
            const pc = connectionsRef.current[id];
            addLocalTracksToPeer(pc, localStreamRef.current);
            pc.createOffer()
                .then((description) =>
                    pc.setLocalDescription(description).then(() => {
                        socketRef.current?.emit(
                            "signal",
                            id,
                            JSON.stringify({ sdp: pc.localDescription })
                        );
                    })
                )
                .catch((e) => console.log(e));
        }

        stream.getTracks().forEach((track) => {
            track.onended = () => {
                setScreen(false);
                getUserMediaRef.current();
            };
        });
    }, []);

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
    }, [screen, askForUsername, getDisplayMediaSuccess, getUserMedia]);

    const gotMessageFromServer = useCallback((fromId: string, msg: string) => {
        const signal = JSON.parse(msg);
        const peers = connectionsRef.current;
        if (fromId === socketIdRef.current || !peers[fromId]) return;

        const pc = peers[fromId];
        if (signal.sdp) {
            pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
                .then(() => {
                    if (signal.sdp.type === "offer") {
                        return pc.createAnswer().then((description) =>
                            pc.setLocalDescription(description).then(() => {
                                socketRef.current?.emit(
                                    "signal",
                                    fromId,
                                    JSON.stringify({ sdp: pc.localDescription })
                                );
                            })
                        );
                    }
                })
                .catch((e) => console.log(e));
        }

        if (signal.ice) {
            pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch((e) => console.log(e));
        }
    }, []);

    const addMessage = useCallback((data: string, sender: string, socketIdSender: string) => {
        setMessages((prev) => [...prev, { sender, data }]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prev) => prev + 1);
        }
    }, []);

    const connectToSocketServer = (roomId: string) => {
        const socket = io(server, {
            transports: ["websocket", "polling"],
            withCredentials: true
        });
        socketRef.current = socket;

        socket.on("signal", gotMessageFromServer);
        socket.on("chat-message", addMessage);

        socket.on("room-full", () => {
            setRoomFullSnack({
                open: true,
                message: "This meeting is full. Maximum participants reached.",
            });
            if (roomFullNavTimerRef.current) {
                clearTimeout(roomFullNavTimerRef.current);
            }
            roomFullNavTimerRef.current = setTimeout(() => {
                roomFullNavTimerRef.current = null;
                navigate("/home");
            }, 2800);
        });

        socket.on("user-left", (id: string) => {
            setVideos((v) => v.filter((video) => video.socketId !== id));
        });

        socket.on("user-joined", (id: string, clients: string[]) => {
            clients.forEach((socketListId) => {
                const pc = new RTCPeerConnection(peerConfigConnections);
                connectionsRef.current[socketListId] = pc;

                pc.onicecandidate = (event) => {
                    if (event.candidate != null) {
                        socket.emit("signal", socketListId, JSON.stringify({ ice: event.candidate }));
                    }
                };

                pc.ontrack = (event) => {
                    const stream =
                        event.streams[0] ??
                        (event.track ? new MediaStream([event.track]) : null);
                    if (!stream) return;
                    setVideos((videos) => {
                        const exists = videos.some((v) => v.socketId === socketListId);
                        if (exists) {
                            return videos.map((v) =>
                                v.socketId === socketListId ? { ...v, stream } : v
                            );
                        }
                        return [
                            ...videos,
                            {
                                socketId: socketListId,
                                stream,
                                autoplay: true,
                                playsinline: true,
                            },
                        ];
                    });
                };

                if (localStreamRef.current != null) {
                    addLocalTracksToPeer(pc, localStreamRef.current);
                } else {
                    const silent = silence();
                    const videoTrack = black();
                    const tracks = [videoTrack, silent].filter(Boolean) as MediaStreamTrack[];
                    localStreamRef.current = new MediaStream(tracks);
                    addLocalTracksToPeer(pc, localStreamRef.current);
                }
            });

            if (id === socketIdRef.current) {
                for (const id2 of Object.keys(connectionsRef.current)) {
                    if (id2 === socketIdRef.current) continue;
                    const peer = connectionsRef.current[id2];
                    peer.createOffer()
                        .then((description) =>
                            peer.setLocalDescription(description).then(() => {
                                socket.emit(
                                    "signal",
                                    id2,
                                    JSON.stringify({ sdp: peer.localDescription })
                                );
                            })
                        )
                        .catch((e) => console.log(e));
                }
            }
        });

        socket.on("connect", () => {
            socketIdRef.current = socket.id;
            socket.emit("join-call", roomId);
        });
    };

    useEffect(() => {
        if (askForUsername || !meetingCode) {
            return undefined;
        }

        connectToSocketServer(meetingCode);

        return () => {
            if (roomFullNavTimerRef.current) {
                clearTimeout(roomFullNavTimerRef.current);
                roomFullNavTimerRef.current = null;
            }
            Object.keys(connectionsRef.current).forEach((peerId) => {
                try {
                    connectionsRef.current[peerId].close();
                } catch {
                    /* ignore */
                }
                delete connectionsRef.current[peerId];
            });
            const s = socketRef.current;
            if (s) {
                s.removeAllListeners();
                s.disconnect();
                socketRef.current = null;
            }
            try {
                const tracks = localVideoRef.current?.srcObject instanceof MediaStream ? localVideoRef.current?.srcObject?.getTracks() : [];
                tracks?.forEach((t) => t.stop());
            } catch {
                /* ignore */
            }
            localStreamRef.current = null;
            try {
                const ctx = audioCtxRef.current;
                if (ctx && ctx.state !== "closed") {
                    ctx.close();
                }
            } catch {
                /* ignore */
            }
            audioCtxRef.current = null;
        };
        // Intentionally only room/session gates: socket handlers read refs / stable callbacks.
    }, [askForUsername, meetingCode]);

    const sendMessage = () => {
        if (!message.trim() || !socketRef.current) return;
        socketRef.current.emit("chat-message", message.trim(), username);
        setMessage("");
    };

    const handleVideo = () => setVideo(!video);
    const handleAudio = () => setAudio(!audio);
    const handleScreen = () => setScreen(!screen);

    const handleEndCall = () => {
        if (roomFullNavTimerRef.current) {
            clearTimeout(roomFullNavTimerRef.current);
            roomFullNavTimerRef.current = null;
        }
        Object.keys(connectionsRef.current).forEach((id) => {
            try {
                connectionsRef.current[id].close();
            } catch {
                /* ignore */
            }
            delete connectionsRef.current[id];
        });
        connectionsRef.current = {};

        if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        try {
            const tracks = localVideoRef.current?.srcObject instanceof MediaStream ? localVideoRef.current?.srcObject?.getTracks() : [];
            tracks?.forEach((t) => t.stop());
        } catch {
            /* ignore */
        }
        try {
            const ctx = audioCtxRef.current;
            if (ctx && ctx.state !== "closed") {
                ctx.close();
            }
        } catch {
            /* ignore */
        }
        audioCtxRef.current = null;
        localStreamRef.current = null;

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
            <Snackbar
                open={roomFullSnack.open}
                autoHideDuration={4000}
                onClose={() => setRoomFullSnack((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    severity="error"
                    variant="filled"
                    onClose={() => setRoomFullSnack((s) => ({ ...s, open: false }))}
                    sx={{ width: "100%" }}
                >
                    {roomFullSnack.message}
                </Alert>
            </Snackbar>

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

                        <video className={styles.lobbyVideo} ref={localVideoRef} autoPlay muted></video>

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

                    <Box className={styles.conferenceView}>
                        {videos.map((v) => (
                            <Box key={v.socketId} className={styles.videoTile}>
                                <video
                                    ref={(el) => {
                                        if (el) el.srcObject = v.stream;
                                    }}
                                    autoPlay
                                    playsInline
                                ></video>
                                <Box sx={{ position: 'absolute', bottom: 10, left: 10, bgcolor: 'rgba(0,0,0,0.5)', px: 1, borderRadius: 1 }}>
                                    <Typography variant="caption">Participant</Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    <video className={styles.meetUserVideo} ref={localVideoRef} autoPlay muted></video>

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
