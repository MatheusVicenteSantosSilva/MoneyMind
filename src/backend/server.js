// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 3001;

// Importar rotas
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');

// Middlewares
app.use(cors({
    origin: 'http://localhost:3000' // Ajuste para a porta do seu React
}));
app.use(express.json());

// Usar Rotas
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

app.listen(PORT, () => {
    console.log(`Servidor Node.js rodando na porta ${PORT}`);
});
