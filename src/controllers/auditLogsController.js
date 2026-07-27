import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const getSystemLogs = async (req, res) => {
    try {
        const queryParams = req.query;
        let where = {};
        
        if (queryParams.search) {
            where.OR = [
                { action: { contains: queryParams.search, mode: 'insensitive' } },
                { details: { contains: queryParams.search, mode: 'insensitive' } }
            ];
        }
        
        if (queryParams.module && queryParams.module !== 'All') {
            where.module = queryParams.module;
        }

        const logs = await prisma.audit_logs.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: 200
        });
        
        const mappedLogs = logs.map(l => ({
            id: l.id,
            userId: l.user_id,
            username: l.username,
            action: l.action,
            module: l.module,
            details: l.details,
            ipAddress: l.ip_address,
            createdAt: l.created_at
        }));
        
        res.json(mappedLogs);
    } catch (error) {
        console.error("Get system logs error:", error);
        res.status(500).json({ message: "Failed to retrieve system logs." });
    }
};

const getDownloadHistory = async (req, res) => {
    try {
        const history = await prisma.download_histories.findMany({
            orderBy: { downloaded_at: 'desc' },
            take: 200
        });
        
        const mappedHistory = history.map(h => ({
            id: h.id,
            userId: h.user_id,
            username: h.username,
            userEmail: h.user_email,
            reportId: h.report_id,
            reportTitle: h.report_title,
            filename: h.filename,
            downloadedAt: h.downloaded_at,
            ipAddress: h.ip_address
        }));
        
        res.json(mappedHistory);
    } catch (error) {
        console.error("Get download history error:", error);
        res.status(500).json({ message: "Failed to retrieve download history." });
    }
};

const getLoginHistory = async (req, res) => {
    try {
        const history = await prisma.login_histories.findMany({
            orderBy: { login_at: 'desc' },
            take: 200
        });
        
        const mappedHistory = history.map(h => ({
            id: h.id,
            userId: h.user_id,
            username: h.username,
            loginAt: h.login_at,
            logoutAt: h.logout_at,
            isSuccess: h.is_success,
            ipAddress: h.ip_address,
            deviceInfo: h.device_info,
            failureReason: h.failure_reason
        }));
        
        res.json(mappedHistory);
    } catch (error) {
        console.error("Get login history error:", error);
        res.status(500).json({ message: "Failed to retrieve login history." });
    }
};

export { getSystemLogs, getDownloadHistory, getLoginHistory };
