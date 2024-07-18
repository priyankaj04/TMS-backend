const express = require('express');
const taskRoute = express.Router();

taskRoute.get('/', async(req,res) => {
    return res.status(200).json({status: 1, message:"Successfully built."})
})

module.exports ={ taskRoute }