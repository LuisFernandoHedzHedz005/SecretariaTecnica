const express = require('express');
const router = express.Router();
const { verificarAutenticacion } = require('../controllers/administradorLoginController');
const anadirProfesorController = require('../controllers/anadirProfesorController');

// Mostrar formulario para añadir profesor
router.get('/', verificarAutenticacion, anadirProfesorController.mostrarFormulario);

// Procesar el formulario para añadir profesor
router.post('/', verificarAutenticacion, anadirProfesorController.agregarProfesor);

module.exports = router;