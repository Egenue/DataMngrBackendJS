import cron from 'node-cron';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

// Schedule to run every day at 06:00 AM
cron.schedule('0 6 * * *', () => {
    console.log("Running Daily 6 AM Node Automation Job...");

    const scriptsDir = "C:\\Users\\kipchirchir\\Desktop\\Projects\\FistOen\\StataScripts";
    const outputDir = path.join(scriptsDir, "output");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const sourcePath = path.join(outputDir, "Node_Daily_Report.xlsx");
    
    // Simulate running a Stata do-file via powershell
    const cmd = `powershell -Command "Set-Content -Path '${sourcePath}' -Value 'Daily Automated Dummy Content from Node-Cron'"`;

    exec(cmd, async (error, stdout, stderr) => {
        if (error) {
            console.error(`Cron Job Failed: ${error.message}`);
            await prisma.audit_logs.create({
                data: {
                    user_id: null,
                    username: "node_cron_engine",
                    action: "GENERATION_FAILED",
                    module: "Automation",
                    details: `Daily 6 AM Job Failed: ${error.message}`,
                    ip_address: "127.0.0.1"
                }
            });
            return;
        }

        console.log("Daily Cron Job execution completed successfully.");

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
                        generated_by: "System (Node Cron)",
                        status: "Approved",
                        version: 1
                    }
                });
            }
        } catch (err) {
            console.error("Failed to process cron report result:", err);
        }
    });
});
