const express = require('express');
const router = express.Router();
const { gerarPDFAssinatura, gerarMapaDeSala, gerarLocalizacaoAlunos } = require('../utils/funcaoGerarPDF');
const {salvarPDFTemporario,deletarPDFTemporario,salvarPDFMapaDeSalaTemporario,
    deletarPDFMapaDeSalaTemporario } = require('../utils/functionsReq');
const { authenticateToken } = require('../utils/validarToken');

router.post('/leituraPDF', authenticateToken, async (req, res) => {
    const armazenaDados = req.body.dadosNuvem;
    const nomeSala = req.body.nomeSala;

    if (!armazenaDados || armazenaDados.length === 0) {
        return res.status(400).send('Nenhum dado de aluno foi fornecido.');
    }

    try {
        const pdfData = await gerarPDFAssinatura(armazenaDados, nomeSala);
        const pdfPath = await salvarPDFTemporario(pdfData, nomeSala);

        res.sendFile(pdfPath, (err) => {
            if (err) {
                console.error('Erro ao enviar o arquivo PDF:', err);
                return res.status(500).send('Erro ao enviar o PDF.');
            }
            deletarPDFTemporario(pdfPath);
        });
    } catch (error) {
        console.error('Erro durante a geração do PDF:', error);
        res.status(500).send('Erro durante a geração do PDF.');
    }
});


// Rota para gerar o PDF do mapa de sala e enviar para download
router.post('/gerarMapaDeSala', authenticateToken, async (req, res) => {
    console.log('Recebida requisição para /gerarMapaDeSala');
    const { alunos, nomeSala } = req.body;

    try {
        // Gera o PDF com os dados dos alunos e o nome da sala
        const pdfData = await gerarMapaDeSala(alunos, nomeSala);

        // Salvar o PDF temporariamente
        const tempPdfPath = await salvarPDFMapaDeSalaTemporario(pdfData, nomeSala);

        // Define os headers para envio do PDF como arquivo para download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=MapaDeSala_${nomeSala}.pdf`);

        // Envia o PDF diretamente na resposta
        res.sendFile(tempPdfPath, (err) => {
            // Após o envio, deleta o arquivo temporário
            deletarPDFMapaDeSalaTemporario(tempPdfPath);

            if (err) {
                console.error('Erro ao enviar o PDF:', err);
                return res.status(500).send('Erro ao enviar o PDF');
            }
        });
    } catch (error) {
        console.error('Erro ao gerar o PDF:', error);
        res.status(500).send('Erro ao gerar o PDF');
    }
});


// Rota para gerar o PDF de localização do local de provas
router.post('/gerarLocalizacaoDeAlunos',authenticateToken, async (req, res) => {
    const { arrayDeAlunos, nomeSala } = req.body; // Desestruturando os dados do corpo da requisição

    try {

        // Gera o PDF com os dados dos alunos e o nome da sala
        const pdfStream = await gerarLocalizacaoAlunos(arrayDeAlunos, nomeSala); // Gera o PDF em stream

        // Define os headers para envio do PDF como arquivo para download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=MapaDeSala_${nomeSala}.pdf`);

        // Envia o PDF diretamente na resposta
        pdfStream.pipe(res); // Envia o stream para a resposta

        // Após o envio, o stream é fechado automaticamente
        pdfStream.on('end', () => {
            console.log('PDF enviado com sucesso');
        });

        pdfStream.on('error', (err) => {
            console.error('Erro ao enviar o PDF:', err);
            res.status(500).send('Erro ao enviar o PDF');
        });
    } catch (error) {
        console.error('Erro ao gerar o PDF:', error);
        res.status(500).send('Erro ao gerar o PDF');
    }
});


// Outras rotas relacionadas ao PDF
module.exports = router;
