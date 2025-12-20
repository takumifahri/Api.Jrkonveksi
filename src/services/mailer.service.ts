import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import config from '../config/config.js';
import { prisma } from '../config/prisma.config.js';
import { logError, logInfo } from '../utils/logger.js';

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
            secure: config.smtp.port === 465,
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
            html: options.html || options.text.replace(/\n/g, '<br>')
        };
        
        try {
            const info = await this.transporter.sendMail(mailDetails);
            console.log(`Email sent successfully to ${options.to}. Message ID: ${info.messageId}`);
        } catch (error) {
            console.error(`Failed to send email to ${options.to}:`, error);
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

    // ✅ NEW: Send custom order notification to admin
    static async sendCustomOrderNotification(orderId: number, orderUniqueId: string): Promise<void> {
        try {
            // Fetch order data with relations
            const order = await prisma.pemesananKonveksi.findUnique({
                where: { id: orderId },
                include: {
                    customer: {
                        select: {
                            unique_id: true,
                            name: true,
                            email: true,
                            phone: true,
                            address: true
                        }
                    },
                    material: {
                        select: {
                            unique_id: true,
                            name: true
                        }
                    },
                    model: {
                        select: {
                            unique_id: true,
                            nama: true, // ✅ Sesuai schema
                            material: true
                        }
                    }
                }
            });

            if (!order) {
                logError("Order not found for email notification", { orderId });
                return;
            }

            if (!order.customer) {
                logError("Customer not found for email notification", { orderId, userId: order.user_id });
                return;
            }

            const adminEmail = process.env.SMTP_USER || "jrkonveksiemail@gmail.com";

            const mailOptions: MailOptions = {
                to: adminEmail,
                subject: `🎉 Pemesanan Custom Baru - ${orderUniqueId}`,
                text: `
Pemesanan Custom Baru - ${orderUniqueId}

=== INFORMASI CUSTOMER ===
Nama: ${order.customer.name}
Email: ${order.customer.email}
Telepon: ${order.customer.phone || 'Tidak ada'}
Alamat: ${order.customer.address || 'Tidak ada'}
Customer ID: ${order.customer.unique_id}

=== DETAIL PEMESANAN ===
ID Pemesanan: ${orderUniqueId}
Nama Pemesanan: ${order.nama_pemesanan}
Jumlah Barang: ${order.jumlah_barang}
Ukuran: ${order.ukuran}
Warna: ${order.warna || 'Tidak ditentukan'}
Material Sendiri: ${order.material_sendiri ? 'Ya' : 'Tidak'}
Material Dipilih: ${order.material ? order.material.name : 'Tidak ada'}
Model Baju Dipilih: ${order.model ? `${order.model.nama} (${order.model.material})` : 'Tidak ada'}
Catatan: ${order.catatan || 'Tidak ada'}
Status: ${order.status}
Tanggal Order: ${new Date(order.createdAt).toLocaleString('id-ID')}

⚠️ Segera proses pemesanan ini!
                `,
                html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white; 
            padding: 30px 20px; 
            text-align: center;
        }
        .header h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content { 
            padding: 30px 20px;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #4CAF50;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #4CAF50;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        .info-row {
            border-bottom: 1px solid #e0e0e0;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label { 
            font-weight: 600;
            color: #555;
            padding: 12px 0;
            width: 40%;
            vertical-align: top;
        }
        .info-value {
            padding: 12px 0;
            color: #333;
        }
        .alert-box {
            margin-top: 25px;
            padding: 20px;
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border-left: 4px solid #ffc107;
            border-radius: 6px;
        }
        .alert-box strong {
            font-size: 16px;
            color: #856404;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .badge-pending {
            background-color: #fff3cd;
            color: #856404;
        }
        .badge-yes {
            background-color: #d4edda;
            color: #155724;
        }
        .badge-no {
            background-color: #f8d7da;
            color: #721c24;
        }
        .footer { 
            text-align: center; 
            padding: 20px; 
            background-color: #f9f9f9;
            color: #777; 
            font-size: 12px;
            border-top: 1px solid #e0e0e0;
        }
        .btn {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin-top: 15px;
            box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
        }
        .btn:hover {
            background: linear-gradient(135deg, #45a049 0%, #4CAF50 100%);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🎉 Pemesanan Custom Baru</h2>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Order ID: ${orderUniqueId}</p>
        </div>
        
        <div class="content">
            <!-- Customer Information -->
            <div class="section">
                <div class="section-title">👤 Informasi Customer</div>
                <table class="info-table">
                    <tr class="info-row">
                        <td class="info-label">Nama</td>
                        <td class="info-value"><strong>${order.customer.name}</strong></td>
                    </tr>
                    <tr class="info-row">
                        <td class="info-label">Email</td>
                        <td class="info-value">${order.customer.email}</td>
                    </tr>
                    <tr class="info-row">
                        <td class="info-label">Telepon</td>
                        <td class="info-value">${order.customer.phone || '<em>Tidak ada</em>'}</td>
                    </tr>
                    <tr class="info-row">
                        <td class="info-label">Alamat</td>
                        <td class="info-value">${order.customer.address || '<em>Tidak ada</em>'}</td>
                    </tr>
                    <tr class="info-row">
                        <td class="info-label">Customer ID</td>
                        <td class="info-value">#${order.customer.unique_id}</td>
                    </tr>
                </table>
            </div>

            <!-- Order Details -->
            <div class="section">
                <div class="section-title">📦 Detail Pemesanan</div>
                <table class="info-table">
                    <tr class="info-row">
                        <td class="info-label">Nama Pemesanan</td>
                        <td class="info-value"><strong>${order.nama_pemesanan}</strong></td>
                    </tr>
                    <tr class="info-row">
                        <td class="info-label">Jumlah Barang</td>
                        <td class="info-value"><strong style="color: #4CAF50;">${order.jumlah_barang} pcs</strong></td>
                    </tr>
                    <tr class="info-row">
                        <td class="info-label">Ukuran</td>
                        <td class="info-value">${order.ukuran}</td>
                    </tr>
                    <tr class="info-row">
                        <td class="info-label">Warna</td>
                        <td class="info-value">${order.warna || '<em>Tidak ditentukan</em>'}</td>
                    </tr>
                    <tr class="info-row">
                        <td class="info-label">Material Sendiri</td>
                        <td class="info-value">
                            <span class="badge ${order.material_sendiri ? 'badge-yes' : 'badge-no'}">
                                ${order.material_sendiri ? 'Ya' : 'Tidak'}
                            </span>
                        </td>
                    </tr>
                    <tr class="info-row">
                        <td class="info-label">Keterangan Material</td>
                        <td class="info-value">${order.material ? order.material.name : '<em>Tidak ada</em>'}</td>
                    </tr>
                    <tr class="info-row">
                        <td class="info-label">Referensi Custom</td>
                        <td class="info-value">
                            <span class="badge ${order.referensi_custom ? 'badge-yes' : 'badge-no'}">
                                ${order.referensi_custom ? 'Ya' : 'Tidak'}
                            </span>
                        </td>
                    </tr>
                    <tr class="info-row">
                        <td class="info-label">Keterangan Model Baju</td>
                        <td class="info-value">${order.model ? `${order.model.nama} (${order.model.material})` : '<em>Tidak ada</em>'}</td>
                    </tr>
                    ${order.catatan ? `
                    <tr class="info-row">
                        <td class="info-label">Catatan</td>
                        <td class="info-value">${order.catatan}</td>
                    </tr>
                    ` : ''}
                    <tr class="info-row">
                        <td class="info-label">Status</td>
                        <td class="info-value">
                            <span class="badge badge-pending">${order.status}</span>
                        </td>
                    </tr>
                    <tr class="info-row">
                        <td class="info-label">Tanggal Order</td>
                        <td class="info-value">${new Date(order.createdAt).toLocaleString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</td>
                    </tr>
                </table>
            </div>

            <!-- Alert -->
            <div class="alert-box">
                <strong>⚠️ Segera proses pemesanan ini!</strong>
                <p style="margin: 8px 0 0 0; font-size: 14px;">
                    Customer menunggu konfirmasi dari admin untuk melanjutkan pesanan ini.
                </p>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin-top: 25px;">
                <a href="mailto:${order.customer.email}" class="btn">
                    📧 Hubungi Customer
                </a>
            </div>
        </div>
        
        <div class="footer">
            <p style="margin: 0;">Email otomatis dari sistem <strong>JRKonveksi</strong></p>
            <p style="margin: 5px 0 0 0; color: #999;">
                Jangan balas email ini. Gunakan tombol "Hubungi Customer" di atas.
            </p>
        </div>
    </div>
</body>
</html>
                `
            };

            await new MailerService().sendMail(mailOptions);
            
            logInfo("Custom order notification email sent to admin", {
                order_id: orderId,
                order_unique_id: orderUniqueId,
                customer_email: order.customer.email
            });

        } catch (error: any) {
            logError("Failed to send custom order notification email", {
                order_id: orderId,
                error: error?.message
            });
            throw error;
        }
    }
}

export default MailerService;