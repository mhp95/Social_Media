const express = require('express');
const router = express.Router();
const auth = require("../../middleware/auth.js");
const User = require('../../models/User');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const config = require("config");
const {
    check
} = require('express-validator');
const {
    validationResult
} = require('express-validator');
//@route  GET api/auth
//@desc   Test Route
//@access Puble

router.get('/',
    auth,
    async (req, res) => {
        try {
            const user = await User.findById(req.user.id).select('-password');
            res.json(user)
        } catch (err) {
            console.error(err.message);
            res.status(500).send('server Error');
        }
    });
//@route  Post api/auth
//@desc   authenticate User and get token
//@access Public

router.post('/',
    [
        check('email', 'Please include a valid email')
        .isEmail(),
        check('password', 'password is required')
        .exists()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }
        const {
            email,
            password
        } = req.body;

        try {
            let user = await User.findOne({
                email
            });

            if (!user) {
                return res
                    .status(400).json({
                        errors: [{
                            msg: "invalid credentials"
                        }]
                    });
            }

            const isMatch = await bcrypt
                .compare(password, user.password);

            if (!isMatch) {
                return res
                    .status(400).json({
                        errors: [{
                            msg: "invalid credentials"
                        }]
                    });
            }
            const payload = {
                user: {
                    id: user.id
                }
            }

            jwt.sign(payload,
                config.get('jwtSecret'), {
                    expiresIn: 360000
                },
                (err, token) => {
                    if (err) throw err;
                    res.json({
                        token
                    });
                });

        } catch (error) {
            console.error(error.message);
            res.status(500).send("Server error");
        }



    });

module.exports = router;