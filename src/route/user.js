const express = require('express');
const userRoute = express.Router();
const dayjs = require('dayjs');
const { rateLimit } = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { supabase } = require('../db/supbase');
const { getRandomColor, getUUIDv7, getHashPassword, compareHashPassword } = require('../logic/func');
const { isValidEmail, isValidAlphabet, isValidPassword } = require('../middleware/utils');

const limiter = rateLimit({
	windowMs: 10 * 60 * 1000, // 10 minutes
	limit: 5, // Limit each IP to 5 requests per `window` (here, per 10 minutes).
	message: {status: 0, msg: 'Too many password tries from this IP, please try again after 10 minutes'},
    headers: true, // Send rate limit info in the headers
})

userRoute.post('/verify', limiter,  async (req, res) => {
    // * can only call this api for 5 times within 10 minutes
    // * request = {email, password}
    // * response = { status, message, token(if successful)}
    try {
        const { email, password } = req.body;

        if (!(email && password)) {
            return res.status(400).json({ status: 0, message: "email and password required." })
        }

        // * Validating email
        if (!isValidEmail(email)) {
            return res.status(400).json({ status: 0, message: "Invalid email id." })
        }

        // * get user details by emailid
        const { data: user, getError } = await supabase.from('user').select('email, password, userid').eq('email', email);

        // * if user doesnot exists then return back
        if (!user?.length || getError) {
            return res.status(400).json({ status: 0, message: "user emailid does not exists." })
        }

        console.log("verify_data", user)

        // * check for given password
        const checkPassword = await compareHashPassword(password, user[0].password)

        // * if password is correct then return with token else send error message
        if (checkPassword) {
            const accesstoken = jwt.sign(
                { email: email, userid: user[0].userid },
                process.env.TOKEN_KEY,
                { expiresIn: 180 }
            );
            return res.status(200).json({ status: 1, message: "Successfully verified user.", token: accesstoken })
        } else {
            return res.status(200).json({ status: 0, message: "Incorrect password." })
        }
    } catch (error) {
        console.log("verify_error", error)
        return res.status(500).json({ status: 0, message: "Failed to verify." });
    }
})

userRoute.post('/signup', async (req, res) => {
    // * request = {firstname, lastname, email, password}
    // * response = { status, message, token(if successful)}
    try {

        const { firstname, lastname, email, password } = req.body;

        if (!(email && password && firstname && lastname)) {
            return res.status(400).json({ status: 0, message: "firstname, lastname, email and password required." })
        }

        // * Validating email
        if (!isValidEmail(email)) {
            return res.status(400).json({ status: 0, message: "Invalid email id." })
        }

        // * Validating for only alphabets letters in names
        if (!(isValidAlphabet(firstname) && isValidAlphabet(lastname))) {
            return res.status(400).json({ status: 0, message: "Name should only contain letters." })
        }

        // * Validating for strong password (lowerCase-6-16, upperCase-min 1, number- min 1, special character- min 1)
        if (!isValidPassword(password)) {
            return res.status(400).json({ status: 0, message: "Required strong password." })
        }

        // * check if email already exists in our system, if already exists then return
        const { data: user, getError } = await supabase.from('user').select('email', email);

        if (user?.length > 0) {
            return res.status(400).json({ status: 0, message: "User email already exists in our system." });
        }

        // * hashing password
        const hashpassword = getHashPassword(password);

        // * getting random color for profile avatar color
        const getProfileColor = getRandomColor();

        const userid = getUUIDv7()

        const insertBody = {
            userid: userid,
            profilecolor: getProfileColor,
            email: email,
            firstname: firstname,
            lastname: lastname,
            password: hashpassword,
            created_at: dayjs().format(),
            enabled: true
        }

        console.log("signup_data", insertBody);

        // * inserting data into supbase user table
        const { data, error } = await supabase
            .from('user')
            .insert([insertBody])
            .select()

        if (error) {
            console.log("signup_error", error);
            return res.status(500).json({ status: 0, message: "Failed to insert data." });
        }

        const accesstoken = jwt.sign(
            { email: email, userid: insertBody.userid },
            process.env.TOKEN_KEY,
            { expiresIn: 180 }
        );

        return res.status(200).json({ status: 1, message: "Successfully Inserted.", token: accesstoken });

    } catch (error) {
        console.log("signup_error", error)
        return res.status(500).json({ status: 0, message: "Failed to signup." });
    }
})

userRoute.get('/:userid', async (req, res) => {
    return res.status(200).json({ status: 1, message: "Successfully built." })
})

userRoute.patch('/:userid', async (req, res) => {
    return res.status(200).json({ status: 1, message: "Successfully built." })
})

userRoute.delete('/:userid', async (req, res) => {
    return res.status(200).json({ status: 1, message: "Successfully built." })
})

module.exports = { userRoute }