import express, { response } from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { IContactService, ContactFormRequest, ContactFormResponse, ResponseContact, ResponseReplyContact } from '../interfaces/contact.interface.js';
import { validate } from '../middleware/validate.middleware.js';
// utils
import logger from '../utils/logger.js';
import config from '../config/config.js';
import MailerService from './mailer.service.js';
import HttpException from '../utils/HttpExecption.js';

// prisma
import { prisma } from '../config/prisma.config.js';
import Joi from 'joi';
import { id } from 'zod/locales';
import { ContactRepository } from '../repository/contact.repository.js';


class ContactService implements IContactService {
    private contactRepository = new ContactRepository();

    async submitContactForm(request: ContactFormRequest): Promise<ContactFormResponse> {
        try {
            const { name, email, phone, message } = request;

            const generateUniqueId = (): string => {
                return 'EMAIL-' + Math.random().toString(36).substr(2, 9);
            };

            // Send Email
            const mailerService = new MailerService();
            const mailOptions = {
                from: `"${name}" <${email}>`,
                to: config.smtp.from,
                subject: `Pesan Baru dari Klien: ${name} `,
                html: `
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #f5eee6 60%, #d7c4b7 100%); padding: 32px; border-radius: 12px;">
                        <div style="text-align:center;">
                            <img src="https://img.icons8.com/color/96/000000/coffee.png" alt="Pesan Baru" style="margin-bottom:16px;" />
                            <h2 style="color: #6f4e37; margin-bottom: 8px;">Pesan Baru dari Klien</h2>
                            <p style="color: #7c6f57; font-size: 16px;">Anda menerima pesan baru melalui formulir kontak website.</p>
                        </div>
                        <table style="width:100%; margin-top:24px; border-collapse: collapse; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(111,78,55,0.08); overflow: hidden;">
                            <tr style="background:#e7d7c9;">
                                <td style="padding: 12px 20px; font-weight: bold; color: #6f4e37; width: 120px;">Nama</td>
                                <td style="padding: 12px 20px; color: #333;">${name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 20px; font-weight: bold; color: #6f4e37;">Email</td>
                                <td style="padding: 12px 20px; color: #333;">${email}</td>
                            </tr>
                            <tr style="background:#e7d7c9;">
                                <td style="padding: 12px 20px; font-weight: bold; color: #6f4e37;">Telepon</td>
                                <td style="padding: 12px 20px; color: #333;">${phone || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 20px; font-weight: bold; color: #6f4e37;">Pesan</td>
                                <td style="padding: 12px 20px; color: #333;">${message || 'N/A'}</td>
                            </tr>
                        </table>
                        <div style="margin-top:32px; text-align:center;">
                            <a href="mailto:${email}" style="display:inline-block; background:#6f4e37; color:#fff; padding:12px 32px; border-radius:6px; text-decoration:none; font-weight:bold; box-shadow:0 2px 8px rgba(111,78,55,0.12);">Balas Pesan</a>
                        </div>
                        <hr style="margin:32px 0; border:none; border-top:1px solid #e3e3e3;">
                        <p style="color:#a89f91; font-size:13px; text-align:center;">Email ini dikirim otomatis oleh sistem Jrkonveksi.</p>
                    </div>
                `,
                text: `☕ Anda menerima pesan baru dari klien! ☕\n\nNama: ${name}\nEmail: ${email}\nTelepon: ${phone || 'N/A'}\nPesan: ${message || 'N/A'}\n\nBalas langsung ke email: ${email}\n\nEmail ini dikirim otomatis oleh sistem Jrkonveksi.`,
            };
            await mailerService.sendMail(mailOptions);

            // Save contact form to database
            await this.contactRepository.createContact({
                unique_id: generateUniqueId(),
                name,
                email,
                phone: phone || '',
                title: 'Contact Form Submission',
                Message: message
            });
            logger.info(`ContactService - submitContactForm: New contact form submitted by ${name} (${email})`);
            return { success: true, message: 'Contact form submitted successfully' };
        } catch (error) {
            logger.error(`ContactService - submitContactForm: ${error}`);
            throw new HttpException(500, 'Internal Server Error');
        }
    }

    async getAllContacts(): Promise<ResponseContact[]> {
        try {
            const contacts = await this.contactRepository.getAllContacts();
            if (contacts.length === 0) {
                return [];
            }
            const mappedContacts: ResponseContact[] = contacts.map(contact => ({
                id: contact.id,
                email: contact.email,
                phone: contact.phone,
                name: contact.name,
                message: contact.Message,
                response: contact.response
            }));
            return mappedContacts;
        } catch (error) {
            logger.error(`ContactService - getAllContacts: ${error}`);
            throw new HttpException(500, 'Internal Server Error');
        }
    }

    async getIdContact(contactId: number): Promise<ResponseContact> {
        try {
            const contact = await this.contactRepository.getContactById(contactId);
            if (!contact) {
                throw new HttpException(404, 'Contact not found');
            }
            const getReplyContact = await prisma.responseContact.findMany({
                where: { contact_id: contactId },
                include: { user: true }
            });
            return {
                id: contact.id,
                email: contact.email,
                phone: contact.phone,
                name: contact.name,
                message: contact.Message,
                reply: getReplyContact
            };
        } catch (error) {
            logger.error(`ContactService - getIdContact: ${error}`);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(500, 'Internal Server Error');
        }
    }

    async replyToContact(contactId: number, replyMessage: string, replyBy: number): Promise<ResponseReplyContact> {
        try {
            const contact = await this.contactRepository.getContactById(contactId);
            if (!contact) {
                throw new HttpException(404, 'Contact not found');
            }
            // Ambil data user admin dari JWT (misal sudah di-parse di middleware dan ada di request.user)
            const adminUserId = replyBy;
            const adminUser = await prisma.user.findUnique({
                where: { id: adminUserId }
            });
            if (!adminUser) {
                throw new HttpException(404, 'Admin user not found');
            }
            // Fetch contact data to get name, email, phone, title
            const contactData = await prisma.contactForm.findUnique({
                where: { id: Number(contactId) }
            });

            if (!contactData) {
                throw new HttpException(404, "Contact not found");
            }

            
            const newReply = await this.contactRepository.replyToContact(
                Number(contactId),
                replyMessage,
                adminUser.id
            );
            // Send Email
            const mailerService = new MailerService();
            const mailOptions = {
                from: `"Jrkonveksi Admin" <${config.smtp.from}>`,
                to: contactData.email,
                subject: `Balasan untuk Pesan Anda di Jrkonveksi`,
                html: `
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #f5eee6 60%, #d7c4b7 100%); padding: 32px; border-radius: 12px;">
                        <div style="text-align:center;">
                            <img src="https://img.icons8.com/color/96/000000/coffee.png" alt="Balasan Pesan" style="margin-bottom:16px;" />
                            <h2 style="color: #6f4e37; margin-bottom: 8px;">Balasan dari Admin Jrkonveksi</h2>
                            <p style="color: #7c6f57; font-size: 16px;">Terima kasih telah menghubungi kami. Berikut balasan dari admin:</p>
                        </div>
                        <table style="width:100%; margin-top:24px; border-collapse: collapse; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(111,78,55,0.08); overflow: hidden;">
                            <tr style="background:#e7d7c9;">
                                <td style="padding: 12px 20px; font-weight: bold; color: #6f4e37; width: 120px;">Nama Anda</td>
                                <td style="padding: 12px 20px; color: #333;">${contactData.name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 20px; font-weight: bold; color: #6f4e37;">Email Anda</td>
                                <td style="padding: 12px 20px; color: #333;">${contactData.email}</td>
                            </tr>
                            <tr style="background:#e7d7c9;">
                                <td style="padding: 12px 20px; font-weight: bold; color: #6f4e37;">Telepon</td>
                                <td style="padding: 12px 20px; color: #333;">${contactData.phone || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 20px; font-weight: bold; color: #6f4e37;">Pesan Anda</td>
                                <td style="padding: 12px 20px; color: #333;">${contactData.Message || 'N/A'}</td>
                            </tr>
                            <tr style="background:#e7d7c9;">
                                <td style="padding: 12px 20px; font-weight: bold; color: #6f4e37;">Balasan Admin</td>
                                <td style="padding: 12px 20px; color: #333;">${replyMessage}</td>
                            </tr>
                        </table>
                        <div style="margin-top:32px; text-align:center;">
                            <a href="mailto:${config.smtp.from}" style="display:inline-block; background:#6f4e37; color:#fff; padding:12px 32px; border-radius:6px; text-decoration:none; font-weight:bold; box-shadow:0 2px 8px rgba(111,78,55,0.12);">Balas Admin</a>
                        </div>
                        <hr style="margin:32px 0; border:none; border-top:1px solid #e3e3e3;">
                        <p style="color:#a89f91; font-size:13px; text-align:center;">Email ini dikirim otomatis oleh sistem Jrkonveksi.</p>
                    </div>
                `,
                text: `☕ Balasan dari Admin Jrkonveksi ☕\n\nNama Anda: ${contactData.name}\nEmail Anda: ${contactData.email}\nTelepon: ${contactData.phone || 'N/A'}\nPesan Anda: ${contactData.Message || 'N/A'}\n\nBalasan Admin: ${replyMessage}\n\nEmail ini dikirim otomatis oleh sistem Jrkonveksi.`,
            };
            await mailerService.sendMail(mailOptions);
            return {
                id: newReply.id,
                contactId: newReply.contacatId,
                replyMessage: newReply.Message,
                replyBy: newReply.RespondenId
            };
        } catch (error) {
            logger.error(`ContactService - replyToContact: ${error}`);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(500, 'Internal Server Error');
        }
    }
}

export default new ContactService();