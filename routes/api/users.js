const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const config = require("config");
const {
    check
} = require('express-validator');
const {
    validationResult
} = require('express-validator');

const User = require("../../models/User");
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
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }
        const {
            name,
            email,
            password
        } = req.body;

        try {
            let user = await User.findOne({
                email
            });

            if (user) {
                return res.status(400).json({
                    errors: [{
                        msg: "user already exisy"
                    }]
                });
            }
            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm'
            })

            user = new User({
                name,
                email,
                avatar,
                password
            });

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();
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