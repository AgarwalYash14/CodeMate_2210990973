const User = require("../models/user");
const bycrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");

const validator = require("validator");

//User registration
const register = async (req, res) => {
    const { name, email, password, role } = req.body;

    // Checking for validation
    if (!name || !email || !password)
        return res.status(400).json({ message: "Please fill all fields" });
    if (!validator.isEmail(email))
        return res.status(400).json({ message: "Please enter a valid email" });
    if (!validator.isStrongPassword(password))
        return res.status(400).json({ message: "Password must be strong" });

    try {
        //Checking if user already exists in database or not
        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: "User already exists" });

        //Hashing password
        const hashPassword = await bycrypt.hash(password, 10);

        //Creating user
        const newUser = await User.create({
            name,
            email,
            password: hashPassword,
            role,
        });
        await newUser.save();

        //Generating token
        const token = generateToken(newUser);

        // Set cookie
        res.cookie("authToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        return res.status(201).json({
            message: "User added Successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
            },
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

//User login
const login = async (req, res) => {
    const { email, password } = req.body;

    // Checking for validation
    if (!email || !password)
        return res.status(400).json({ message: "Please fill all fields" });
    try {
        //Checking if user exists in database or not
        const userExists = await User.findOne({ email });
        if (!userExists)
            return res.status(400).json({ message: "No user found" });

        //Checking if password is correct as compared to in database
        const isValid = await bycrypt.compare(password, userExists.password);
        if (!isValid)
            return res.status(400).json({ message: "Incorrect password" });

        //Generating token
        const token = generateToken(userExists);

        // Set cookie
        res.cookie("authToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        return res.status(200).json({
            message: "Login successful",
            user: {
                id: userExists._id,
                name: userExists.name,
                email: userExists.email,
                role: userExists.role,
            },
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

//User logout
const logout = async (req, res) => {
    try {
        // Clear the authToken cookie
        res.cookie("authToken", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 0, // Expire immediately
        });

        return res.status(200).json({
            message: "Logout successful",
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

module.exports = { register, login, logout };
