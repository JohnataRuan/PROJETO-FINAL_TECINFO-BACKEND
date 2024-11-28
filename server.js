const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const app = express();
const morgan = require('morgan'); // Responsável por retornar algumas informações extras das requisições
const multer = require('./config/multer'); // Importar o multer configurado
const cors = require('cors');
const PORT = 3000;
const path = require('path');
const readline = require('readline');
const fs = require("fs");


const bcrypt = require('bcrypt'); // Para criptografar a senha
require('dotenv').config();
const jwt = require('jsonwebtoken');


app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(bodyParser.json());


// Funções ou itens de outras páginas:

const {distribuirAlunosEmSalas} = require('./utils/funcaoSortear');
const {gerarPDFAssinatura} = require('./utils/funcaoGerarPDF');
const {gerarMapaDeSala} = require('./utils/funcaoGerarPDF');
const {gerarLocalizacaoAlunos} = require('./utils/funcaoGerarPDF');
const {authenticateToken} = require('./utils/validarToken');
const { processCSV } = require('./utils/functionsReq.js');
const { insertStudents } = require('./utils/functionsReq.js');
const { getStudentsBySeriesAndClass } = require('./utils/functionsReq.js');
const { salvarPDFTemporario } = require('./utils/functionsReq.js');
const { deletarPDFTemporario } = require('./utils/functionsReq.js');
const { salvarPDFMapaDeSalaTemporario } = require('./utils/functionsReq.js');
const { deletarPDFMapaDeSalaTemporario } = require('./utils/functionsReq.js');

// Expecificações da conexão
// Criação da conexão com o banco de dados
const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: "",
    database: 'teste'
});
// Conexão com o banco de dados
connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar no banco de dados: ' + err.stack);
        return;
    }
    console.log('Conectado ao banco de dados como id ' + connection.threadId);
});
                            // Parte do funcionamento do Login/Cadastro



// Rota de Login
app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    const query = 'SELECT * FROM usuarios WHERE email = ?';
    connection.query(query, [email], async (err, resultados) => {
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

        // Cria o token JWT
        const payload = { id: usuario.id, nome: usuario.nome };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES });

        // Envia o token e o nome do usuário para o frontend
        res.json({ mensagem: 'Login bem-sucedido', token, nome: usuario.nome });
    });
});


// Rota para cadastrar usuário
app.post('/cadastrar', async (req, res) => {
    const { nome, email, senha } = req.body;

    // Validar se todos os campos foram preenchidos
    if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios.' });
    }

    // Verificar se o email já existe
    connection.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ mensagem: 'Erro ao verificar o email.', erro: err });
        }

        if (results.length > 0) {
            return res.status(400).json({ mensagem: 'Este email já está registrado.' });
        }

        // Criptografar a senha
        const senhaHash = await bcrypt.hash(senha, 10); // '10' é o número de salt rounds

        // Inserir usuário no banco de dados
        connection.query('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)', [nome, email, senhaHash], (err, result) => {
            if (err) {
                return res.status(500).json({ mensagem: 'Erro ao criar usuário.', erro: err });
            }

            res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!' });
        });
    });
});


                            // Parte do funcionamento dos Uploads/Sorteios/PDFS



// Get para verificar todos alunos no banco de dados
app.get('/alunos',authenticateToken, (req, res) => {
    connection.query('SELECT * FROM alunos', (err, rows) => {
        if (err) {
            console.error('Erro ao executar a consulta:', err);
            res.status(500).send('Erro interno do servidor');
            return;
        }
        res.json(rows);
    });
});


app.get('/salas', authenticateToken, (req, res) => {
    connection.query('SELECT ensino, serie, turma FROM alunos GROUP BY ensino, serie, turma', (err, rows) => {
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


//Post do upload da planilha
app.post('/upload', authenticateToken, multer.single('file'), async (req, res) => {
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


// Rota para gerar o sorteio dos alunos
app.post('/sortearAlunos', authenticateToken, async (req, res) => {
    console.log('Recebida requisição para /sortearAlunos');
    const salasSelecionadas = req.body.salasSelecionadas;

    try {
        // Buscar alunos no banco de dados
        const todasSalasSelecionadas = await getStudentsBySeriesAndClass(connection, salasSelecionadas);

        // Distribuir os alunos nas salas
        const resultadoDistribuicao = distribuirAlunosEmSalas(todasSalasSelecionadas);

        // Retornar os resultados
        res.send({
            salasSelecionadas: todasSalasSelecionadas,
            salasSorteadas: resultadoDistribuicao
        });

    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        res.status(500).send('Erro ao buscar dados');
    }
});

// Rota para leitura dos dados e geração do PDF
app.post('/leituraPDF', authenticateToken, async (req, res) => {
    console.log('Recebida requisição para /leituraPDF');

    const armazenaDados = req.body.dadosNuvem;
    const nomeSala = req.body.nomeSala;

    if (!armazenaDados || armazenaDados.length === 0) {
        console.log('Nenhum dado de aluno foi fornecido.');
        return res.status(400).send('Nenhum dado de aluno foi fornecido.');
    }

    try {
        // Gerar o PDF com os dados e o nome da sala
        const pdfData = await gerarPDFAssinatura(armazenaDados, nomeSala);

        // Salvar o PDF temporariamente
        const pdfPath = await salvarPDFTemporario(pdfData, nomeSala);

        // Enviar o arquivo PDF como resposta
        res.sendFile(pdfPath, (err) => {
            if (err) {
                console.error('Erro ao enviar o arquivo PDF:', err);
                return res.status(500).send('Erro ao enviar o arquivo PDF.');
            }
            // Deletar o arquivo após enviar
            deletarPDFTemporario(pdfPath);
        });
    } catch (error) {
        console.error('Erro durante a geração do PDF:', error);
        res.status(500).send('Erro durante a geração do PDF.');
    }
});


// Rota para gerar o PDF do mapa de sala e enviar para download
app.post('/gerarMapaDeSala', authenticateToken, async (req, res) => {
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
app.post('/gerarLocalizacaoDeAlunos',authenticateToken, async (req, res) => {
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


// Deletar todos alunos do banco de dados
app.delete('/deletaralunos',authenticateToken, (req, res) => {
    connection.query('TRUNCATE TABLE alunos;',(error, result) => {
        if (error) {
            console.error('Erro ao deletar os alunos', error);
            res.status(500).send('Erro interno do servidor');
            return;
        }
        res.send('Alunos deletados com sucesso!');
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
