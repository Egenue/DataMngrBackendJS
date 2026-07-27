import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const getHistory = async (req, res) => {
    try {
        const emails = await prisma.email_logs.findMany({
            orderBy: { sent_at: 'desc' }
        });
        
        const mappedEmails = emails.map(e => ({
            id: e.id,
            subject: e.subject,
            content: e.content,
            recipientGroup: e.recipient_group,
            recipientsCount: e.recipients_count,
            status: e.status,
            sentAt: e.sent_at,
            createdBy: e.created_by,
            hasAttachment: e.has_attachment,
            attachedReportName: e.attached_report_name
        }));
        
        res.json(mappedEmails);
    } catch (error) {
        console.error("Get email history error:", error);
        res.status(500).json({ message: "Failed to retrieve email history." });
    }
};

const getGroups = async (req, res) => {
    try {
        const groups = [
            { id: 1, name: "Enumerators" },
            { id: 2, name: "Supervisors" },
            { id: 3, name: "Managers" },
            { id: 4, name: "All Staff" }
        ];
        res.json(groups);
    } catch (error) {
        console.error("Get email groups error:", error);
        res.status(500).json({ message: "Failed to retrieve email groups." });
    }
};

export { getHistory, getGroups };
