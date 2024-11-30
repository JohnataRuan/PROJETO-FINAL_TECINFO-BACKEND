const readline = require('readline');
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');
const {queryInsertAlunos,querySelectAlunosSerieTurma} = require ('../utils/queries');


async function processCSV(buffer) {
    const fileStream = readline.createInterface({
        input: Readable.from([buffer]),
        crlfDelay: Infinity,
    });

    const armazenaDados = [];
    let firstLine = true;

    for await (const line of fileStream) {
        if (firstLine) {
            firstLine = false;
            continue; // Ignorar cabeçalho
        }

        const [matricula, nome] = line.split(',');

        if (!matricula || !nome) {
            console.warn(`Linha inválida (ignorando): ${line}`);
            continue;
        }

        armazenaDados.push({
            matricula: matricula.trim(),
            nome: nome.trim(),
        });
    }

    return armazenaDados;
}

function insertStudents(connection, students, ensino, serie, turma) {
    const insertPromises = students.map((aluno) => {
        return new Promise((resolve, reject) => {
            const values = [aluno.matricula, aluno.nome, ensino, serie, turma];

            connection.query(queryInsertAlunos, values, (error) => {
                if (error) {
                    console.error('Erro ao inserir dados:', error);
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    });

    return Promise.all(insertPromises);
}

function getStudentsBySeriesAndClass(connection, salasSelecionadas) {
    return Promise.all(
        salasSelecionadas.map(sala => {
            const values = [sala.serie, sala.turma];
            return new Promise((resolve, reject) => {
                connection.query(querySelectAlunosSerieTurma, values, (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });
        })
    );
}


async function salvarPDFTemporario(pdfData, nomeSala) {
    try {
        const pdfPath = path.join(__dirname, `temp_ListDeAssinatura_${nomeSala}.pdf`);
        fs.writeFileSync(pdfPath, pdfData);
        console.log('PDF salvo temporariamente em:', pdfPath);
        return pdfPath;
    } catch (error) {
        console.error('Erro ao salvar PDF temporário:', error);
        throw new Error('Erro ao salvar PDF temporário');
    }
}

function deletarPDFTemporario(pdfPath) {
    fs.unlink(pdfPath, (err) => {
        if (err) console.error('Erro ao deletar arquivo temporário:', err);
        else console.log('Arquivo PDF temporário deletado:', pdfPath);
    });
}

async function salvarPDFMapaDeSalaTemporario(pdfData, nomeSala) {
    try {
        const pdfPath = path.join(__dirname, `temp_MapaDeSala_${nomeSala}.pdf`);
        fs.writeFileSync(pdfPath, pdfData);
        console.log('PDF salvo temporariamente em:', pdfPath);
        return pdfPath;
    } catch (error) {
        console.error('Erro ao salvar PDF temporário:', error);
        throw new Error('Erro ao salvar PDF temporário');
    }
}

function deletarPDFMapaDeSalaTemporario(pdfPath) {
    fs.unlink(pdfPath, (err) => {
        if (err) console.error('Erro ao deletar arquivo temporário:', err);
        else console.log('Arquivo PDF temporário deletado:', pdfPath);
    });
}

module.exports = { processCSV,insertStudents,getStudentsBySeriesAndClass
                    ,salvarPDFTemporario,deletarPDFTemporario,salvarPDFMapaDeSalaTemporario,
                    deletarPDFMapaDeSalaTemporario};
