import { prisma } from "../config/prisma.config.js";
import HttpException from "../utils/HttpExecption.js";

export interface IContactRepository {
    createContact(data: any): Promise<any>;
    getAllContacts(): Promise<any[]>;
    getContactById(id: number): Promise<any>;
    deleteContact(id: number): Promise<any>;
}

export class ContactRepository implements IContactRepository {
    async createContact(data: any): Promise<any> {
        const result = await prisma.contactForm.create({
            data
        });
        if (!result) {
            throw new HttpException(400, `Failed to create contact ${data.name}`);
        }
        return result;
    }

    async getAllContacts(): Promise<any[]> {
        const contacts = await prisma.contactForm.findMany({
            include: {
                response: true
            }
        });
        return contacts;
    }
    async getContactById(id: number): Promise<any> {
        return await prisma.contactForm.findUnique({
            where: { id },
            include: {
                response: true
            }
        });
    }

    async deleteContact(id: number): Promise<any> {
        return await prisma.contactForm.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }

    async replyToContact(contactId: number, replyMessage: string, replyBy: number): Promise<any> {
        // Fetch contact data to get name, email, phone, title
        const contact = await prisma.contactForm.findUnique({
            where: { id: contactId }
        });

        if (!contact) {
            throw new Error("Contact not found");
        }

        const uuidGenerator = `REPLY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        return await prisma.responseContact.create({
            data: {
                unique_id: uuidGenerator,
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                title: contact.title,
                contact_id: contactId,
                Message: replyMessage,
                responden_id: replyBy
            }
        });
    }
}
