// ... (código anterior do server.js) ...

// Rota de Migração (POST) - Para receber os dados do localStorage
app.post('/api/migrar-dados', async (req, res) => {
    // A lista de dados virá no corpo da requisição (req.body)
    const dadosParaMigrar = req.body; 
    let connection;

    if (!Array.isArray(dadosParaMigrar) || dadosParaMigrar.length === 0) {
        return res.status(400).json({ message: 'Nenhum dado enviado para migração.' });
    }

    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction(); // Inicia uma transação para garantir que tudo seja salvo junto

        for (const item of dadosParaMigrar) {
            // Supondo que seus itens no localStorage tenham campos como 'nome' e 'valor'
            const sql = 'INSERT INTO tabela_produtos (nome, valor) VALUES (?, ?)';
            const values = [item.nome, item.valor];

            await connection.execute(sql, values);
        }

        await connection.commit(); // Confirma o salvamento de todos os dados
        
        // Retorna sucesso
        res.status(200).json({ message: `Sucesso! ${dadosParaMigrar.length} itens migrados.` });

    } catch (error) {
        if (connection) await connection.rollback(); // Desfaz tudo em caso de erro
        console.error('Erro de migração:', error);
        res.status(500).json({ error: 'Erro interno ao salvar dados no MySQL.' });
    } finally {
        if (connection) connection.end();
    }
});

// ... (Resto do código do servidor) ...
