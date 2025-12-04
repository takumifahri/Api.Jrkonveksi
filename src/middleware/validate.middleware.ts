import type { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import type { Schema } from 'joi';

export const validate = (schema: Schema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req.body, { 
            abortEarly: false, 
            stripUnknown: true // Hapus field yang tidak ada di schema
        });

        if (error) {
            // Mengambil semua pesan error dan mengirim response 400 Bad Request
            const messages = error.details.map(detail => detail.message);
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed', 
                errors: messages 
            });
        }
        
        // Data request yang sudah tervalidasi dan bersih
        req.body = value; 
        next();
    };
};