const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('visitantehome', {
        visitante: req.session.visitante
    });
});

module.exports = router;