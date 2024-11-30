						/*Configfurações Pré-estabelecidas do Banco de Dados*/
                        
/*Criação do banco de dados*/
CREATE DATABASE IF NOT exists sorteioAssentos;
/*Estabelecendo nome do usuário local e senha de acesso!*/
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Johnata123!';
/*Garantindo os privilégios de edições ao usuário*/
GRANT ALL PRIVILEGES ON teste.* TO 'root'@'localhost';
/*Atualizando privilégios*/
FLUSH PRIVILEGES;
/*Usando o banco de dados*/
USE sorteioAssentos;
								/*Conteúdo do Banco de Dados*/
CREATE TABLE  IF NOT exists alunos (
id INT AUTO_INCREMENT UNIQUE,
matricula VARCHAR(100) NOT NULL,
nome VARCHAR(100) NOT NULL,
ensino ENUM('medio','fundamental') NOT NULL,
serie VARCHAR(1) NOT NULL,
turma VARCHAR(1) NOT NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,         
    email VARCHAR(100) NOT NULL UNIQUE, 
    senha VARCHAR(255) NOT NULL       
);

/*Vendo a tabela salas*/
SELECT * FROM alunos;
SELECT * FROM usuarios;