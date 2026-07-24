import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

const login = async (req, res) => {
    const { email, username, password } = req.body;
    const identifier = email || username;

    try {
        const user = await prisma.users.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            }
        });

        if (!user || !user.is_active) {
            await prisma.login_histories.create({
                data: {
                    username: identifier,
                    is_success: false,
                    failure_reason: "Invalid credentials or inactive account",
                    ip_address: req.ip || "127.0.0.1"
                }
            });
            return res.status(401).json({ message: "Invalid username or password." });
        }

        let validPassword = false;
        try {
            validPassword = await bcrypt.compare(password, user.password_hash);
        } catch (e) {
            console.error("Bcrypt compare error (likely invalid hash format):", e.message);
        }

        if (!validPassword) {
            await prisma.login_histories.create({
                data: {
                    user_id: user.id,
                    username: identifier,
                    is_success: false,
                    failure_reason: "Invalid password",
                    ip_address: req.ip || "127.0.0.1"
                }
            });
            return res.status(401).json({ message: "Invalid username or password." });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        await prisma.users.update({
            where: { id: user.id },
            data: { last_login_at: new Date() }
        });

        const loginHistory = await prisma.login_histories.create({
            data: {
                user_id: user.id,
                username: identifier,
                is_success: true,
                ip_address: req.ip || "127.0.0.1"
            }
        });

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                department: user.department
            },
            sessionId: loginHistory.id
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "An error occurred during login." });
    }
};

const logout = async (req, res) => {
    const { sessionId } = req.body;

    if (sessionId) {
        try {
            await prisma.login_histories.update({
                where: { id: sessionId },
                data: { logout_at: new Date() }
            });
        } catch (error) {
            console.error("Logout error:", error);
        }
    }
    res.json({ message: "Logged out successfully" });
};

export { login, logout };
