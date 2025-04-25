/*const express = require('express');
const router = express.Router();

// home ya el bueno ahora si
router.get('/', (req, res) => {
    res.render('administradorhome', {
        administrador: req.session.administrador
    });
});

module.exports = router;
*/

const express = require('express');
const router = express.Router();
const administradorhomeController = require('../controllers/administradorhomeController');

// Ruta para el dashboard principal
router.get('/', administradorhomeController.mostrarDashboard);

// Ruta para descargar el Excel
router.get('/descargar-excel', administradorhomeController.descargarExcel);

// Ruta para buscar profesores
router.get('/buscar', administradorhomeController.buscarProfesores);

module.exports = router;