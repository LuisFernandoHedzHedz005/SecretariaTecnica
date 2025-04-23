const express = require('express');
const router = express.Router();
const { 
    mostrarFormularioLogin, 
    procesarLogin, 
    cerrarSesion 
} = require('../controllers/administradorLoginController');

// login
router.get('/', mostrarFormularioLogin);
router.post('/', procesarLogin);

//cerrar sesión, no funciona, checar en controller ;c
//ya funciona :D
router.get('/logout', cerrarSesion);

module.exports = router;