const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const axios = require('axios');

const request = require('request');
const config = require('config');
const {
    check,
    validationResult
} = require('express-validator');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const {
    restart
} = require('nodemon');


//@route  GET api/profiles/me
//@desc   Get current users profile
//@access private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        }).populate('user', ['name', 'avatar']);

        if (!profile) {
            return res.status(400).json({
                msg: 'There is no profile for this user'
            });

        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error')
    }
});

//@route  Post api/profile
//@desc   Creat or update user profile
//@access private 
router.post('/', [auth, [
        check('status', 'Status is required')
        .not()
        .isEmpty(),
        check('skills', 'skills is required')
        .not()
        .isEmpty()
    ]], async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }
        const {
            company,
            location,
            website,
            bio,
            skills,
            status,
            githubusername,
            youtube,
            twitter,
            instagram,
            linkedin,
            facebook
        } = req.body;

        //Build prof object

        const profileFields = {};
        profileFields.user = req.user.id;
        if (company) profileFields.company = company;
        if (website) profileFields.website = website;
        if (location) profileFields.location = location;
        if (bio) profileFields.bio = bio;
        if (githubusername) profileFields.githubusername = githubusername;
        if (status) profileFields.status = status;
        if (skills) {
            profileFields.skills = skills.split(',').map(skill => skill.trim());
        }
        // build social object
        profileFields.social = {};
        if (youtube) profileFields.social.youtube = youtube;
        if (twitter) profileFields.social.twitter = twitter;
        if (facebook) profileFields.social.facebook = facebook;
        if (linkedin) profileFields.social.linkedin = linkedin;
        if (instagram) profileFields.social.instagram = instagram;

        try {
            let profile = await Profile.findOne({
                user: req.user.id
            })

            if (profile) {
                //update
                profile = await Profile.findOneAndUpdate({
                    user: req.user.id
                }, {
                    $set: profileFields
                }, {
                    new: true
                });
                return res.json(profile);
            }
            //create
            profile = new Profile(profileFields);

            await profile.save();
            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('server error');
        }

    }


);

//@route  GET api/profiles
//@desc   Get all profiles
//@access Public

router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error')
    }
});

//@route  GET api/profiles/user/:user_id
//@desc   Get profile by user ID
//@access Public

router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({
                user: req.params.user_id
            })
            .populate('user', ['name', 'avatar']);
        if (!profile) return res.status(400).json({
            msg: 'Profile not found'
        });
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if (err.kind == 'ObjectId') {
            return res.status(400).json({
                msg: 'Profile not found'
            });
        }
        res.status(500).send('server error')
    }
});

//@route  Delete api/profile
//@desc   Delete profile/user and posts
//@access Private

router.delete('/', auth, async (req, res) => {
    try {
        //@todo - remove users posts

        //remove profile
        await Profile.findOneAndRemove({
            user: req.user.id
        });

        //remove user
        await User.findOneAndRemove({
            _id: req.user.id
        });

        res.json({
            msg: 'User deleted'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error')
    }
});

//@route  PUT api/profile/experience
//@desc   add profile exprience
//@access Private

router.put('/experience', [auth, [
    check('title', 'Title is required')
    .not()
    .isEmpty(),
    check('company', 'Company is required')
    .not()
    .isEmpty(),
    check('from', 'from date is required')
    .not()
    .isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }
    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        });

        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});

//@route  DELETE api/profile/experience/:exp_id
//@desc   Delete profile exprience
//@access Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        });

        //Get the remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});



//@route  PUT api/profile/education
//@desc   add profile education
//@access Private

router.put('/education', [auth, [
    check('school', 'school is required')
    .not()
    .isEmpty(),
    check('degree', 'degree is required')
    .not()
    .isEmpty(),
    check('from', 'from date is required')
    .not()
    .isEmpty(),
    check('fieldofstudy', 'fieldofstudy date is required')
    .not()
    .isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }
    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body;

    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        });

        profile.education.unshift(newEdu);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});

//@route  DELETE api/profile/education/:edu_id
//@desc   Delete profile education
//@access Private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        });

        //Get the remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
        profile.education.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route  Fet api/profile/github/:username
//@desc   Get user repos from github
//@access Public

router.get('/github/:username', async (req, res) => {
    try {
        const uri = encodeURI(
            `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
        );
        const headers = {
            'user-agent': 'node.js',
            Authorization: `token ${config.get('githubToken')}`
        };

        const gitHubResponse = await axios.get(uri, {
            headers
        });
        return res.json(gitHubResponse.data);
    } catch (err) {
        console.error(err.message);
        return res.status(404).json({
            msg: 'No Github profile found'
        });
    }
});


module.exports = router;