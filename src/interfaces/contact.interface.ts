export interface ContactFormRequest {
    name: string;
    email: string;
    phone?: string | null;
    message: string;
}

export interface ContactFormResponse {
    success: boolean;
    message: string;
}

export interface ResponseContact {
    id: number;
    email: string;
    phone?: string | null;
    name: string;
    message: string;

    reply?: any;
}

export interface replyRequest {
    contactId: string;
    replyMessage: string;
    replyBy: number;
}
export interface ResponseReplyContact {
    id: number;
    contactId: number;
    replyMessage: string;
    replyBy: number;
}
export interface ResponseReplyContact {
    id: number;
    contactId: number;
    replyMessage: string;
    replyBy: number;
}

export interface IContactService {
    submitContactForm(request: ContactFormRequest): Promise<ContactFormResponse>;
    getAllContacts(): Promise<ResponseContact[]>;
    getIdContact(contactId: string): Promise<ResponseContact>;
    replyToContact(contactId: string, replyMessage: string, replyBy: number): Promise<ResponseReplyContact>;
}