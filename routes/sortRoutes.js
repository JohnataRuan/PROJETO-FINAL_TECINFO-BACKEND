const express = require('express');
const router = express.Router();
const { distribuirAlunosEmSalas } = require('../utils/funcaoSortear');
const { getStudentsBySeriesAndClass } = require('../utils/functionsReq');
const { authenticateToken } = require('../utils/validarToken');
const connection = require('../database/connection');

router.post('/sortearAlunos', authenticateToken, async (req, res) => {
    const salasSelecionadas = req.body.salasSelecionadas;

    try {
        const todasSalasSelecionadas = await getStudentsBySeriesAndClass(connection, salasSelecionadas);
        const resultadoDistribuicao = distribuirAlunosEmSalas(todasSalasSelecionadas);

        res.send({
            salasSelecionadas: todasSalasSelecionadas,
            salasSorteadas: resultadoDistribuicao
        });
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        res.status(500).send('Erro ao buscar dados');
    }
});

module.exports = router;
