const express = require('express');
const router = express.Router();
const {
    check
} = require('express-validator');
const {
    validationResult
} = require('express-validator');


//@route  Post api/user
//@desc   Register User
//@access Public

router.post('/',
    [
        check('name', 'Name is required')
        .not().
        isEmpty(),
        check('email', 'Please include a valid email')
        .isEmail(),
        check('password', 'please enter a password')
        .isLength({
            min: 6
        })
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }
        res.send('user route');
    });

module.exports = router;