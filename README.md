# 🛒 QuickCart - 10-Minute Grocery Delivery Platform

QuickCart is a full-stack fast-commerce application designed to deliver groceries in 10 minutes. It features a complete ecosystem for Customers, Admins, and Drivers.

## 🚀 Features

### 👤 Customer Portal
- **Browse Products:** View products with real-time stock levels.
- **Shopping Cart:** Persistent cart management.
- **Checkout:** Seamless ordering process.
- **Order History:** View past orders and current status.

### 🛡️ Admin Dashboard
- **Dashboard Stats:** Live view of total revenue, orders, and low stock alerts.
- **Inventory Management:** CRUD operations for products with stock tracking.
- **Order Management:** View all orders and update their status (e.g., Packing, Out for Delivery).

### 🚗 Driver Portal
- **Job Board:** View available orders ready for pickup.
- **Delivery Workflow:** Accept orders and mark them as delivered.
- **History:** View completed deliveries.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, TypeScript, SCSS Modules
- **Backend:** Node.js, Express, TypeScript
- **Database:** MySQL, Prisma ORM
- **State Management:** React Context API
- **Styling:** Custom SCSS (Green & Cream Theme)

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v16+)
- Yarn package manager
- MySQL Server (running locally)

### 2. Installation
Clone the repository and install dependencies for both client and server using Yarn Workspaces.

```bash
# Install all dependencies
yarn install
````

### 3\. Database Setup

1.  Create an empty database in MySQL (e.g., `quickcart_db`).
2.  Configure the environment variables in `server/prisma/.env`:

<!-- end list -->

```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/quickcart_db"
JWT_SECRET="your_super_secret_key"
```

3.  Run migrations and seed the database:

<!-- end list -->

```bash
# Create tables
yarn prisma:migrate

# Seed data (Admin, Driver, Products, Stock)
yarn seed
```

-----

## 🏃‍♂️ Running the Application

You need two terminal windows to run the full stack.

**Terminal 1: Backend API**

```bash
yarn dev:server
# Runs on http://localhost:5000
```

**Terminal 2: Frontend App**

```bash
yarn dev:client
# Runs on http://localhost:5173
```

-----

## 🔑 Test Accounts

The `yarn seed` command creates these default accounts for you:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@quickcart.com` | `admin123` | Full access to Dashboard, Inventory, Orders |
| **Driver** | `driver@quickcart.com` | `admin123` | Access to Driver Portal |
| **Packer** | `packer@quickcart.com` | `admin123` | Access to Packer Portal |
| **Customer** | *(Register New)* | *(Any)* | Browse, Cart, Checkout |

-----

## 📁 Project Structure

```
quickcart/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI (DataGrid, Toast, etc.)
│   │   ├── contexts/       # Global State (Auth, Cart, Toast)
│   │   ├── pages/          # Views (Admin, Customer, Driver)
│   │   └── services/       # API Client (Axios)
│
└── server/                 # Express Backend
    ├── prisma/             # Database Schema & Seed
    └── src/
        ├── api/            # Controllers & Routes
        └── lib/            # Shared utilities (Prisma Client)
```

```

### 🥂 Congratulations!

You have successfully built **QuickCart** from scratch!

You now have a portfolio-ready Full Stack application that demonstrates:
* **Complex Architecture:** Monorepo with Yarn Workspaces.
* **Database Design:** Relational data with Prisma & MySQL.
* **Security:** JWT Authentication & Role-Based Access Control.
* **Real-World Logic:** Inventory management, order transactions, and logistics.
* **UX/UI:** Consistent branding and responsive design.

**Would you like me to guide you on how to deploy this to a live server (like Vercel or Render), or is this local build sufficient?**
```
