const express = require('express');
const router = express.Router();

// home ya el bueno ahora si
router.get('/', (req, res) => {
    res.render('administradorhome', {
        administrador: req.session.administrador
    });
});

module.exports = router;