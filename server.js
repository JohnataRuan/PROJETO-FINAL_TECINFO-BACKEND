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


app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('public'));
app.use(bodyParser.json());


// Funções ou itens de outras páginas:

const {distribuirAlunosEmSalas} = require('./utils/funcaoSortear');
const {gerarPDFAssinatura} = require('./utils/funcaoGerarPDF');
const {gerarMapaDeSala} = require('./utils/funcaoGerarPDF');
const {gerarLocalizacaoAlunos} = require('./utils/funcaoGerarPDF');

// Expecificações da conexão
const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: "",
    database: 'teste'
});
// Conexão com o banco de dados
connection.connect((error) => {
    if (error) {
        console.log(`Erro ao conectar-se com o server: ${error.stack}`);
        return;
    }
    console.log(`Conectado ao banco de dados com sucesso! ${connection.threadId}`);
});
// Get para verificar todos alunos no banco de dados
app.get('/alunos', (req, res) => {
    connection.query('SELECT * FROM alunos', (err, rows) => {
        if (err) {
            console.error('Erro ao executar a consulta:', err);
            res.status(500).send('Erro interno do servidor');
            return;
        }
        res.json(rows);
    });
});
//Get dos arquivos selecionados
app.get('/salas', (req, res) => {
    connection.query('SELECT ensino ,serie, turma FROM alunos GROUP BY ensino,serie, turma', (err, rows) => {
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

        res.json(salas);
    });
});
//Post do upload da planilha
app.post('/upload', multer.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('Arquivo não encontrado');
        }

        const { ensino, serie, turma } = req.body;

        if (!ensino ||!turma || !serie) {
            return res.status(400).send('Ensino Turma e Série são obrigatórios');
        }

        const fileStream = readline.createInterface({
            input: require('stream').Readable.from([req.file.buffer.toString('utf-8')]),
            crlfDelay: Infinity
        });

        const armazenaDados = [];
        let firstLine = true;

        for await (const line of fileStream) {
            if (firstLine) {
                firstLine = false;
                continue;
            }
            const [matricula, nome] = line.split(',');
            armazenaDados.push({
                matricula: matricula.trim(),
                nome: nome.trim(),
            });
        }

        armazenaDados.forEach((aluno) => {
            const query = 'INSERT INTO alunos (matricula, nome, ensino, serie, turma) VALUES (?, ?, ?, ?, ?)';
            const values = [aluno.matricula, aluno.nome, ensino, serie, turma];

            connection.query(query, values, (error) => {
                if (error) {
                    console.error('Erro ao inserir dados:', error);
                    res.status(500).send('Erro ao inserir dados');
                    return;
                }
            });
        });
        res.status(200).send('Dados inseridos com sucesso!');
    } catch (error) {
        console.error('Erro ao processar o CSV:', error);
        res.status(500).send('Erro ao processar o CSV');
    }
});

app.post('/sortearAlunos', async (req, res) => {
    console.log('Recebida requisição para /sortearAlunos');
    const salasSelecionadas = req.body.salasSelecionadas;
    try {
        const todasSalasSelecionadas = await Promise.all(
            salasSelecionadas.map(sala => {
                const query = 'SELECT * FROM alunos WHERE serie = ? AND turma = ?';
                const values = [sala.serie, sala.turma];
                return new Promise((resolve, reject) => {
                    connection.query(query, values, (error, results) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(results);
                        }
                    });
                });
            })
        );
        
        const resultadoDistribuicao = distribuirAlunosEmSalas(todasSalasSelecionadas);

        res.send({  salasSelecionadas:todasSalasSelecionadas,
                    salasSorteadas:resultadoDistribuicao});

    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        res.status(500).send('Erro ao buscar dados');
    }
});


// Rota para leitura dos dados e geração do PDF
app.post('/leituraPDF', async (req, res) => {
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

        // Criar o caminho temporário do PDF
        const pdfPath = path.join(__dirname, `ListDeAssinatura_${nomeSala}.pdf`);

        // Escrever o PDF temporariamente
        fs.writeFileSync(pdfPath, pdfData);

        console.log('PDF gerado e armazenado temporariamente:', pdfPath);

        // Enviar o arquivo PDF como resposta
        res.sendFile(pdfPath, (err) => {
            if (err) {
                console.error('Erro ao enviar o arquivo PDF:', err);
                return res.status(500).send('Erro ao enviar o arquivo PDF.');
            }
            // Deletar o arquivo após enviar
            fs.unlink(pdfPath, (err) => {
                if (err) console.error('Erro ao deletar o arquivo temporário:', err);
                else console.log('Arquivo PDF temporário deletado.');
            });
        });
    } catch (error) {
        console.error('Erro durante a geração do PDF:', error);
        res.status(500).send('Erro durante a geração do PDF.');
    }
});


// Rota para gerar o PDF do mapa de sala e enviar para download
app.post('/gerarMapaDeSala', async (req, res) => {
    console.log('Recebida requisição para /gerarMapaDeSala');
    const { alunos, nomeSala } = req.body;

    try {
        // Gera o PDF com os dados dos alunos e o nome da sala
        const pdfData = await gerarMapaDeSala(alunos, nomeSala);

        // Define um caminho temporário para salvar o PDF
        const tempPdfPath = path.join(__dirname, `tempMapaDeSala_${nomeSala}.pdf`);
        fs.writeFileSync(tempPdfPath, pdfData);

        // Define os headers para envio do PDF como arquivo para download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=MapaDeSala_${nomeSala}.pdf`);

        // Envia o PDF diretamente na resposta
        res.sendFile(tempPdfPath, (err) => {
            // Após o envio, deleta o arquivo temporário
            fs.unlink(tempPdfPath, (unlinkErr) => {
                if (unlinkErr) console.error('Erro ao deletar o arquivo temporário:', unlinkErr);
                else console.log('Arquivo PDF temporário deletado.');
            });

            if (err) {
                console.error('Erro ao enviar o PDF:', err);
                res.status(500).send('Erro ao enviar o PDF');
            }
        });
    } catch (error) {
        console.error('Erro ao gerar o PDF:', error);
        res.status(500).send('Erro ao gerar o PDF');
    }
});


app.post('/gerarLocalizacaoDeAlunos', async (req, res) => {
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
app.delete('/alunos', (req, res) => {
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
