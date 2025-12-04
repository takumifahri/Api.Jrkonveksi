import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import config from '../config/config.js';

interface MailOptions {
    to: string;
    subject: string;
    html: string;
    text: string;
}

class MailerService {
    private transporter: Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config.smtp.host,
            port: config.smtp.port,
            secure: config.smtp.port === 465, // true for 465, false for other ports
            auth: {
                user: config.smtp.user,
                pass: config.smtp.pass,
            },
            tls: {
                ciphers: 'SSLv3'
            }
        });

        this.verifyConnection();
    }

    private async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('SMTP connection established');
        } catch (error) {
            console.error('Error establishing SMTP connection:', error);
        }
    }

    public async sendMail(options: MailOptions): Promise<void> {
        if (config.env === 'test') {
            console.log('Email sending skipped in test environment:', options);
            return;
        }

        const mailDetails = {
            from: config.smtp.from,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html || options.html.replace(/<[^>]*>/g, '')
        };
        
        try {
            const info = await this.transporter.sendMail(mailDetails);
            console.log(`Email sent successfully to ${options.to}. Message ID: ${info.messageId}`);
        } catch (error) {
            console.error(`Failed to send email to ${options.to}:`, error);
            // Anda bisa melempar HttpException di sini jika ingin error ditangkap oleh Global Error Handler
            throw new Error('Failed to send email due to server error.'); 
        }
    }
}

export default MailerService;