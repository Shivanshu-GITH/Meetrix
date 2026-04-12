import httpStatus from 'http-status';
import { User } from '../models/user.model.js';
import { Meeting } from '../models/meeting.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const register = async (req, res) => {
    let { name, username, password } = req.body;

    try {
        if (!name || !username || !password) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "All fields are required" });
        }

        // Input Sanitization
        name = name.trim();
        username = username.trim().toLowerCase();

        // Validation
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            return res.status(httpStatus.BAD_REQUEST).json({ 
                message: "Username must be 3-20 characters and only contain alphanumeric characters or underscores" 
            });
        }

        if (password.length < 6) {
            return res.status(httpStatus.BAD_REQUEST).json({ 
                message: "Password must be at least 6 characters long" 
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
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message}` });
    }
};

const login = async (req, res) => {
    let { username, password } = req.body;

    try {
        if (!username || !password) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "All fields are required" });
        }

        username = username.trim().toLowerCase();

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (isPasswordCorrect) {
            const token = jwt.sign(
                { id: user._id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            user.token = token;
            await user.save();

            return res.status(httpStatus.OK).json({
                token,
                username: user.username,
                name: user.name
            });
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid credentials" });
        }
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message}` });
    }
};

const getUserHistory = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }

        const meetings = await Meeting.find({ user_id: user.username });

        return res.status(httpStatus.OK).json(meetings);
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message}` });
    }
};

const addToHistory = async (req, res) => {
    const { meeting_code } = req.body;

    try {
        if (!meeting_code || typeof meeting_code !== "string" || !meeting_code.trim()) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "Meeting code is required" });
        }

        const code = meeting_code.trim();
        if (code.length > 64) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "Meeting code is too long" });
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
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message}` });
    }
};

export { register, login, getUserHistory, addToHistory };
