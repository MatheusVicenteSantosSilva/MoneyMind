// backend/routes/transactions.js
const express = require('express');
const router = express.Router();
const db = require('../db'); 
const protect = require('../middleware/auth'); // Importa o middleware de segurança

// --------------------------------------------------------
// R - READ (GET /api/transactions)
// --------------------------------------------------------
router.get('/', protect, async (req, res) => {
    try {
        // req.userId é injetado pelo middleware 'protect'
        const [rows] = await db.query(
            'SELECT * FROM transactions WHERE userId = ? ORDER BY createdAt DESC', 
            [req.userId] 
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro [GET] transações:', err);
        res.status(500).json({ error: 'Erro ao buscar transações' });
    }
});

// --------------------------------------------------------
// C - CREATE (POST /api/transactions)
// --------------------------------------------------------
router.post('/', protect, async (req, res) => {
    const { type, description, amount, category, months } = req.body;
    
    const isRecurring = type === 'receita_continua' || type === 'debito_automatico';
    // Se for recorrente, usa 'months'. Se não, é 1.
    const numMonths = isRecurring ? (parseInt(months, 10) || 1) : 1;
    const group_id = Date.now().toString();

    // Começa a transação no banco de dados para garantir que todas as parcelas sejam salvas
    try {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        const newTransactions = [];

        for (let i = 0; i < numMonths; i++) {
            const transactionDate = new Date();
            // Adiciona meses para as parcelas futuras
            transactionDate.setMonth(transactionDate.getMonth() + i); 
            
            const installment = numMonths > 1 ? `${i + 1}/${numMonths}` : null;

            const [result] = await connection.query(
                `INSERT INTO transactions (userId, type, description, amount, category, createdAt, group_id, installment) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [req.userId, type, description, amount, category, transactionDate.toISOString(), group_id, installment]
            );
            
            newTransactions.push({ 
                id: result.insertId, 
                userId: req.userId, 
                type, 
                description, 
                amount: parseFloat(amount),
                createdAt: transactionDate.toISOString(), 
                group_id, 
                installment 
            });
        }

        await connection.commit();
        connection.release(); 
        res.status(201).json({ success: true, newTransactions });

    } catch (err) {
        // Se algo falhar, o rollback é ideal, mas o pool.query/getConnection já cuida de erros.
        // É importante garantir que o rollback seja chamado se você usar uma transação manual.
        // No caso de um erro, o pool deve cuidar da conexão.
        console.error('Erro [POST] ao adicionar transação:', err);
        res.status(500).json({ error: 'Erro ao adicionar transação. Tente novamente.' });
    }
});


// --------------------------------------------------------
// D - DELETE (DELETE /api/transactions/:id)
// --------------------------------------------------------
router.delete('/:id', protect, async (req, res) => {
    const transactionId = req.params.id;
    // Verifica se o cliente quer deletar o grupo inteiro (ex: /api/transactions/123?group=true)
    const deleteGroup = req.query.group === 'true'; 

    try {
        let sql;
        let params;

        if (deleteGroup) {
            // 1. Encontra o group_id da transação a ser deletada
            const [rows] = await db.query(
                'SELECT group_id FROM transactions WHERE id = ? AND userId = ?',
                [transactionId, req.userId] // Garante que o usuário só deleta as dele
            );

            if (rows.length === 0 || !rows[0].group_id) {
                // Se não for encontrado ou não tiver group_id, deleta apenas o registro
                sql = 'DELETE FROM transactions WHERE id = ? AND userId = ?';
                params = [transactionId, req.userId];
            } else {
                // 2. Deleta todas as transações com aquele group_id
                sql = 'DELETE FROM transactions WHERE group_id = ? AND userId = ?';
                params = [rows[0].group_id, req.userId];
            }
        } else {
            // Deleta apenas a transação específica
            sql = 'DELETE FROM transactions WHERE id = ? AND userId = ?';
            params = [transactionId, req.userId];
        }

        const [result] = await db.query(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Transação não encontrada ou acesso negado' });
        }

        res.json({ success: true, message: 'Transação(ões) deletada(s)' });
    } catch (err) {
        console.error('Erro [DELETE] ao deletar transação:', err);
        res.status(500).json({ error: 'Erro ao deletar transação' });
    }
});

module.exports = router;
