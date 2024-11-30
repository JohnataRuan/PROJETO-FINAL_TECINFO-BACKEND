const express = require('express');
const multer = require('../config/multer');
const router = express.Router();
const { processCSV, insertStudents } = require('../utils/functionsReq');
const { authenticateToken } = require('../utils/validarToken');
const connection = require('../database/connection');

router.post('/upload', authenticateToken, multer.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('Arquivo não encontrado');
        }

        const { ensino, serie, turma } = req.body;

        if (!ensino || !turma || !serie) {
            return res.status(400).send('Ensino, Turma e Série são obrigatórios');
        }

        const armazenaDados = await processCSV(req.file.buffer);
        await insertStudents(connection, armazenaDados, ensino, serie, turma);

        res.status(200).send('Dados inseridos com sucesso!');
    } catch (error) {
        console.error('Erro ao processar o CSV:', error);
        res.status(500).send('Erro ao processar o CSV');
    }
});

module.exports = router;
