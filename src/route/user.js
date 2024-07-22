const express = require('express');
const userRoute = express.Router();
const dayjs = require('dayjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../db/supbase');
const { getRandomColor, getUUIDv7, getHashPassword, compareHashPassword } = require('../logic/func');
const { isValidEmail, isValidAlphabet, isValidPassword, isValidUUID, decodeToken } = require('../middleware/utils');
const { limiter, VerifyToken } = require('../middleware/middleware');

userRoute.post('/verify', limiter, async (req, res) => {
    // * can only call this api for 5 times within 10 minutes
    // * request = {email, password}
    // * response = { status, message, token(if successful), data (if successful)}
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
        const { data: user, getError } = await supabase.from('user').select('email, password, userid, profilecolor, firstname, lastname').eq('email', email).eq('enabled', true);

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
                { email: email, userid: user[0].userid, type: "member" },
                process.env.TOKEN_KEY,
                { algorithm: 'HS256', expiresIn: 60 * 60 * 120 }
            );
            return res.status(200).json({ status: 1, message: "Successfully verified user.", token: accesstoken, data: user })
        } else {
            return res.status(200).json({ status: 0, message: "Incorrect password." })
        }
    } catch (error) {
        console.log("verify_error", error)
        return res.status(500).json({ status: 0, message: "Failed to verify." });
    }
})

userRoute.post('/oauth/verify', limiter, async (req, res) => {
    // * can only call this api for 5 times within 10 minutes
    // * request = {credential}
    // * response = { status, message, token(if successful), data (if successful)}
    try {
        const { credential } = req.body;

        const url = "https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=" + credential;
        const publicKeyResponse = await fetch(url).then((res) => res.json());

        const { aud, iss, iat, exp, email } = publicKeyResponse;
        if (!email)
            return res.status(418).json({ status: 0, msg: "not verified" })

        // * get user details by emailid
        const { data: user, getError } = await supabase.from('user').select('email, password, userid, profilecolor, firstname, lastname').eq('email', email).eq('enabled', true);

        // * if user doesnot exists then return back
        if (!user?.length || getError) {
            return res.status(400).json({ status: 0, message: "user emailid does not exists." })
        }

        const accesstoken = jwt.sign(
            { email: email, userid: user[0].userid, type: "member" },
            process.env.TOKEN_KEY,
            { algorithm: 'HS256', expiresIn: 60 * 60 * 120 }
        );
        return res.status(200).json({ status: 1, message: "Successfully verified user.", token: accesstoken, data: user })

    } catch (error) {
        console.log("verify_error", error)
        return res.status(500).json({ status: 0, message: "Failed to verify." });
    }
})

userRoute.post('/signup', async (req, res) => {
    // * request = {firstname, lastname, email, password}
    // * response = { status, message, token(if successful), data(if successful)}
    try {

        const { firstname, lastname, email, password } = req.body;

        if (!(email && password && firstname)) {
            return res.status(400).json({ status: 0, message: "firstname, email and password required." })
        }

        // * Validating email
        if (!isValidEmail(email)) {
            return res.status(400).json({ status: 0, message: "Invalid email id." })
        }

        // * Validating for only alphabets letters in names
        if (!(isValidAlphabet(firstname))) {
            return res.status(400).json({ status: 0, message: "Name should only contain letters." })
        }

        // * Validating for strong password (lowerCase-6-16, upperCase-min 1, number- min 1, special character- min 1)
        if (!isValidPassword(password)) {
            return res.status(400).json({ status: 0, message: "Required strong password." })
        }

        // * check if email already exists in our system, if already exists then return
        const { data: user, getError } = await supabase.from('user').select('email').eq('enabled', true).eq('email', email);

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
            lastname: lastname ?? '',
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
            { email: email, userid: insertBody.userid, type: "member" },
            process.env.TOKEN_KEY,
            { algorithm: 'HS256', expiresIn: 60 * 60 * 120 }
        );

        return res.status(200).json({ status: 1, message: "Successfully Inserted.", token: accesstoken, data: data });

    } catch (error) {
        console.log("signup_error", error)
        return res.status(500).json({ status: 0, message: "Failed to signup." });
    }
})

userRoute.get('/:userid', VerifyToken, async (req, res) => {
    // * request param = userid
    // * response = { status, message, data(if successfull) }
    try {
        const userid = req.params.userid

        if (!isValidUUID(userid)) {
            return res.status(400).json({ status: 0, message: "Invalid userid." })
        }

        const { data: user, getError } = await supabase.from('user')
            .select('email, profilecolor, firstname, lastname')
            .eq('userid', userid)
            .eq('enabled', true);

        if (getError) {
            console.log("getuser_error", getError)
            return res.status(500).json({ status: 0, message: "Failed to get record." })
        }

        if (user?.length > 0)
            return res.status(200).json({ status: 1, message: "Successful.", data: user })
        else
            return res.status(200).json({ status: 0, message: "No record exists." })
    } catch (error) {
        console.log("getuser_error", error)
        return res.status(500).json({ status: 0, message: "Failed to userdetails." });
    }
})

userRoute.get('/get/all', VerifyToken, async (req, res) => {
    // * request param = 
    // * response = { status, message, data(if successfull) }
    try {

        const { data: user, getError } = await supabase.from('user')
            .select('userid, email, profilecolor, firstname, lastname')
            .eq('enabled', true);

        if (getError) {
            console.log("getuser_error", getError)
            return res.status(500).json({ status: 0, message: "Failed to get record." })
        }

        if (user?.length > 0)
            return res.status(200).json({ status: 1, message: "Successful.", data: user })
        else
            return res.status(200).json({ status: 0, message: "No active users exists." })
    } catch (error) {
        console.log("getuser_error", error)
        return res.status(500).json({ status: 0, message: "Failed to userdetails." });
    }
})

userRoute.put('/:userid', VerifyToken, async (req, res) => {
    // * request = {firstname, lastname, profilecolor }
    // * response = { status, message }
    try {

        const { firstname, lastname, profilecolor } = req.body;
        const userid = req.params.userid

        const decode = decodeToken(req.headers.authorization);

        if (!isValidUUID(userid)) {
            return res.status(400).json({ status: 0, message: "Invalid userid." })
        }

        // * check if token user and given user is same, if not then user is not authorized.
        if (userid !== decode.userid) {
            return res.status(403).json({ status: 0, message: "User is not authorized." })
        }

        if (firstname && !(isValidAlphabet(firstname))) {
            return res.status(400).json({ status: 0, message: "Firstname should only contain letters." })
        }

        if (lastname && !(isValidAlphabet(lastname))) {
            return res.status(400).json({ status: 0, message: "Lastname should only contain letters." })
        }

        let updatebody = {};

        if (firstname) {
            updatebody.firstname = firstname
        }

        if (lastname) {
            updatebody.lastname = lastname
        }

        if (profilecolor) {
            updatebody.profilecolor = profilecolor
        }

        if (Object.keys(updatebody)?.length > 0) {
            const { data, error } = await supabase
                .from('user')
                .update(updatebody)
                .eq('userid', userid)
                .select()

            if (error) {
                console.log('patchuser_error', error)
                return res.status(500).json({ status: 0, message: "Failed to update." })
            }
            return res.status(200).json({ status: 1, message: "Successfully updated." })
        }
        return res.status(200).json({ status: 0, message: "Empty request not updated." })
    } catch (error) {
        console.log("patchuser_error", error)
        return res.status(500).json({ status: 0, message: "Failed to update userdetails." });
    }
})

userRoute.patch('/password/:userid', VerifyToken, async (req, res) => {
    // * request = { newpassword, oldpassword }
    // * response = { status, message }
    try {

        const { newpassword, oldpassword } = req.body;
        const userid = req.params.userid

        const decode = decodeToken(req.headers.authorization);

        if (!isValidUUID(userid)) {
            return res.status(400).json({ status: 0, message: "Invalid userid." })
        }

        // * check if token user and given user is same, if not then user is not authorized.
        if (userid !== decode.userid) {
            return res.status(403).json({ status: 0, message: "User is not authorized." })
        }

        if (!isValidPassword(newpassword)) {
            return res.status(400).json({ status: 0, message: "New password is not strong password." })
        }

        // * get user details by userid
        const { data: user, getError } = await supabase.from('user')
            .select('email, password')
            .eq('userid', userid)
            .eq('enabled', true);

        // * user doesnt not exists or failed to fetch then return
        if (!user?.length || getError) {
            return res.status(400).json({ status: 0, message: "Record does not exists." })
        }

        const checkPassword = await compareHashPassword(oldpassword, user[0].password)

        // * if password is incorrect then return
        if (!checkPassword) {
            return res.status(400).json({ status: 0, message: "Given password is incorrect." })
        }

        let newhashedpassword = getHashPassword(newpassword);

        const { data, error } = await supabase
            .from('user')
            .update({ password: newhashedpassword })
            .eq('userid', userid)
            .select();

        if (error) {
            console.log("changepassword_error", error)
            return res.status(500).json({ status: 0, message: "Failed to update new password." })
        }

        return res.status(200).json({ status: 1, message: "Successfully updated new password." })
    } catch (error) {
        console.log("changepassword_error", error)
        return res.status(500).json({ status: 0, message: "Failed to update user password." });
    }
})

userRoute.delete('/:userid', VerifyToken, async (req, res) => {
    // * request params = userid
    // * response = { status, message }
    try {

        const userid = req.params.userid

        const decode = decodeToken(req.headers.authorization);

        if (!isValidUUID(userid)) {
            return res.status(400).json({ status: 0, message: "Invalid userid." })
        }

        // * check if token user and given user is same, if not then user is not authorized.
        if (userid !== decode.userid) {
            return res.status(403).json({ status: 0, message: "User is not authorized." })
        }

        const { error } = await supabase
            .from('user')
            .delete()
            .eq('userid', userid)
            .eq('enabled', true);

        if (error) {
            console.log('deleteuser_error', error)
            return res.status(500).json({ status: 0, message: "Failed to deleted user." })
        }

        return res.status(200).json({ status: 1, message: "Successfully deleted user." })

    } catch (error) {
        console.log("deleteuser_error", error)
        return res.status(500).json({ status: 0, message: "Failed to delete user." });
    }
})

module.exports = { userRoute }