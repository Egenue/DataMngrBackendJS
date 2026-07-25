import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

const getUsers = async (req, res) => {
    try {
        const users = await prisma.users.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                department: true,
                is_active: true,
                created_at: true,
                last_login_at: true
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users" });
    }
};

const createUser = async (req, res) => {
    try {
        const { username, email, password, role, department } = req.body;
        
        const existingUser = await prisma.users.findFirst({
            where: {
                OR: [{ username }, { email }]
            }
        });

        if (existingUser) {
            return res.status(400).json({ message: "Username or email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await prisma.users.create({
            data: {
                username,
                email,
                password_hash: hashedPassword,
                role: role,
                department: department,
                is_active: true
            },
            select: { id: true, username: true, email: true, role: true }
        });

        res.json(newUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating user" });
    }
};

const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.users.findUnique({ where: { id: parseInt(id) } });

        if (!user) return res.status(404).json({ message: "User not found." });

        const updatedUser = await prisma.users.update({
            where: { id: parseInt(id) },
            data: { is_active: !user.is_active },
            select: { id: true, username: true, is_active: true }
        });

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: "Error updating user status" });
    }
};

const getAuditLogs = async (req, res) => {
    try {
        const logs = await prisma.audit_logs.findMany({
            orderBy: { created_at: 'desc' },
            take: 100
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: "Error fetching audit logs" });
    }
};

export { getUsers, createUser, toggleUserStatus, getAuditLogs };
