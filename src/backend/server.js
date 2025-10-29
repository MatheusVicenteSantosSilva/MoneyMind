// backend/server.js (AJUSTADO)
const express = require('express');
const cors = require('cors');
require('dotenv').config(); 

// Configurações do banco de dados Clever Cloud
process.env.MYSQL_ADDON_HOST = "bxmtixqywgoapzy8nyei-mysql.services.clever-cloud.com";
process.env.MYSQL_ADDON_DB = "bxmtixqywgoapzy8nyei";
process.env.MYSQL_ADDON_USER = "u02vstkj2idmhuw7";
process.env.MYSQL_ADDON_PORT = "3306";
process.env.MYSQL_ADDON_PASSWORD = "oXpo6JIPPlQk9aAvg62i";
process.env.MYSQL_ADDON_URI = "mysql://u02vstkj2idmhuw7:oXpo6JIPPlQk9aAvg62i@bxmtixqywgoapzy8nyei-mysql.services.clever-cloud.com:3306/bxmtixqywgoapzy8nyei";

const app = express();
const PORT = process.env.PORT || 3001;

// Importar rotas
const authRoutes = require('./routes/auth'); // PRECISA SER CRIADA!
const transactionRoutes = require('./routes/transactions');

// Middlewares
app.use(cors({
    origin: 'http://localhost:3000' 
}));
app.use(express.json());

// Usar Rotas
app.use('/api/auth', authRoutes);         // Rota de autenticação
app.use('/api/transactions', transactionRoutes); // Rota de transações

app.listen(PORT, () => {
    console.log(`Servidor Node.js rodando na porta ${PORT}`);
});
