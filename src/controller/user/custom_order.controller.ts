import type { Request, Response, NextFunction } from "express";
import CustomOrderService from "../../services/order/custom_order.service.js";
import HttpException from "../../utils/HttpExecption.js";

const createCustomOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const payload = { ...req.body, user_id: Number(userId) };
        const created = await CustomOrderService.ajuanCustomOrder(payload);
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

        const result = await CustomOrderService.getAllCustomOrders(query, user);
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
        const order = await CustomOrderService.getCustomOrderById(id);
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

const customOrderController = {
    createCustomOrder,
    getAllCustomOrders,
    getCustomOrderById,
};

export default customOrderController;