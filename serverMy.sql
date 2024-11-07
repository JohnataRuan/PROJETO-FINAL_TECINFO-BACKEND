						/*Configfurações Pré-estabelecidas do Banco de Dados*/
                        
/*Criação do banco de dados*/
CREATE DATABASE IF NOT exists teste;
/*Estabelecendo nome do usuário local e senha de acesso!*/
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
/*Garantindo os privilégios de edições ao usuário*/
GRANT ALL PRIVILEGES ON teste.* TO 'root'@'localhost';
/*Atualizando privilégios*/
FLUSH PRIVILEGES;
/*Usando o banco de dados*/
USE teste;
								/*Conteúdo do Banco de Dados*/
CREATE TABLE alunos (
id INT AUTO_INCREMENT UNIQUE,
matricula VARCHAR(100) NOT NULL,
nome VARCHAR(100) NOT NULL,
ensino ENUM('medio','fundamental') NOT NULL,
serie VARCHAR(1) NOT NULL,
turma VARCHAR(1) NOT NULL
);
/*Vendo a tabela salas*/
SELECT * FROM alunos;