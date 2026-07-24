import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const getNotifications = async (req, res) => {
    try {
        const includeArchived = req.query.includeArchived === 'true';
        let where = {};
        if (!includeArchived) {
            where.is_archived = false;
        }

        const notifications = await prisma.notifications.findMany({
            where,
            orderBy: { created_at: 'desc' }
        });

        res.json(notifications);
    } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({ message: "Failed to retrieve notifications." });
    }
};

const createNotification = async (req, res) => {
    try {
        const { title, message, category, priority } = req.body;
        
        const newNotification = await prisma.notifications.create({
            data: {
                title,
                message,
                category: category || "System",
                priority: priority || "Normal",
                created_by: req.user.username,
                is_archived: false
            }
        });

        res.json(newNotification);
    } catch (error) {
        console.error("Create notification error:", error);
        res.status(500).json({ message: "Failed to create notification." });
    }
};

const archiveNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await prisma.notifications.findUnique({ where: { id: parseInt(id) } });

        if (!notification) return res.status(404).json({ message: "Notification not found." });

        await prisma.notifications.update({
            where: { id: parseInt(id) },
            data: { is_archived: true }
        });

        res.json({ message: "Notification archived successfully." });
    } catch (error) {
        console.error("Archive error:", error);
        res.status(500).json({ message: "An error occurred during archiving." });
    }
};

module.exports = { getNotifications, createNotification, archiveNotification };
