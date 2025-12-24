import type {
    createMaterialRequest,
    updateMaterialRequest,
    MaterialResponse,
    IMaterialManagementService,
} from "../../interfaces/materials.interface.js";
import { statusMaterials } from "../../interfaces/materials.interface.js";

import HttpException from "../../utils/HttpExecption.js";
import { MaterialManagementRepository } from "../../repository/admin/materials.management.repository.js";
import logger from "../../utils/logger.js";
import { v4 as uuidv4 } from "uuid";
import * as jwt from "jsonwebtoken";
import CacheService, { CACHE_TTL } from "../cache.service.js";

class MaterialManagementService implements IMaterialManagementService {
    private materialsRepository = new MaterialManagementRepository();

    async getAllMaterials(): Promise<MaterialResponse[]> {
        try {
            // ✅ Try cache first
            const cacheKey = 'materials:all';
            const cached = CacheService.get<MaterialResponse[]>(cacheKey);
            
            if (cached) {
                logger.info('Materials retrieved from cache', { count: cached.length });
                return cached;
            }

            const materials = await this.materialsRepository.getAllMaterials();

            if (!materials || materials.length === 0) {
                throw new HttpException(404, "No materials found");
            }

            const result = materials.map((material) => ({
                id: material.id,
                unique_id: material.uniqueId,
                name: material.name,
                description: material.description,
                quantity: material.quantity,
                status: material.status,
                createdAt: material.createdAt,
                updatedAt: material.updatedAt,
            }));

            // ✅ Cache for 15 minutes (rarely changes)
            CacheService.set(cacheKey, result, CACHE_TTL.MODERATE.MATERIAL_LIST);

            logger.info('Materials retrieved from database and cached', { count: result.length });
            return result;
        } catch (error) {
            logger.error("Error fetching materials", { error });
            throw new HttpException(500, "Internal server error");
        }
    }

    async getMaterialById(id: number): Promise<MaterialResponse> {
        try {
            // ✅ Try cache first
            const cacheKey = `material:${id}`;
            const cached = CacheService.get<MaterialResponse>(cacheKey);
            
            if (cached) {
                logger.info('Material retrieved from cache', { material_id: id });
                return cached;
            }

            const material = await this.materialsRepository.getMaterialById(id);

            if (!material) {
                throw new HttpException(404, "Material not found");
            }

            const result = {
                id: material.id,
                unique_id: material.uniqueId,
                name: material.name,
                description: material.description,
                quantity: material.quantity,
                status: material.status,
                createdAt: material.createdAt,
                updatedAt: material.updatedAt,
            };

            // ✅ Cache for 15 minutes
            CacheService.set(cacheKey, result, CACHE_TTL.MODERATE.MATERIAL_LIST);

            logger.info('Material retrieved from database and cached', { material_id: id });
            return result;
        } catch (error) {
            logger.error("Error fetching material", { error });
            throw new HttpException(500, "Internal server error");
        }
    }

    async createMaterial(request: createMaterialRequest): Promise<MaterialResponse> {
        const { name, description, quantity, status } = request;

        // Token verification
        const token =
            (request as any).token ??
            (request as any).headers?.authorization?.split?.(' ')[1] ??
            (request as any).authorization?.split?.(' ')[1];

        if (!token) {
            throw new HttpException(401, "Authentication token missing");
        }

        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || "");
        } catch (err) {
            logger.warn("Invalid JWT token", { err });
            throw new HttpException(401, "Invalid authentication token");
        }

        if (!decoded || !decoded.role) {
            throw new HttpException(403, "User role not found in token");
        }

        if (!["admin", "manager"].includes(decoded.role)) {
            throw new HttpException(403, "Forbidden: insufficient role");
        }

        try {
            if (name.length > 255) {
                throw new HttpException(400, "Material name exceeds maximum length of 255 characters");
            }

            if (status && !Object.values(statusMaterials).includes(status)) {
                throw new HttpException(400, "Invalid material status");
            }

            const generateUniqueId = `MAT-${uuidv4()}`; 
            const newMaterial = await this.materialsRepository.createMaterial({
                uniqueId: generateUniqueId,
                name,
                description: description || "",
                quantity: quantity || 0,
                status: status || statusMaterials.AVAILABLE,
                createdAt: new Date(),
            });

            // ✅ Invalidate materials list cache
            CacheService.delete('materials:all');

            const result: MaterialResponse = {
                id: newMaterial.id,
                unique_id: newMaterial.uniqueId,
                name: newMaterial.name,
                description: newMaterial.description,
                quantity: newMaterial.quantity,
                status: newMaterial.status,
                createdAt: newMaterial.createdAt,
                updatedAt: newMaterial.updatedAt,
            };

            logger.info('Material created successfully', { material_id: result.id });
            return result;
        } catch (error) {
            logger.error("Error creating material", { error });
            throw new HttpException(500, "Internal server error");
        }
    }

    async updateMaterial(id: number, request: updateMaterialRequest): Promise<MaterialResponse> {
        const { name, description, quantity, status } = request;

        try {
            const existingMaterial = await this.materialsRepository.getMaterialById(id);
            if (!existingMaterial) {
                throw new HttpException(404, "Material not found");
            }

            if (name && name.length > 255) {
                throw new HttpException(400, "Material name exceeds maximum length of 255 characters");
            }

            if (status && !Object.values(statusMaterials).includes(status)) {
                throw new HttpException(400, "Invalid material status");
            }

            const updatedMaterial = await this.materialsRepository.updateMaterial(id, {
                name: name || existingMaterial.name,
                description: description || existingMaterial.description,
                quantity: quantity || existingMaterial.quantity,
                status: status || existingMaterial.status,
            });

            // ✅ Invalidate caches
            CacheService.delete(`material:${id}`);
            CacheService.delete('materials:all');

            const result: MaterialResponse = {
                id: updatedMaterial.id,
                unique_id: updatedMaterial.uniqueId,
                name: updatedMaterial.name,
                description: updatedMaterial.description,
                quantity: updatedMaterial.quantity,
                status: updatedMaterial.status,
                createdAt: updatedMaterial.createdAt,
                updatedAt: updatedMaterial.updatedAt,
            };

            logger.info('Material updated and cache invalidated', { material_id: id });
            return result;
        } catch (error) {
            logger.error("Error updating material", { error });
            throw new HttpException(500, "Internal server error");
        }
    }

    async softDeleteMaterial(id: number): Promise<{ success: boolean; message: string; }> {
        try {
            const existingMaterial = await this.materialsRepository.getMaterialById(id);
            if (!existingMaterial) {
                throw new HttpException(404, "Material not found");
            }

            await this.materialsRepository.softDeleteMaterial(id);

            // ✅ Invalidate caches
            CacheService.delete(`material:${id}`);
            CacheService.delete('materials:all');

            logger.info('Material soft deleted and cache invalidated', { material_id: id });
            return { success: true, message: "Material soft deleted successfully" };
        } catch (error) {
            logger.error("Error soft deleting material", { error });
            throw new HttpException(500, "Internal server error");
        }
    }

    async deleteMaterial(id: number): Promise<{ success: boolean; message: string; }> {
        try {
            const existingMaterial = await this.materialsRepository.getMaterialById(id);
            if (!existingMaterial) {
                throw new HttpException(404, "Material not found");
            }

            await this.materialsRepository.deleteMaterial(id);

            // ✅ Invalidate caches
            CacheService.delete(`material:${id}`);
            CacheService.delete('materials:all');

            logger.info('Material deleted and cache invalidated', { material_id: id });
            return { success: true, message: "Material deleted successfully" };
        } catch (error) {
            logger.error("Error deleting material", { error });
            throw new HttpException(500, "Internal server error");
        }
    }
}

export default new MaterialManagementService();