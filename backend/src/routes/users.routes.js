import { Router } from "express";
import { login, register, addToHistory, getUserHistory } from "../controllers/user.controller.js";
import { rateLimit } from 'express-rate-limit';
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 10, // Limit each IP to 10 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-7', // set `RateLimit` and `RateLimit-Policy` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: "Too many requests, please try again later"
});

router.route("/login").post(authLimiter, login);
router.route("/register").post(authLimiter, register);
router.route("/add_to_activity").post(verifyToken, addToHistory);
router.route("/get_all_activity").get(verifyToken, getUserHistory);

export default router;
