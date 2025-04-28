/*const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('visitantehome', {
        visitante: req.session.visitante
    });
});

module.exports = router;
*/

const express = require('express');
const router = express.Router();
const visitantehomeController = require('../controllers/visitantehomeController');

// Ruta para el dashboard principal
router.get('/', visitantehomeController.mostrarTabla);

// Ruta para buscar profesores
router.get('/buscar', visitantehomeController.buscarProfesores);

module.exports = router;