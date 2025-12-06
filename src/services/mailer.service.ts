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

    static async sendWarningEmail(to: string, subject: string, message: string): Promise<void> {
        const mailOptions: MailOptions = {
            to,
            subject,
            text: message,
            html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #d9534f;">Peringatan Keamanan Akun</h2>
                <p>Halo,</p>
                <p>Kami mendeteksi adanya percobaan masuk ke akun Anda dengan beberapa kali memasukkan email.</p>
                <p><strong>Detail:</strong></p>
                <blockquote style="background: #f9f9f9; border-left: 4px solid #d9534f; margin: 10px 0; padding: 10px;">
                ${message}
                </blockquote>
                <p>Jika ini bukan Anda, harap segera amankan akun Anda dan ubah kata sandi.</p>
                <p>Terima kasih,<br/>Tim Keamanan Jrkonveksi</p>
            </div>
            `
        };
        await new MailerService().sendMail(mailOptions);
    }

    static async sendOTPEmail(to: string, otp: string, expired_in: Date): Promise<void> {
        // Hitung waktu kedaluwarsa dalam menit & detik
        const now = new Date();
        const diffMs = expired_in.getTime() - now.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffSeconds = Math.floor((diffMs % 60000) / 1000);

        const countdown =
            diffMs > 0
                ? `${diffMinutes} menit${diffMinutes > 0 ? '' : ''} ${diffSeconds} detik`
                : 'sudah kedaluwarsa';

        const mailOptions: MailOptions = {
            to,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}. It will expire in ${countdown}.`,
            html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #5bc0de;">Your OTP Code</h2>
                <p>Halo,</p>
                <p>Kode OTP Anda adalah <strong>${otp}</strong>.</p>
                <p>Harap masukkan kode ini untuk melanjutkan proses verifikasi.</p>
                <p>OTP ini akan kedaluwarsa dalam <strong>${countdown}</strong>.</p>
                <p>Terima kasih,<br/>Tim Jrkonveksi</p>
            </div>
            `
        };
        await new MailerService().sendMail(mailOptions);
    }

}

export default MailerService;