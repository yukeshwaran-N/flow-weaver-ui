/**
 * Flow Weaver - Notification Server
 * Handles email sending for workflow notification steps.
 * Run with: node server.js
 */

import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Configure Nodemailer with Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
    },
});

/**
 * POST /api/notify
 * Body: { to, subject, body, workflowName, stepName }
 * Sends an email notification from a workflow step.
 */
app.post('/api/notify', async (req, res) => {
    const { to, subject, body, workflowName, stepName } = req.body;

    if (!to) {
        return res.status(400).json({ success: false, error: 'Recipient email (to) is required.' });
    }

    const emailSubject = subject || `[Flow Weaver] Notification from "${workflowName || 'Workflow'}"`;
    const emailBody = body ||
        `You have a new notification from the workflow "${workflowName || 'Unknown'}".\n\nStep: ${stepName || 'Unknown'}\n\nThis is an automated message from Flow Weaver.`;

    const mailOptions = {
        from: `"Flow Weaver" <${process.env.GMAIL_USER}>`,
        to,
        subject: emailSubject,
        html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="background: #1e1b4b; padding: 20px 24px; border-radius: 8px; margin-bottom: 24px;">
          <h1 style="color: #a5b4fc; margin: 0; font-size: 18px;">⚡ Flow Weaver</h1>
          <p style="color: #c7d2fe; margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Workflow Notification</p>
        </div>
        <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 8px;">${emailSubject}</h2>
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <p style="color: #64748b; font-size: 13px; margin: 0 0 8px;"><strong>Workflow:</strong> ${workflowName || 'N/A'}</p>
          <p style="color: #64748b; font-size: 13px; margin: 0 0 8px;"><strong>Step:</strong> ${stepName || 'N/A'}</p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 12px 0;" />
          <p style="color: #334155; font-size: 14px; white-space: pre-wrap; margin: 0;">${emailBody}</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">This is an automated message from Flow Weaver. Do not reply.</p>
      </div>
    `,
    };

    try {
        console.log(`📡 SMTP: Attempting to send to ${to}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ SMTP: Accepted | MessageId: ${info.messageId}`);
        console.log(`   Response: ${info.response}`);
        res.json({ success: true, messageId: info.messageId, response: info.response });
    } catch (error) {
        console.error('❌ SMTP: Error details:');
        console.error(`   Message: ${error.message}`);
        console.error(`   Code:    ${error.code}`);
        console.error(`   Command: ${error.command}`);
        res.status(500).json({ success: false, error: error.message, code: error.code });
    }
});

/**
 * GET /test-email?to=yourname@gmail.com
 * Quickly verifies Gmail credentials are working by sending a test email.
 * Usage: open http://localhost:3001/test-email?to=you@gmail.com in your browser
 */
app.get('/test-email', async (req, res) => {
    const to = req.query.to;
    if (!to) {
        return res.send(`
            <h2>Flow Weaver Email Test</h2>
            <p>Add <code>?to=your@email.com</code> to the URL to send a test email.</p>
            <p>Example: <a href="/test-email?to=you@gmail.com">/test-email?to=you@gmail.com</a></p>
            <p>Gmail user configured: <strong>${process.env.GMAIL_USER || 'NOT SET'}</strong></p>
        `);
    }
    try {
        const info = await transporter.sendMail({
            from: `"Flow Weaver" <${process.env.GMAIL_USER}>`,
            to,
            subject: '⚡ Flow Weaver – Email Test',
            html: `<div style="font-family:sans-serif;padding:24px;">
                <h2 style="color:#6366f1;">⚡ Flow Weaver Email Test</h2>
                <p>If you can read this, your Gmail integration is working correctly!</p>
                <p style="color:#64748b;font-size:13px;">Sent at: ${new Date().toLocaleString()}</p>
            </div>`,
        });
        console.log(`✅ Test email sent to ${to} | MessageId: ${info.messageId}`);
        res.send(`<h2>✅ Email sent to ${to}!</h2><p>Check your inbox (or spam folder).</p><p>MessageId: ${info.messageId}</p>`);
    } catch (error) {
        console.error('❌ Test email failed:', error.message);
        res.status(500).send(`<h2>❌ Email failed</h2><pre>${error.message}</pre>
            <p>Common fixes:<br>
            1. Gmail: go to Google Account → Security → 2-Step Verification → App passwords → add one for "Mail"<br>
            2. Make sure GMAIL_PASSWORD in .env has NO spaces (e.g. <code>abcd efgh ijkl mnop</code> should be <code>abcdefghijklmnop</code>)<br>
            </p>`);
    }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Flow Weaver Notification Server', port: PORT });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Flow Weaver Notification Server running on http://localhost:${PORT}`);
    console.log(`📧 Email configured for: ${process.env.GMAIL_USER || 'NOT SET'}`);
    console.log(`📡 Endpoints:`);
    console.log(`   POST http://localhost:${PORT}/api/notify`);
    console.log(`   GET  http://localhost:${PORT}/health\n`);
});
