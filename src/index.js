const express = require('express');
const router = express.Router();

const { taskRoute } = require('./route/tasks');
const { userRoute } = require('./route/user');

router.use('/tasks', taskRoute);
router.use('/user', userRoute);

module.exports ={ router }