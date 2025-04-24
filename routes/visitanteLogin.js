const express = require('express');
const router = express.Router();
const { 
    mostrarFormularioLogin, 
    procesarLogin, 
    cerrarSesion 
} = require('../controllers/visitanteLoginController');

// login
router.get('/', mostrarFormularioLogin);
router.post('/', procesarLogin);
router.get('/logout', cerrarSesion);

module.exports = router;