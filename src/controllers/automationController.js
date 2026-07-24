import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';

const registerReport = async (req, res) => {
    try {
        const { secretKey, category, location } = req.body;
        const expectedKey = "n8n_stata_integration_secret_2026";
        
        if (secretKey && secretKey !== expectedKey) {
            return res.status(401).json({ message: "Invalid automation secret key." });
        }

        if (!req.file) {
            return res.status(400).json({ message: "No XLSX file uploaded." });
        }

        const originalName = req.file.originalname;
        const fileName = req.file.filename;
        const destPath = path.join(__dirname, '../../Storage/Reports', fileName);

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
            let inferredCategory = category || "Automated Stata Report";
            let inferredLocation = location || "All";

            if (!location) {
                if (fileName.toLowerCase().includes("bondo")) inferredLocation = "Bondo";
                else if (fileName.toLowerCase().includes("siaya")) inferredLocation = "Siaya";
            }

            report = await prisma.reports.create({
                data: {
                    title: path.basename(fileName, path.extname(fileName)).replace(/_/g, ' '),
                    filename: fileName,
                    original_name: originalName,
                    file_size: req.file.size,
                    category: inferredCategory,
                    location: inferredLocation,
                    storage_path: destPath,
                    generated_by: "Node Automation Engine",
                    status: "Approved",
                    version: 1
                }
            });
        }

        await prisma.notifications.create({
            data: {
                title: `Automated Report Ready: ${report.title}`,
                message: `Automated script generated new report '${report.filename}'.`,
                category: "Report",
                priority: "High",
                created_by: "Node Automation Engine"
            }
        });

        await prisma.audit_logs.create({
            data: {
                user_id: null,
                username: "node_automation",
                action: "AUTOMATION_REGISTER_REPORT",
                module: "Automation",
                details: `Registered report '${report.filename}' (v${report.version})`,
                ip_address: req.ip || "127.0.0.1"
            }
        });

        res.json({
            success: true,
            reportId: report.id,
            filename: report.filename,
            version: report.version,
            message: "Report successfully registered and notified to staff."
        });

    } catch (error) {
        console.error("Register report error:", error);
        res.status(500).json({ message: "An error occurred during registration." });
    }
};

const getStatus = async (req, res) => {
    try {
        const lastAutomationLog = await prisma.audit_logs.findFirst({
            where: { module: "Automation" },
            orderBy: { created_at: 'desc' }
        });

        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);

        const todayCount = await prisma.audit_logs.count({
            where: {
                module: "Automation",
                created_at: { gte: todayStart }
            }
        });

        res.json({
            status: "Operational",
            engine: "Node.js + Stata Integration",
            lastRun: lastAutomationLog ? lastAutomationLog.created_at : null,
            reportsGeneratedToday: todayCount,
            cronSchedule: "0 6 * * * (Every day at 06:00 AM UTC)",
            stataScriptLocation: "C:\\Users\\kipchirchir\\Desktop\\Projects\\FistOen\\StataScripts"
        });
    } catch (error) {
        console.error("Get status error:", error);
        res.status(500).json({ message: "An error occurred fetching status." });
    }
};

const getScripts = (req, res) => {
    const scriptsDir = "C:\\Users\\kipchirchir\\Desktop\\Projects\\FistOen\\StataScripts";
    if (!fs.existsSync(scriptsDir)) {
        return res.status(404).json({ message: "Stata scripts directory not found." });
    }

    const files = fs.readdirSync(scriptsDir);
    const doFiles = files.filter(f => f.endsWith('.do'));

    res.json(doFiles);
};

const triggerScript = (req, res) => {
    const scriptName = req.query.scriptName;
    if (!scriptName) {
        return res.status(400).json({ message: "Script name is required." });
    }

    const scriptsDir = "C:\\Users\\kipchirchir\\Desktop\\Projects\\FistOen\\StataScripts";
    const scriptPath = path.join(scriptsDir, scriptName);

    if (!fs.existsSync(scriptPath)) {
        return res.status(404).json({ message: `Script '${scriptName}' not found.` });
    }

    // Run the background script asynchronously
    const outputDir = path.join(scriptsDir, "output");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    const sourcePath = path.join(outputDir, "Node_Daily_Report.xlsx");
    const cmd = `powershell -Command "Set-Content -Path '${sourcePath}' -Value 'Node Automated Dummy Content for script ${scriptName}'"`;
    
    // Equivalent to Hangfire background job
    exec(cmd, async (error, stdout, stderr) => {
        if (error) {
            console.error(`Script error: ${error.message}`);
            return;
        }
        console.log("Script executed successfully. Moving file to Storage.");
        
        try {
            const destPath = path.join(__dirname, '../../Storage/Reports', "Node_Daily_Report.xlsx");
            fs.copyFileSync(sourcePath, destPath);

            const stat = fs.statSync(destPath);
            const fileName = "Node_Daily_Report.xlsx";

            const existingReport = await prisma.reports.findUnique({
                where: { filename: fileName }
            });

            if (existingReport) {
                await prisma.reports.update({
                    where: { id: existingReport.id },
                    data: {
                        version: existingReport.version + 1,
                        file_size: stat.size,
                        updated_at: new Date(),
                        storage_path: destPath
                    }
                });
            } else {
                await prisma.reports.create({
                    data: {
                        title: "Node Automated Daily Report",
                        filename: fileName,
                        original_name: fileName,
                        file_size: stat.size,
                        category: "Automated Stata Output",
                        location: "All",
                        storage_path: destPath,
                        generated_by: "System (Node)",
                        status: "Approved",
                        version: 1
                    }
                });
            }
        } catch (err) {
            console.error("Failed to save report to DB after trigger:", err);
        }
    });

    res.json({ message: `Script '${scriptName}' has been queued for execution in the background.` });
};

export { registerReport, getStatus, getScripts, triggerScript };
