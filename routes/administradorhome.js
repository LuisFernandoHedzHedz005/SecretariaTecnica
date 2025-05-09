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
const editarProfesor = require('../controllers/editarProfesorController');
const anadirVisitante = require('../controllers/anadirVisitanteController');
const subirCatalogo = require('../controllers/administradorhomeController');
const plantillaCatalogo = require('../controllers/administradorhomeController');
const eliminarTodosProfesores = require('../controllers/administradorhomeController');

// Ruta para el dashboard principal
router.get('/', administradorhomeController.mostrarTabla);;

// Ruta para descargar el Excel
router.get('/descargar-excel', administradorhomeController.descargarExcel);

// Ruta para buscar profesores
router.get('/buscar', administradorhomeController.buscarProfesores);

// Ruta para eliminar un profesor
router.delete('/eliminar/:id', administradorhomeController.eliminarProfesor);

// Ruta para editar un profesor
router.get('/editarProfesor/:id', editarProfesor.mostrarFormulario);
router.post('/editarProfesor/:id', editarProfesor.actualizarProfesor);

//Ruta para visitantes
router.delete('/eliminarVisitante/:id', administradorhomeController.eliminarVisitante);
router.get('/anadirVisitante', anadirVisitante.mostrarFormulario);
router.post('/anadirVisitante', anadirVisitante.guardarVisitante);

// Ruta para importar profesores desde un archivo Excel
router.get('/importarProfesores', subirCatalogo.mostrarFormularioImportacion);
router.post('/importarProfesores', subirCatalogo.importarProfesores);

// Ruta para descargar la plantilla de importación
router.get('/descargarPlantilla', plantillaCatalogo.descargarPlantilla);

//Ruta para eliminar todos los registros de la tabla
router.delete('/eliminarTodosProfesores', eliminarTodosProfesores.eliminarTodosProfesores);

module.exports = router;