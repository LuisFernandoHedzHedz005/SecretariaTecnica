const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
    res.render('sugerencias'); 
});

module.exports = router;