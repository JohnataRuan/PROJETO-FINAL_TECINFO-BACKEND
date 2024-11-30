const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(bodyParser.json());

// Importar rotas

const authRoutes = require('./routes/authRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const sortRoutes = require('./routes/sortRoutes');
const studentRoutes = require('./routes/studentRoutes');

app.use('/auth', authRoutes);      
app.use('/pdf', pdfRoutes);         
app.use('/upload', uploadRoutes);    
app.use('/sort', sortRoutes);        
app.use('/student', studentRoutes);  


// Inicializar o servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});