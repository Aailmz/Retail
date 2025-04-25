# 🛍️ Retail - Store Management System

**Retail** is a modern web-based store management system that includes a fully integrated **Point of Sale (POS)** module. Built with **NestJS** and **Handlebars**, it provides an intuitive interface and seamless payment integration using **QRIS via Midtrans**.

---

## ✨ Features

- ✅ Product & Inventory Management
- ✅ Promotion Management with Mark-Up calculation
- ✅ POS (Point of Sale) System  
- ✅ QRIS Payment Integration (Midtrans)  
- ✅ Transaction History  
- ✅ Sales Dashboard  
- ✅ Role-based Access Control (Admin, Cashier, Storage.)  
- ✅ Authentication & Authorization  
- ✅ Dynamic Views with Handlebars  

---

## 🧰 Tech Stack

- **Backend Framework:** [NestJS](https://nestjs.com/)  
- **Templating Engine:** [Handlebars](https://handlebarsjs.com/)  
- **Database:** MySQL (depends on you actually)  
- **Payment Gateway:** [Midtrans - QRIS](https://docs.midtrans.com/)  
- **Authentication:** JWT & Sessions  

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/retail.git
cd retail
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory and configure it as follows:

```env
# Database Configuration
DB_TYPE=mysql
DB_HOST=your_host
DB_PORT=your_port
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=your_DBName

# Midtrans Configuration
MIDTRANS_CLIENT_KEY=your_ClientKey
MIDTRANS_SERVER_KEY=your_ServerKey
MIDTRANS_MERCHANT_ID=your_MerchantID
MIDTRANS_SANDBOX=true
```

> Set `MIDTRANS_SANDBOX=false` for production mode.

### 4. Run the Application

```bash
npm run start dev
```

The app will be available at `http://localhost:3000` (or your configured port).

---

## 🤝 Contributing

> ❗ This project is currently **not accepting contributions**.

This is a **final exam project**, developed individually as part of a software engineering assessment. Therefore, collaboration or external pull requests are currently not allowed.

---

## 📄 License

This project is licensed under the MIT License.

---

## 📬 Contact

For questions, collaboration, or feedback:  
📧 mirzazubaridjunaid@gmail.com
🔗 [Aailmz](https://github.com/Aailmz)

---
