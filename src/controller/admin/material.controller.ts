import type { Request, Response, NextFunction } from "express";
import materialsManagementService from "../../services/admin/materials.management.service.js";

const getAllMaterials = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const materials = await materialsManagementService.getAllMaterials();
        res.status(200).json(materials);
    } catch (error) {
        next(error);
    }
};

const getMaterialById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const material = await materialsManagementService.getMaterialById(id);
        res.status(200).json(material);

    } catch (error) {
        next(error);
    }
};

const createMaterial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const material = await materialsManagementService.createMaterial(req.body);
        res.status(201).json(material);
    } catch (error) {
        next(error);
    }
};

const updateMaterial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const material = await materialsManagementService.updateMaterial(id, req.body);
        res.status(200).json(material);
    } catch (error) {
        next(error);
    }
};

const softDeleteMaterial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);   
        const result = await materialsManagementService.softDeleteMaterial(id);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const deleteMaterial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const result = await materialsManagementService.deleteMaterial(id);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const MaterialsManagementController = {
    getAllMaterials,
    getMaterialById,
    createMaterial,
    updateMaterial,
    softDeleteMaterial,
    deleteMaterial,
}

export default MaterialsManagementController;