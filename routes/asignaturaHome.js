/*const express = require('express');
const router = express.Router();
const asignaturaHomeController = require('../controllers/asignaturaHomeController');

router.get('/', asignaturaHomeController.mostrarTabla);;

module.exports = router;
*/
const express = require('express');
const router = express.Router();
const asignaturaHomeController = require('../controllers/asignaturaHomeController');
const { verificarAutenticacion } = require('../controllers/administradorLoginController');

// Ruta principal para mostrar la tabla de asignaturas
router.get('/', verificarAutenticacion ,asignaturaHomeController.mostrarTabla);

// Ruta para añadir una nueva asignatura
router.post('/anadir', verificarAutenticacion ,asignaturaHomeController.anadirAsignatura);

// Ruta para eliminar una asignatura
router.delete('/eliminar/:id', verificarAutenticacion ,asignaturaHomeController.eliminarAsignatura);

module.exports = router;