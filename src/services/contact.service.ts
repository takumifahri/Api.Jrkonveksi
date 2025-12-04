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


class ContactService implements IContactService {
    async submitContactForm(request: ContactFormRequest): Promise<ContactFormResponse> {
        try {
            const { name, email, phone, message } = request;

            const generateUniqueId = (): string => {
                return 'EMAIL-' + Math.random().toString(36).substr(2, 9);
            }

            // Send Email 
            const mailerService = new MailerService();
            const mailOptions = {
                from: `"${name}" <${email}>`,
                to: config.smtp.from,
                subject: `Pesan Baru dari Klien (${name})`,
                html: `
                    <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 24px;">
                        <h2 style="color: #333;">Pesan Baru dari Klien</h2>
                        <table style="border-collapse: collapse; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                            <tr>
                                <td style="padding: 8px 16px; font-weight: bold; color: #555;">Nama</td>
                                <td style="padding: 8px 16px;">${name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 16px; font-weight: bold; color: #555;">Email</td>
                                <td style="padding: 8px 16px;">${email}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 16px; font-weight: bold; color: #555;">Telepon</td>
                                <td style="padding: 8px 16px;">${phone || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 16px; font-weight: bold; color: #555;">Pesan</td>
                                <td style="padding: 8px 16px;">${message || 'N/A'}</td>
                            </tr>
                        </table>
                    </div>
                `,
                text: `Anda menerima pesan baru dari klien.\n\nNama: ${name}\nEmail: ${email}\nTelepon: ${phone || 'N/A'}\nPesan: ${message || 'N/A'}\n`,
            };
            await mailerService.sendMail(mailOptions);

            // Save contact form to database
            const newContact = await prisma.contactForm.create({
                data: {
                    unique_id: generateUniqueId(),
                    name,
                    email,
                    title: 'Contact Form Submission',
                    phone: phone || '',
                    Message: message || '',
                },
            });
            logger.info(`ContactService - submitContactForm: New contact form submitted by ${name} (${email})`);
            return {success: true, message: 'Contact form submitted successfully'};
        } catch (error) {
            logger.error(`ContactService - submitContactForm: ${error}`);
            throw new HttpException(500, 'Internal Server Error');
        }
    }

    async getAllContacts(): Promise<ResponseContact[]> {
        try {
            const contacts = await prisma.contactForm.findMany({
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    response: true
                }
            });
            if (contacts.length === 0) {
                throw new HttpException(404, 'No contacts found');
            }
                const getReplyContact = await prisma.responseContact.findMany({
                where: { contacatId: Number(id) },
                include: { user: true }
            });
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

    async getIdContact(contactId: string): Promise<ResponseContact> {
        try {
            const contact = await prisma.contactForm.findUnique({
                where: { id: Number(contactId) },
                include: {
                    response: true  
                }
            });
            if (!contact) {
                throw new HttpException(404, 'Contact not found');
            }
            const getReplyContact = await prisma.responseContact.findMany({
                where: { contacatId: Number(contactId) },
                include: {user: true}
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

    async replyToContact(contactId: string, replyMessage: string, replyBy: number): Promise<ResponseReplyContact> {
        try {
            const contact = await prisma.contactForm.findUnique({
                where: { id: Number(contactId) }
            });
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
            const generateUniqueId = (): string => {
                return 'REPLY-' + Math.random().toString(36).substr(2, 9);
            }
            const newReply = await prisma.responseContact.create({
                data: {
                    unique_id: generateUniqueId(),
                    name: adminUser.name,
                    email: adminUser.email,
                    phone: adminUser.phone || '',
                    title: 'Reply to Contact',
                    contacatId: Number(contactId),
                    Message: replyMessage,
                    RespondenId: adminUser.id
                },
            });
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

export default ContactService;