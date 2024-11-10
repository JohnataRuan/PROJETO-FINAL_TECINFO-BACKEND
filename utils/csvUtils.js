// csvUtils.js
const fs = require('fs');
const readline = require('readline');

async function makeArrayWithCSV(nomeArquivo) {
    const armazenaDados = [];
    let firstLine = true;

    const line = readline.createInterface({
        input: fs.createReadStream(nomeArquivo),
        crlfDelay: Infinity
    });

    return new Promise((resolve, reject) => {
        line.on("line", (data) => {
            let csv = data.split(";");
            if (firstLine) {
                firstLine = false;
            } else {
                let dados = {
                    matricula: csv[0].trim(),
                    nomeAluno: csv[1].trim(),
                    turmaAluno: csv[2].trim(),
                    serieAluno: csv[3].trim()
                };
                armazenaDados.push(dados);
            }
        });

        line.on("close", () => resolve(armazenaDados));
        line.on("error", (error) => reject(error));
    });
}

module.exports = { makeArrayWithCSV };
