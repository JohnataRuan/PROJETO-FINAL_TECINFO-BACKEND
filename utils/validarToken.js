const jwt = require('jsonwebtoken');

// Middleware de autenticação
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1]; // Para verificar o Bearer Token

    if (!token) {
        return res.status(401).send('Token não fornecido');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Erro de autenticação:', err);
            return res.status(403).send('Token inválido');
        }
        req.user = user;
        next();
    });
}

module.exports = {authenticateToken};