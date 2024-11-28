const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

function gerarPDFAssinatura(alunosValidos, nomeSala) {
    return new Promise((resolve, reject) => {
        const rowHeight = 14.5;
        const maxRowsPerPage = 60;
        const pageSize = 'A4';
        const doc = new PDFDocument({ size: pageSize, margin: 40 });

        // Armazena o PDF em um buffer em vez de salvar no sistema de arquivos
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            resolve(pdfBuffer);  // Retorna o Buffer do PDF
        });

        // Largura e centralização
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const centerX = doc.page.margins.left + pageWidth / 2;

        // Logotipo e título
        const logoPath = path.join(__dirname, '../assets/logo lourdinas.jpg');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, doc.page.margins.left + 40, 20, { width: 60 });
        } else {
            console.warn('Logo "logo lourdinas.jpg" não encontrado em', logoPath);
        }

        // Título e subtítulo
        doc.fillColor('#0583D6').fontSize(14).text('EVL - ESCOLA VIRGEM DE LOURDES', centerX - 240, 25, { align: 'center' });
        doc.fillColor('black').fontSize(12).text(`Lista de Assinatura ${nomeSala}`, centerX - 240, 60, { align: 'center' });

        // Configuração das colunas
        const columnWidths = {
            turmaSerie: 70,
            aluno: 240,
            fila: 25,
            carteira: 50,
            assinatura: 160
        };
        const totalColumnsWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0);
        const startX = centerX - (totalColumnsWidth / 2);
        const startY = 100;

        // Cabeçalhos das colunas
        let x = startX;
        doc.fontSize(12).fillColor('black');
        doc.text('Turma', x, startY, { width: columnWidths.turmaSerie, align: 'center' });
        x += columnWidths.turmaSerie;
        doc.text('Aluno', x, startY, { width: columnWidths.aluno, align: 'left' });
        x += columnWidths.aluno;
        doc.text('Fila', x, startY, { width: columnWidths.fila, align: 'center' });
        x += columnWidths.fila;
        doc.text('Cadeira', x, startY, { width: columnWidths.carteira, align: 'center' });
        x += columnWidths.carteira;
        doc.text('Assinatura', x, startY, { width: columnWidths.assinatura, align: 'center' });

        // Dados dos alunos
        alunosValidos.slice(0, maxRowsPerPage).forEach((dado, index) => {
            const yPos = startY + (index + 1) * rowHeight;
            let x = startX;

            const turmaSerie = `${dado.serie} ${dado.turma}`;
            doc.fontSize(10).text(turmaSerie, x, yPos, { width: columnWidths.turmaSerie, align: 'center' });
            x += columnWidths.turmaSerie;

            doc.fontSize(8).font('Helvetica-Bold').text(dado.nome, x, yPos, { width: columnWidths.aluno, align: 'left' });
            x += columnWidths.aluno;

            doc.font('Helvetica').text(dado.fila, x, yPos, { width: columnWidths.fila, align: 'center' });
            x += columnWidths.fila;

            doc.text(dado.cadeira, x, yPos, { width: columnWidths.carteira, align: 'center' });
            x += columnWidths.carteira;

            doc.text('__________________________________', x, yPos, { width: columnWidths.assinatura, align: 'center' });
        });

        doc.end();
    });
}


// Função para gerar o PDF do mapa da sala
function gerarMapaDeSala(armazenaDados, nomeSala) {
    return new Promise((resolve, reject) => {
        // Cria o documento PDF em modo paisagem (deitado)
        const doc = new PDFDocument({ layout: 'landscape' });

        // Define o fluxo de escrita do PDF
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);  // Resolve a promise com os dados do PDF
        });

        // Logotipo e título alinhados horizontalmente
        const logoPath = path.join(__dirname, '../assets/logo lourdinas.jpg');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, doc.page.margins.left + 40, 20, { width: 60 }); // Alinhado à esquerda da página
        } else {
            console.warn('Logo "logo lourdinas.jpg" não encontrado em', logoPath);
        }

        doc.fillColor('#0583D6').fontSize(14).text('NSL - COLÉGIO NOSSA SENHORA DE LOURDES', { align: 'center' });
        doc.moveDown();
        doc.fillColor('black').fontSize(12).text(`Mapa de Sala ${nomeSala}`, { align: "center" });
        doc.moveDown();

        // Define as variáveis para o layout das cadeiras
        const larguraCadeira = 94;
        const alturaCadeira = 45;
        const margemTopo = 150;
        const margemEsquerdaMapa = 30;
        const espacamentoHorizontal = 8;
        const espacamentoVertical = 10;

        // Ordena e distribui os dados no PDF
        armazenaDados.forEach((dado) => {
            const posX = margemEsquerdaMapa + (dado.fila - 1) * (larguraCadeira + espacamentoHorizontal);
            const posY = margemTopo + (dado.cadeira - 1) * (alturaCadeira + espacamentoVertical);

            doc.rect(posX, posY, larguraCadeira, alturaCadeira).stroke();

            if (dado.cadeira === 1) {
                doc.fontSize(10).text(`Fila: ${dado.fila}`, posX + 35, posY - 15);
            }

            doc.fontSize(7).text(`Cadeira: ${dado.cadeira}`, posX + 30, posY + 5);
            doc.fontSize(8).text('_____________________', posX, posY + 8);
            doc.fontSize(6).text(dado.nome, posX + 4, posY + 18, { width: larguraCadeira - 10 });
            doc.fontSize(6).text(`Turma ${dado.turma} ${dado.serie}`, posX + 5, posY + 35);
        });

        // Finaliza o documento PDF
        doc.end();
    });
}

async function gerarLocalizacaoAlunos(armazenaDados, nomeSala) {
    return new Promise((resolve, reject) => {
        // Cria um novo documento PDF
        const doc = new PDFDocument({ size: 'A4' });
        const pdfStream = doc; // Usa o próprio objeto doc como o stream

        // Logotipo e título alinhados horizontalmente
        const logoPath = path.join(__dirname, '../assets/logo lourdinas.jpg');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, doc.page.margins.left + 10, 20, { width: 60 }); // Alinhado à esquerda da página
        } else {
            console.warn('Logo "logo lourdinas.jpg" não encontrado em', logoPath);
        }

        doc.fillColor('#0583D6'); // Definir a cor do texto
        doc.moveDown(-2);

        // Adicionar um título
        doc.fontSize(14).text('NLS - COLÉGIO NOSSA SENHORA DE LOURDES', { align: 'center' });
        doc.moveDown(); // Adiciona uma linha em branco
        doc.fillColor('black');
        doc.fontSize(14).text(`Sala: ${nomeSala}`, { align: "center" }); // Título da sala
        doc.moveDown();

        // Definindo as larguras das colunas
        const larguraColunaTurma = 60;
        const larguraColunaAluno = 250;
        const larguraColunaFila = 40;
        const larguraColunaCarteira = 50;
        const larguraColunaSalaProva = 90;
        const margemEsquerda = 30;
        const alturaLinha = 13; // Altura de linha
        

        // Definindo as posições iniciais das colunas
        const colunaTurmaX = margemEsquerda;
        const colunaAlunoX = colunaTurmaX + larguraColunaTurma;
        const colunaFilaX = colunaAlunoX + larguraColunaAluno;
        const colunaCarteiraX = colunaFilaX + larguraColunaFila;
        const colunaSalaProvaX = colunaCarteiraX + larguraColunaCarteira;

        // Cabeçalhos das colunas
        doc.fontSize(12).text('Turma', colunaTurmaX, 105);
        doc.fontSize(12).text('Aluno', colunaAlunoX, 105);
        doc.fontSize(12).text('Fila', colunaFilaX, 105);
        doc.fontSize(12).text('Carteira', colunaCarteiraX, 105);
        doc.fontSize(12).text('Sala Prova', colunaSalaProvaX + 60, 95);
        doc.moveDown(); // Adiciona uma linha em branco

        // Adiciona os dados ao PDF
        armazenaDados.forEach((dado, index) => {
            if (!dado.serie || !dado.turma || !dado.nome || !dado.fila || !dado.cadeira || !dado.salaProva) {
                console.error('Dados incompletos para o aluno na posição', index, dado);
                return; // Pular este dado se estiver incompleto
            }
            
            const yPos = 110 + (index + 1.2) * alturaLinha; // Calcula a posição y para cada linha

            // Escreve os dados nas colunas
            doc.fontSize(10).text(dado.serie, colunaTurmaX + 8, yPos, { width: larguraColunaTurma });
            doc.fontSize(10).text(dado.turma, colunaTurmaX + 14, yPos, { width: larguraColunaTurma });
            doc.font('Helvetica-Bold'); // deixar textos em negrito
            doc.fontSize(8).text(dado.nome, colunaAlunoX, yPos, { width: larguraColunaAluno });
            doc.font('Helvetica');// voltar para a cor padrão
            doc.fontSize(10).text(dado.fila, colunaFilaX + 8, yPos, { width: larguraColunaFila });
            doc.fontSize(10).text(dado.cadeira, colunaCarteiraX + 20, yPos, { width: larguraColunaCarteira });
            doc.fontSize(10).text(dado.salaProva, colunaSalaProvaX+ 72, yPos, { width: larguraColunaSalaProva });
        });

        doc.end(); // Finaliza o PDF

        // Resolve a promise com o stream do PDF
        resolve(pdfStream);
    });
}

module.exports = {gerarPDFAssinatura,gerarMapaDeSala,gerarLocalizacaoAlunos}