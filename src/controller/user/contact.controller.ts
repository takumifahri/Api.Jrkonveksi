import type { Request, Response, NextFunction } from "express";
import ContactService from "../../services/contact.service.js";
import logger from "../../utils/logger.js";
import HttpException from "../../utils/HttpExecption.js";

class ContactController {
    async sendEmail(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email, phone, message } = req.body;
            
            if (!name || !email || !message) {
                return res.status(400).json({
                    message: "Name, email, and message are required"
                });
            }

            const result = await ContactService.submitContactForm({
                name,
                email,
                phone: phone || "",
                message
            });

            res.status(200).json({
                message: result.message,
                data: result
            });
        } catch (err: any) {
            if (err instanceof HttpException) {
                return res.status(err.status).json({ message: err.message });
            }
            logger.error(`sendEmail - ${err}`);
            next(err);
        }
    }

    async getAllContacts(req: Request, res: Response, next: NextFunction) {
        try {
            const contacts = await ContactService.getAllContacts();
            
            // ✅ Return 200 dengan empty array jika tidak ada data (bukan 404)
            if (!contacts || contacts.length === 0) {
                return res.status(200).json({
                    message: "No contacts found",
                    data: []
                });
            }

            res.status(200).json({
                message: "Contacts retrieved successfully",
                data: contacts
            });
        } catch (err: any) {
            if (err instanceof HttpException) {
                return res.status(err.status).json({ message: err.message });
            }
            logger.error(`getAllContacts - ${err}`);
            next(err);
        }
    }

    async getContactById(req: Request, res: Response, next: NextFunction) {
        try {
            const contactIdStr = req.params.id;
            const contactId = Number(contactIdStr);
            
            // ✅ Validate ID
            if (!contactIdStr || isNaN(contactId)) {
                return res.status(400).json({ 
                    message: "Invalid contact ID" 
                });
            }

            const contact = await ContactService.getIdContact(contactId);

            res.status(200).json({
                message: "Contact retrieved successfully",
                data: contact
            });
        } catch (err: any) {
            // ✅ Handle HttpException dengan status code yang tepat
            if (err instanceof HttpException) {
                return res.status(err.status).json({ message: err.message });
            }
            logger.error(`getContactById - ${err}`);
            next(err);
        }
    }

    async replyToContact(req: Request, res: Response, next: NextFunction) {
        try {
            const contactIdStr = req.params.id;
            const contactId = Number(contactIdStr);
            const { replyMessage } = req.body;
            const replyBy = (req as any).user?.id; // Dari JWT middleware

            // ✅ Validate inputs
            if (!contactIdStr || isNaN(contactId)) {
                return res.status(400).json({ 
                    message: "Invalid contact ID" 
                });
            }

            if (!replyMessage) {
                return res.status(400).json({ 
                    message: "Reply message is required" 
                });
            }

            if (!replyBy) {
                return res.status(401).json({ 
                    message: "Unauthorized" 
                });
            }

            const result = await ContactService.replyToContact(
                contactId,
                replyMessage,
                replyBy
            );

            res.status(200).json({
                message: "Reply sent successfully",
                data: result
            });
        } catch (err: any) {
            // ✅ Handle HttpException dengan status code yang tepat
            if (err instanceof HttpException) {
                return res.status(err.status).json({ message: err.message });
            }
            logger.error(`replyToContact - ${err}`);
            next(err);
        }
    }
}

export default new ContactController();