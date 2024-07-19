const express = require('express');
const userRoute = express.Router();
const supabase = require('../db/supbase');
const { getRandomColor } = require('../logic/user');

userRoute.post('/verifyotp', async (req, res) => {
    try{

        const {email, password} = req.body;

        if(!(email && password)){
            return res.status(400).json({ status: 0, message: "email and password required." })
        }

        bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
            console.log("hash", hash)
        });
    } catch (error){

    }
})

userRoute.post('/signup', async (req, res) => {
    try{

        const {firstname, lastname, email, password} = req.body;

        if(!(email && password && firstname && lastname)){
            return res.status(400).json({ status: 0, message: "firstname, lastname, email and password required." })
        }

        const getProfileColor = getRandomColor();

        
        

    } catch (error){

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