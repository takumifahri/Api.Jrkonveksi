import cors from 'cors';

const Cors_Settings: cors.CorsOptions = {
    origin: [
        "*", // ✅ Sesuaikan dengan kebutuhan Anda
    ],
    methods: [
        'GET', 
        'HEAD', 
        'PUT', 
        'PATCH', 
        'POST', 
        'DELETE',
        'OPTIONS' // ✅ Tambahkan OPTIONS untuk preflight
    ],
    allowedHeaders: [
        'Content-Type', 
        'Authorization'
    ],
    credentials: true,
    preflightContinue: false, // ✅ Tambahkan ini
    optionsSuccessStatus: 204 // ✅ Tambahkan ini untuk legacy browsers
};

export default Cors_Settings;