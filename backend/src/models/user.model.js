import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        token: {
            type: String
        }
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export { User };
