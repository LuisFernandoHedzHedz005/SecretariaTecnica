const express = require('express');
const router = express.Router();
const { verificarAutenticacion } = require('../controllers/administradorLoginController');
const editarProfesorController = require('../controllers/editarProfesorController');

// Ruta para mostrar el formulario de edición con los datos del profesor
router.get('/:id', verificarAutenticacion, editarProfesorController.mostrarFormulario);

// Ruta para procesar la actualización del profesor
router.post('/:id', verificarAutenticacion, editarProfesorController.actualizarProfesor);

module.exports = router;