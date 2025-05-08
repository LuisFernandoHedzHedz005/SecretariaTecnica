const express = require('express');
const router = express.Router();
const graficasController = require('../controllers/graficasController');

router.get('/', graficasController.mostrarGraficas);;

module.exports = router;