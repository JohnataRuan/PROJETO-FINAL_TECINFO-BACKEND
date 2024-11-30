// queries.js
const queryInsertAlunos = 'INSERT INTO alunos (matricula, nome, ensino, serie, turma) VALUES (?, ?, ?, ?, ?)';
const querySelectAlunosSerieTurma = 'SELECT * FROM alunos WHERE serie = ? AND turma = ?';
const querySelectAlunos = 'SELECT * FROM alunos';
const queryDeleteAlunos = 'TRUNCATE TABLE alunos';
const querySelectSalas = 'SELECT ensino, serie, turma FROM alunos GROUP BY ensino, serie, turma';
const querySelectEmail = 'SELECT * FROM usuarios WHERE email = ?';
const queryInsertCadastro = 'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)';

module.exports = { 
  queryInsertAlunos,
  querySelectAlunosSerieTurma,
  querySelectAlunos,
  queryDeleteAlunos,
  querySelectSalas,
  querySelectEmail,
  queryInsertCadastro 
};
