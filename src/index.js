const express = require('express');
const router = express.Router();

const { taskRoute } = require('./route/tasks');

router.use('/tasks', taskRoute);

module.exports ={ router }