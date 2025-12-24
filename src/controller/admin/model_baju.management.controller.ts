import type { Request, Response, NextFunction } from "express";
import ModelBajuManagementService from "../../services/admin/model_baju.management.service.js";
import HttpException from "../../utils/HttpExecption.js";

const createModelBaju = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload = req.body;
        const created = await ModelBajuManagementService.createModelBaju(payload);
        return res.status(201).json({
            message: "Model Baju created successfully",
            data: created
        });
    } catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
}

const getAllModelBaju = async (req: Request, res: Response, next: NextFunction) => {
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

        const result = await ModelBajuManagementService.getAllModelBaju(query, user);
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
}

const getModelBajuById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const result = await ModelBajuManagementService.getModelBajuById(id);
        return res.json({
            message: "Retrieved Data Successfully",
            data: result
        });
    } catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
}

const updateModelBaju = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const payload = req.body;
        const updated = await ModelBajuManagementService.updateModelBaju(id, payload);
        return res.json({
            message: "Model Baju updated successfully",
            data: updated
        });
    } catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
}

const deleteModelBaju = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const deleted = await ModelBajuManagementService.deleteModelBaju(id);
        return res.json({
            message: "Model Baju deleted successfully",
            data: deleted
        });
    } catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
}

const softDeleteModelBaju = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const deleted = await ModelBajuManagementService.softDeleteModelBaju(id);
        return res.json({
            message: "Model Baju soft deleted successfully",
            data: deleted
        });
    } catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
}

const modelBajuManagementController = {
    createModelBaju,
    getAllModelBaju,
    getModelBajuById,
    updateModelBaju,
    deleteModelBaju,
    softDeleteModelBaju
};

export default modelBajuManagementController;