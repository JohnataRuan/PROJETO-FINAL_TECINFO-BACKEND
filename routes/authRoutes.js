const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connection = require('../database/connection'); 
const { querySelectEmail, queryInsertCadastro } = require('../utils/queries');


// Rota de Login
router.post('/login', (req, res) => {
    const { email, senha } = req.body;


    connection.query(querySelectEmail, [email], async (err, resultados) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err.message);
            return res.status(500).json({ mensagem: 'Erro no servidor' });
        }

        if (resultados.length === 0) {
            return res.status(401).json({ mensagem: 'Usuário ou senha inválidos' });
        }

        const usuario = resultados[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ mensagem: 'Usuário ou senha inválidos' });
        }

        const payload = { id: usuario.id, nome: usuario.nome };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES });

        res.json({ mensagem: 'Login bem-sucedido', token, nome: usuario.nome });
    });
});

// Rota para cadastrar usuário
router.post('/cadastrar', async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios.' });
    }

    connection.query(querySelectEmail, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ mensagem: 'Erro ao verificar o email.', erro: err });
        }

        if (results.length > 0) {
            return res.status(400).json({ mensagem: 'Este email já está registrado.' });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        connection.query(queryInsertCadastro, [nome, email, senhaHash], (err, result) => {
            if (err) {
                return res.status(500).json({ mensagem: 'Erro ao criar usuário.', erro: err });
            }

            res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!' });
        });
    });
});

module.exports = router;
