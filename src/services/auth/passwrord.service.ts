import type { IAuthService, UserResponse, RegisterResponse, LoginResponse } from "../../interfaces/auth.interface.js";
import { prisma } from "../../config/prisma.config.js";
import HttpException from "../../utils/HttpExecption.js";
import JWTUtils from "../../utils/jwt.js";
import logger from "../../utils/logger.js";
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
class PasswordService   {
   
}

export default new PasswordService();