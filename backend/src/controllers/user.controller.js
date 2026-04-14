import httpStatus from 'http-status';
import { User } from '../models/user.model.js';
import { Meeting } from '../models/meeting.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const MEETING_CODE_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

function sanitizeString(value) {
    return typeof value === "string" ? value.trim() : "";
}

const register = async (req, res) => {
    let { name, username, password } = req.body;

    try {
        name = sanitizeString(name);
        username = sanitizeString(username).toLowerCase();
        password = sanitizeString(password);

        if (!name || !username || !password) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "All fields are required" });
        }

        // Validation
        if (name.length < 2 || name.length > 60) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Name must be between 2 and 60 characters",
            });
        }

        if (!USERNAME_REGEX.test(username)) {
            return res.status(httpStatus.BAD_REQUEST).json({ 
                message: "Username must be 3-20 characters and only contain alphanumeric characters or underscores" 
            });
        }

        if (password.length < 8 || password.length > 128) {
            return res.status(httpStatus.BAD_REQUEST).json({ 
                message: "Password must be between 8 and 128 characters long" 
            });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({ message: "Username already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            username,
            password: hashedPassword
        });

        await newUser.save();

        return res.status(httpStatus.CREATED).json({ message: "User registered successfully" });
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
    }
};

const login = async (req, res) => {
    let { username, password } = req.body;

    try {
        username = sanitizeString(username).toLowerCase();
        password = sanitizeString(password);

        if (!username || !password) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "All fields are required" });
        }
        if (!process.env.JWT_SECRET) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Server misconfiguration" });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid credentials" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (isPasswordCorrect) {
            const token = jwt.sign(
                { id: user._id, username: user.username },
                process.env.JWT_SECRET,
                {
                    expiresIn: "7d",
                    algorithm: "HS256",
                    issuer: process.env.JWT_ISSUER || "meetrix-api",
                    audience: process.env.JWT_AUDIENCE || "meetrix-client",
                }
            );

            return res.status(httpStatus.OK).json({
                token,
                username: user.username,
                name: user.name
            });
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid credentials" });
        }
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
    }
};

const getUserHistory = async (req, res) => {
    try {
        const username = req.user?.username;
        if (!username) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token payload" });
        }

        const meetings = await Meeting.find({ user_id: username });

        return res.status(httpStatus.OK).json(meetings);
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
    }
};

/** Stateless JWT: client should discard the token. True server-side invalidation needs a blocklist (e.g. Redis) — future enhancement. */
const logout = async (req, res) => {
    return res.status(httpStatus.OK).json({ message: "Logged out" });
};

const addToHistory = async (req, res) => {
    const { meeting_code } = req.body;

    try {
        const code = sanitizeString(meeting_code);

        if (!code) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "Meeting code is required" });
        }
        if (!MEETING_CODE_REGEX.test(code)) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Meeting code may only contain letters, numbers, hyphens, and underscores.",
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: code
        });

        await newMeeting.save();

        return res.status(httpStatus.CREATED).json({ message: "Added to history" });
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
    }
};

export { register, login, getUserHistory, addToHistory, logout };
