import express from 'express';
import cors from 'cors';
import Cors_Settings from './config/cors.js';

const app = express();
app.use(cors(Cors_Settings));
