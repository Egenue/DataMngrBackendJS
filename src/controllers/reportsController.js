import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import path from 'path';
import fs from 'fs';

const getReports = async (req, res) => {
    try {
        const queryParams = req.query;
        let where = {};

        if (queryParams.search) {
            where.OR = [
                { title: { contains: queryParams.search, mode: 'insensitive' } },
                { filename: { contains: queryParams.search, mode: 'insensitive' } }
            ];
        }
        if (queryParams.category && queryParams.category !== 'All') {
            where.category = queryParams.category;
        }
        if (queryParams.location && queryParams.location !== 'All') {
            where.location = queryParams.location;
        }
        
        // Non-admin can only see Approved
        if (req.user.role !== 'Admin') {
            where.status = 'Approved';
        } else if (queryParams.status && queryParams.status !== 'All') {
            where.status = queryParams.status;
        }

        const reports = await prisma.reports.findMany({
            where,
            orderBy: { created_at: 'desc' }
        });

        // Map BigInt to String to prevent JSON serialization errors
        const mappedReports = reports.map(r => ({
            ...r,
            file_size: r.file_size.toString()
        }));

        res.json(mappedReports);
    } catch (error) {
        console.error("Get reports error:", error);
        res.status(500).json({ message: "Failed to retrieve reports." });
    }
};

const uploadReport = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        const originalName = req.file.originalname;
        const fileName = req.file.filename;
        const destPath = path.join(__dirname, '../../Storage/Reports', fileName);
        
        let category = req.body.category || "General";
        let location = req.body.location || "All";

        const existingReport = await prisma.reports.findUnique({
            where: { filename: fileName }
        });

        let report;
        if (existingReport) {
            report = await prisma.reports.update({
                where: { id: existingReport.id },
                data: {
                    version: existingReport.version + 1,
                    file_size: req.file.size,
                    updated_at: new Date(),
                    storage_path: destPath
                }
            });
        } else {
            report = await prisma.reports.create({
                data: {
                    title: req.body.title || path.basename(fileName, path.extname(fileName)),
                    filename: fileName,
                    original_name: originalName,
                    file_size: req.file.size,
                    category: category,
                    location: location,
                    storage_path: destPath,
                    generated_by: req.user.username,
                    status: "Approved",
                    version: 1
                }
            });
        }

        await prisma.audit_logs.create({
            data: {
                user_id: req.user.id,
                username: req.user.username,
                action: existingReport ? "REPLACE_REPORT" : "UPLOAD_REPORT",
                module: "ReportManagement",
                details: `User uploaded report '${fileName}' (v${report.version})`,
                ip_address: req.ip || "127.0.0.1"
            }
        });

        // Convert BigInt for JSON
        const responseReport = { ...report, file_size: report.file_size.toString() };
        res.json({ message: "Report uploaded successfully.", report: responseReport });

    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "An error occurred while uploading." });
    }
};

const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await prisma.reports.findUnique({ where: { id: parseInt(id) } });

        if (!report) return res.status(404).json({ message: "Report not found." });

        if (fs.existsSync(report.storage_path)) {
            fs.unlinkSync(report.storage_path);
        }

        await prisma.reports.delete({ where: { id: parseInt(id) } });

        await prisma.audit_logs.create({
            data: {
                user_id: req.user.id,
                username: req.user.username,
                action: "DELETE_REPORT",
                module: "ReportManagement",
                details: `Deleted report '${report.filename}'`,
                ip_address: req.ip || "127.0.0.1"
            }
        });

        res.json({ message: "Report deleted successfully." });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ message: "An error occurred during deletion." });
    }
};

const getStats = async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);

        const generatedToday = await prisma.reports.count({
            where: { created_at: { gte: todayStart } }
        });
        
        const downloadsToday = await prisma.download_histories.count({
            where: { downloaded_at: { gte: todayStart } }
        });

        const activeUsers = await prisma.users.count({
            where: { is_active: true }
        });

        const failedReports = await prisma.audit_logs.count({
            where: {
                module: "ReportManagement",
                action: "GENERATION_FAILED",
                created_at: { gte: todayStart }
            }
        });

        res.json({
            reportsGeneratedToday: generatedToday,
            downloadsToday: downloadsToday,
            activeUsers: activeUsers,
            failedGenerations: failedReports
        });
    } catch (error) {
        console.error("Stats error:", error);
        res.status(500).json({ message: "An error occurred fetching stats." });
    }
};

const downloadReport = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await prisma.reports.findUnique({ where: { id: parseInt(id) } });

        if (!report || !fs.existsSync(report.storage_path)) {
            return res.status(404).json({ message: "Report file not found." });
        }

        await prisma.reports.update({
            where: { id: parseInt(id) },
            data: { download_count: report.download_count + 1 }
        });

        await prisma.download_histories.create({
            data: {
                user_id: req.user.id,
                username: req.user.username,
                user_email: req.user.email,
                report_id: report.id,
                report_title: report.title,
                filename: report.filename,
                ip_address: req.ip || "127.0.0.1"
            }
        });

        res.download(report.storage_path, report.original_name);
    } catch (error) {
        console.error("Download error:", error);
        res.status(500).json({ message: "Failed to download file." });
    }
};

module.exports = { getReports, uploadReport, deleteReport, getStats, downloadReport };
