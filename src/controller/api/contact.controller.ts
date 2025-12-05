import type { Request, Response, NextFunction } from "express";
import ContactService from "../../services/contact.service.js";

import logger from "../../utils/logger.js";
import type { ContactFormRequest } from "../../interfaces/contact.interface.js";

const sendEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, phone, message }: ContactFormRequest = req.body;
        const result = await ContactService.submitContactForm({
            name,
            email,
            phone: phone === undefined ? null : phone,
            message
        });
        res.status(201).json(result);
    } catch (error) {
        logger.error(`sendEmail - ${error}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const getAllContacts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const contacts = await ContactService.getAllContacts();
        res.status(200).json(contacts);
    } catch (error) {
        logger.error(`getAllContacts - ${error}`);
        next(error);
    }
};

const getContactById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const contactIdStr = req.params.id;
        const contactId = Number(contactIdStr);
        if (!contactIdStr || isNaN(contactId)) {
            return res.status(400).json({ message: "Invalid contact id" });
        }
        const contact = await ContactService.getIdContact(contactId);
        res.status(200).json(contact);
    } catch (error) {
        logger.error(`getContactById - ${error}`);
        next(error);
    }
};

const replyToContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const contactId = req.params.id;
        const { replyMessage } = req.body;
        // Assume req.user.id is available from authentication middleware
        const replyByStr = req.user?.id;
        if (!replyByStr) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const replyBy = Number(replyByStr);
        if (isNaN(replyBy)) {
            return res.status(400).json({ message: "Invalid user id" });
        }
        const reply = await ContactService.replyToContact(Number(contactId), replyMessage, replyBy);
        res.status(200).json(reply);
    } catch (error) {
        logger.error(`replyToContact - ${error}`);
        next(error);
    }
};

const ContactController = {
    sendEmail,
    getAllContacts,
    getContactById,
    replyToContact
};

export default ContactController;
