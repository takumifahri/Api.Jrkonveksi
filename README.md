# JR Konveksi - Express.js API

Backend API untuk JR Konveksi menggunakan Express.js, TypeScript, dan Prisma ORM dengan PostgreSQL.

## 📋 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma 7.x
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod
- **Security**: Helmet, CORS

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm atau yarn

### Installation

1. Clone repository
```bash
git clone https://github.com/yourusername/Jrkonveksi-ExpressJs.git
cd Jrkonveksi-ExpressJs
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/jrkonveksi"

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

4. Generate Prisma Client
```bash
npm run prisma:generate
```

5. Run migrations
```bash
npm run prisma:migrate
```

6. Seed database (optional)
```bash
npm run prisma:seed
```

7. Start development server
```bash
npm run dev:watch
```

Server akan berjalan di `http://localhost:3000`

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run development server (no auto-reload) |
| `npm run dev:watch` | Run development server with nodemon (auto-reload) |
| `npm run build` | Build production bundle |
| `npm start` | Run production server |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:migrate:fresh` | Reset database and run migrations (no seed) |
| `npm run prisma:migrate:fresh:seed` | Reset database, run migrations, and seed data |
| `npm run prisma:seed` | Seed database only |
| `npm run prisma:studio` | Open Prisma Studio (database GUI) |

## 🗂️ Project Structure

```
Jrkonveksi-ExpressJs/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Database seeder
│   └── migrations/            # Migration files
├── src/
│   ├── config/
│   │   ├── prisma.config.ts   # Prisma configuration
│   │   └── cors.ts            # CORS settings
│   ├── controllers/           # Route controllers
│   ├── middlewares/           # Express middlewares
│   ├── routes/                # API routes
│   ├── services/              # Business logic
│   ├── validators/            # Zod validation schemas
│   ├── utils/                 # Helper functions
│   ├── types/                 # TypeScript types
│   ├── app.ts                 # Express app configuration
│   └── server.ts              # Server entry point
├── generated/                 # Generated Prisma Client (gitignored)
├── dist/                      # Build output (gitignored)
├── .env                       # Environment variables (gitignored)
├── .env.example               # Environment variables example
├── nodemon.json               # Nodemon configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## 📊 Database Schema

### Models

- **User**: User accounts with authentication
- **Role**: User roles (Admin, User, etc.)
- **Materials**: Inventory materials management
- **ContactForm**: Customer contact messages
- **ResponseContact**: Admin responses to contacts

### Entity Relationship

```
User ─────< ResponseContact
 │
 └──── Role
 
ContactForm ─────< ResponseContact
```

## 🔐 Authentication

API menggunakan JWT (JSON Web Tokens) untuk authentication.

### Login Flow

1. User login dengan email & password
2. Server validate credentials
3. Server generate JWT token
4. Client store token (localStorage/cookie)
5. Client send token di header: `Authorization: Bearer <token>`


## 🔒 Security Features

- ✅ Helmet.js - Security headers
- ✅ CORS - Cross-Origin Resource Sharing
- ✅ JWT Authentication
- ✅ Password hashing (bcrypt)
- ✅ Input validation (Zod)
- ✅ SQL Injection protection (Prisma)
- ✅ Rate limiting (coming soon)

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `CORS_ORIGIN` | Allowed CORS origin | * |

## 🚢 Deployment

### Build for production

```bash
npm run build
```

### Start production server

```bash
npm start
```

### Docker (optional)

```bash
docker build -t jrkonveksi-api .
docker run -p 3000:3000 jrkonveksi-api
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- **Your Name** - [GitHub Profile](https://github.com/yourusername)

## 🙏 Acknowledgments

- Express.js Team
- Prisma Team
- TypeScript Team

## 📞 Support

For support, email support@jrkonveksi.com or join our Slack channel.

---

Made with ❤️ by JR Konveksi Team