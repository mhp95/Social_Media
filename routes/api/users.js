const express = require('express');
const router = express.Router();

//@route  GET api/user
//@desc   Test Route
//@access Puble
router.get('/', (req, res) => res.send('user route'));
module.exports = router;