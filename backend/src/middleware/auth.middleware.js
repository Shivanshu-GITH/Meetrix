import jwt from "jsonwebtoken";
import httpStatus from "http-status";

const verifyToken = async (req, res, next) => {
    if (!process.env.JWT_SECRET) {
        console.error("FATAL: JWT_SECRET is not set. Refusing to verify tokens.");
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Server misconfiguration" });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(httpStatus.FORBIDDEN).json({ message: "Invalid or expired token" });
    }
};

export { verifyToken };
