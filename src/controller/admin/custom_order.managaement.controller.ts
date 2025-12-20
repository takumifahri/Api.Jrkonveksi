import type { Request, Response, NextFunction } from "express";
import custom_orderManagementService from "../../services/admin/custom_order.management.service.js";
import HttpException from "../../utils/HttpExecption.js";


const createCustomOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const payload = { ...req.body, user_id: Number(userId) };
        const created = await custom_orderManagementService.createCustomOrder(payload);
        return res.status(201).json({
            message: "Custom Order created successfully",
            data: created
        });
    } catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};

const getAllCustomOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as { id: number; role?: "Admin" | "Manager" | "User" } | undefined;
        const { q, page, limit, sortBy, sortOrder } = req.query;
        const sortOrderValue =
            typeof sortOrder === "string" && (sortOrder === "asc" || sortOrder === "desc")
                ? (sortOrder as "asc" | "desc")
                : undefined;

        const query: {
            q?: string;
            page?: number;
            limit?: number;
            sortBy?: string;
            sortOrder?: "asc" | "desc";
        } = {};

        if (typeof q === "string" && q.trim() !== "") query.q = q;
        if (page) query.page = Number(page);
        if (limit) query.limit = Number(limit);
        if (typeof sortBy === "string") query.sortBy = sortBy;
        if (sortOrderValue) query.sortOrder = sortOrderValue;

        const result = await custom_orderManagementService.getAllCustomOrders(query, user);
        if (!result) {
            return res.json({
                message: "No Data Found",
                data: result
            });
        }
        return res.json({
            message: "Retrieved Data Successfully",
            data: result
        });
    } catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};

const getCustomOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const order = await custom_orderManagementService.getCustomOrderById(id);
        if (!order) {
            return res.json({
                message: "No Data Found",
                data: order
            });
        }
        return res.json({
            message: "Retrieved Data Successfully",
            data: order
        });
    } catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};

const updateCustomOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const payload = { ...req.body };
        const updated = await custom_orderManagementService.updateCustomOrder(id, payload);
        if (!updated) {
            return res.json({
                message: "No Data Found",
                data: updated
            });
        }
        return res.json({
            message: "Updated Data Successfully",
            data: updated
        });
    } catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};

const deleteCustomOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const result = await custom_orderManagementService.deleteCustomOrder(id);
        if (!result) {
            return res.json({
                message: "No Data Found",
                data: result
            });
        }
        return res.json({
            message: "Deleted Data Successfully",
            data: result
        });
    } catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};

const softDeleteCustomOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const result = await custom_orderManagementService.softDeleteCustomOrder(id);
        if (!result) {
            return res.json({
                message: "No Data Found",
                data: result
            });
        }
        return res.json({
            message: "Soft Deleted Data Successfully",
            data: result
        });
    } catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};

const terimaCustomOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const adminId = req.user?.id;
        if (!adminId) return res.status(401).json({ message: "Unauthorized" });
        
        const result = await custom_orderManagementService.terimaCustomOrder(id, adminId, req.body);
        return res.json({
            message: "Order berhasil diterima dan masuk tahap negosiasi",
            data: result
        });
    } catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};

const tolakCustomOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const adminId = req.user?.id;
        if (!adminId) return res.status(401).json({ message: "Unauthorized" });
        
        const result = await custom_orderManagementService.tolakCustomOrder(id, adminId, req.body);
        return res.json({
            message: "Order berhasil ditolak",
            data: result
        });
    } catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};

const batalCustomOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const adminId = req.user?.id;
        if (!adminId) return res.status(401).json({ message: "Unauthorized" });
        
        const result = await custom_orderManagementService.batalPemesanan(id, adminId, req.body);
        return res.json({
            message: "Order berhasil dibatalkan",
            data: result
        });
    } catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};

const dealNegosiasiCustomOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const adminId = req.user?.id;
        if (!adminId) return res.status(401).json({ message: "Unauthorized" });
        
        const result = await custom_orderManagementService.dealNegosiasi(id, adminId, req.body);
        return res.json({
            message: "Negosiasi berhasil, order masuk tahap pengerjaan dan transaksi telah dibuat",
            data: result
        });
    } catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};

const customOrderManagementController = {
    createCustomOrder,
    getAllCustomOrders,
    getCustomOrderById,
    updateCustomOrder,
    deleteCustomOrder,
    softDeleteCustomOrder,
    terimaCustomOrder,
    tolakCustomOrder,
    batalCustomOrder,
    dealNegosiasiCustomOrder
};

export default customOrderManagementController;