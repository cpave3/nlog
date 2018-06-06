'use strict';
const router = require('express').Router();

router.get('/', (req, res) => {
    res.send({ response: 'I\'m doing science and i\'m still alive...' }).status(200);
});

module.exports = router;