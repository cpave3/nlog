'use strict';
const router = require('express').Router();

router.get('/', (req, res) => {
    res.send({ response: 'I am alive' }).status(200);
});

module.exports = router;