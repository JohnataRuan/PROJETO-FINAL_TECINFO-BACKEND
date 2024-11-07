// config/multer.js
const multer = require('multer');
const memoryStorage = multer.memoryStorage(); // Armazenar na memória

module.exports = multer({
    storage: memoryStorage,
    limits: {
        fileSize: 2 * 1024 * 1024, // Limite de tamanho do arquivo
    },
    fileFilter: (req, file, callback) => {
        const allowedMimes = ['text/csv'];

        if (allowedMimes.includes(file.mimetype)) {
            callback(null, true);
        } else {
            callback(new Error('Tipo de Arquivo inválido!'));
        }
    }
});
