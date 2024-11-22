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

        for (let index = 0; index < numeroAlunosPorSala[i]; index++) {
            if (indexAluno >= todosAlunos.length) break;
            const aluno = todosAlunos[indexAluno];

            // Tenta alocar o aluno em uma posição válida
            const posicaoValida = encontrarPosicaoValida(aluno, sala, cadeirasPorFila);
            if (posicaoValida !== null) {
                const fila = Math.floor(posicaoValida / cadeirasPorFila) + 1;
                const cadeira = (posicaoValida % cadeirasPorFila) + 1;
                sala[posicaoValida] = { ...aluno, fila, cadeira };
            } else {
                // Se não for possível, adiciona o aluno à lista de não alocados
                alunosNaoAlocados.push(aluno);
            }
            indexAluno++;
        }
    }

    // Realoca alunos não alocados, tentando novamente
    for (const aluno of alunosNaoAlocados) {
        let alocado = false;

        for (let i = 0; i < quantidadeSalas; i++) {
            const sala = salasDistribuidas[i];

            // Tenta encontrar outra posição válida
            const posicaoValida = encontrarPosicaoValida(aluno, sala, cadeirasPorFila);
            if (posicaoValida !== null) {
                const fila = Math.floor(posicaoValida / cadeirasPorFila) + 1;
                const cadeira = (posicaoValida % cadeirasPorFila) + 1;
                sala[posicaoValida] = { ...aluno, fila, cadeira };
                alocado = true;
                break;
            }
        }

        // Caso o aluno ainda não tenha sido alocado, ele será colocado na última cadeira disponível
        if (!alocado) {
            for (let i = 0; i < quantidadeSalas; i++) {
                const sala = salasDistribuidas[i];
                const ultimaCadeira = sala.findIndex(cadeira => cadeira === null);

                if (ultimaCadeira !== -1) {
                    const fila = Math.floor(ultimaCadeira / cadeirasPorFila) + 1;
                    const cadeira = (ultimaCadeira % cadeirasPorFila) + 1;
                    sala[ultimaCadeira] = { ...aluno, fila, cadeira };
                    break;
                }
            }
        }
    }

    return salasDistribuidas;
}

module.exports = {distribuirAlunosEmSalas};