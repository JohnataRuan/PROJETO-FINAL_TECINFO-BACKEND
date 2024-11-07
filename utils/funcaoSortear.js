

// Função para embaralhar um array (método de Fisher-Yates)
function embaralharArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Função para verificar se um aluno pode ser alocado em uma posição específica
function podeAlocar(aluno, sala, index, cadeirasPorFila) {
    const posicoesParaVerificar = [
        index - 1,               // À esquerda
        index + 1,               // À direita
        index - cadeirasPorFila, // Atrás
        index + cadeirasPorFila  // À frente
    ];

    for (const pos of posicoesParaVerificar) {
        if (
            pos >= 0 && pos < sala.length &&
            sala[pos] &&
            sala[pos].turma === aluno.turma &&
            sala[pos].serie === aluno.serie
        ) {
            return false;
        }
    }
    return true;
}

// Função para encontrar uma posição válida na sala para um aluno
function encontrarPosicaoValida(aluno, sala, cadeirasPorFila) {
    for (let index = 0; index < sala.length; index++) {
        if (!sala[index] && podeAlocar(aluno, sala, index, cadeirasPorFila)) {
            return index;
        }
    }
    return null; // Retorna null se nenhuma posição for encontrada
}

// Função principal para distribuir os alunos em salas
function distribuirAlunosEmSalas(salasSelecionadas) {
    const cadeirasPorFila = 7;

    // Embaralha todos os alunos para garantir aleatoriedade
    const todosAlunos = embaralharArray(salasSelecionadas.flat());
    const numeroAlunosPorSala = salasSelecionadas.map(sala => sala.length);
    const quantidadeSalas = salasSelecionadas.length;

    // Array para armazenar a distribuição final das salas mantendo o mesmo número de alunos
    const salasDistribuidas = Array.from({ length: quantidadeSalas }, (_, i) => new Array(numeroAlunosPorSala[i]).fill(null));

    let indexAluno = 0;
    const alunosNaoAlocados = [];

    // Distribui os alunos em cada sala
    for (let i = 0; i < quantidadeSalas; i++) {
        const sala = salasDistribuidas[i];
        const serie = salasSelecionadas[i][0].serie;
        const turma = salasSelecionadas[i][0].turma;
        const salaProva = `${serie}${turma}`;

        let alunosAlocados = 0;

        for (let index = 0; index < numeroAlunosPorSala[i] && alunosAlocados < numeroAlunosPorSala[i]; index++) {
            if (indexAluno >= todosAlunos.length) break;
            const aluno = todosAlunos[indexAluno];

            // Tenta alocar o aluno em uma posição válida
            if (podeAlocar(aluno, sala, index, cadeirasPorFila)) {
                const fila = Math.floor(index / cadeirasPorFila) + 1;
                const cadeira = (index % cadeirasPorFila) + 1;
                sala[index] = { ...aluno, fila, cadeira, salaProva };
                indexAluno++;
                alunosAlocados++;
            } else {
                // Se não for possível, adiciona aluno à lista de não alocados
                alunosNaoAlocados.push(aluno);
                indexAluno++;
            }
        }
    }

    // Realoca alunos não alocados, percorrendo todas as salas
    for (const aluno of alunosNaoAlocados) {
        let alocado = false;

        for (let i = 0; i < quantidadeSalas; i++) {
            const sala = salasDistribuidas[i];
            const serie = salasSelecionadas[i][0].serie;
            const turma = salasSelecionadas[i][0].turma;
            const salaProva = `${serie}${turma}`;
            
            const posicaoAlternativa = encontrarPosicaoValida(aluno, sala, cadeirasPorFila);

            if (posicaoAlternativa !== null) {
                const fila = Math.floor(posicaoAlternativa / cadeirasPorFila) + 1;
                const cadeira = (posicaoAlternativa % cadeirasPorFila) + 1;
                sala[posicaoAlternativa] = { ...aluno, fila, cadeira, salaProva };
                alocado = true;
                break;
            }
        }

        // Se não for possível alocar respeitando a regra, ignora restrição de proximidade como última solução
        if (!alocado) {
            for (let i = 0; i < quantidadeSalas; i++) {
                const sala = salasDistribuidas[i];
                const serie = salasSelecionadas[i][0].serie;
                const turma = salasSelecionadas[i][0].turma;
                const salaProva = `${serie}${turma}`;
                
                for (let j = 0; j < sala.length; j++) {
                    if (!sala[j]) {
                        const fila = Math.floor(j / cadeirasPorFila) + 1;
                        const cadeira = (j % cadeirasPorFila) + 1;
                        sala[j] = { ...aluno, fila, cadeira, salaProva };
                        alocado = true;
                        break;
                    }
                }
                if (alocado) break;
            }
        }
    }

    return salasDistribuidas;
}

module.exports = {distribuirAlunosEmSalas};