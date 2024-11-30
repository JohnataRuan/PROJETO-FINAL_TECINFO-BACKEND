const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../utils/validarToken');
const connection = require('../database/connection');
const {querySelectAlunos,queryDeleteAlunos,querySelectSalas} = require('../utils/queries');




// Get para verificar todos alunos
router.get('/alunos', authenticateToken, (req, res) => {
    connection.query(querySelectAlunos, (err, rows) => {
        if (err) {
            console.error('Erro ao executar a consulta:', err);
            res.status(500).send('Erro interno do servidor');
            return;
        }
        res.json(rows);
    });
});

// Rota para deletar todos os alunos
router.delete('/deletaralunos', authenticateToken, (req, res) => {
    connection.query(queryDeleteAlunos, (error, result) => {
        if (error) {
            console.error('Erro ao deletar os alunos', error);
            res.status(500).send('Erro interno do servidor');
            return;
        }
        res.send('Alunos deletados com sucesso!');
    });
});

// Rota que faz o get das salas
router.get('/salas', authenticateToken, (req, res) => {
    connection.query(querySelectSalas, (err, rows) => {
        if (err) {
            console.error('Erro ao executar a consulta:', err);
            res.status(500).send('Erro interno do servidor');
            return;
        }

        const salas = rows.map(row => ({
            ensino: row.ensino,
            serie: row.serie,
            turma: row.turma,
        }));

        // Adiciona o header Content-Type
        res.setHeader('Content-Type', 'application/json');
        res.json(salas);
    });
});


module.exports = router;
