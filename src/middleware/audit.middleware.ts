import type { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/aduit.service.js';
export const auditTransaction = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(body: any) {
      // Log setelah response berhasil
      if (res.statusCode < 400) {
        const auditPayload: any = {
          action,
          entity: 'transaction',
          entity_id: body?.data?.id,
          new_data: body?.data,
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        };
        if (typeof req.user?.id === 'number') {
          auditPayload.user_id = req.user.id;
        }
        AuditService.log(auditPayload);
      }
      return originalJson.call(this, body);
    };
    
    next();
  };
};