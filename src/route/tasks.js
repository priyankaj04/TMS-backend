const express = require('express');
const taskRoute = express.Router();
const dayjs = require('dayjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../db/supbase');
const { getRandomColor, getUUIDv7, getHashPassword, compareHashPassword } = require('../logic/func');
const { isValidAlphabet, isValidUUID, decodeToken } = require('../middleware/utils');
const { limiter, VerifyToken } = require('../middleware/middleware');


taskRoute.use(VerifyToken);

taskRoute.post('/create', async (req, res) => {
    // * request = { listname, created_by, users, taskname, taskdescription, duedate, tags }
    // * response = { status, message }
    try {

        const { listname, taskname, taskdescription, duedate, tags, assigned_user } = req.body;
        const decode = decodeToken(req.headers.authorization);

        if (!(listname && taskname)) {
            return res.status(400).json({ status: 0, message: "listname and taskname required." })
        }

        // * Validating listname
        if (!isValidAlphabet(listname)) {
            return res.status(400).json({ status: 0, message: "Invalid listname." })
        }

        if (assigned_user) {
            if (!isValidUUID(assigned_user)) {
                return res.status(400).json({ status: 0, message: "Invalid assigned user." })
            }

            // * check if assigned user already exists in our system, if does not exists then return
            const { data: assigneduser, usererror } = await supabase.from('user').select('userid', assigned_user).eq('enabled', true);

            if (!assigneduser?.length) {
                return res.status(403).json({ status: 0, message: "Assigned user does not exists." });
            }
        }


        // * check if user already exists in our system, if does not exists then return
        const { data: user, getError } = await supabase.from('user').select('userid', decode.userid).eq('enabled', true);

        if (!user?.length) {
            return res.status(403).json({ status: 0, message: "Unauthorized user." });
        }

        const taskid = getUUIDv7()

        let insertBody = {
            taskid: taskid,
            listname: listname,
            taskname: taskname,
            assigned_user: assigned_user ? assigned_user : decode.userid,
            created_by: decode.userid,
            created_at: dayjs().format(),
            enabled: true
        }

        if (taskdescription) {
            insertBody.taskdescription = taskdescription
        }

        if (duedate) {
            insertBody.duedate = dayjs(duedate).format('DD-MM-YYYY hh:mm a')
        }

        if (tags) {
            if (Array.isArray(tags)) {
                insertBody.tags = tags
            } else {
                insertBody.tags = [tags]
            }
        }

        console.log("tasks_creation_data", insertBody);

        // * inserting data into supbase tasks table
        const { data, error } = await supabase
            .from('tasks')
            .insert([insertBody])
            .select()

        if (error) {
            console.log("tasks_creation_error", error);
            return res.status(500).json({ status: 0, message: "Failed to insert data." });
        }

        return res.status(200).json({ status: 1, message: "Successfully Inserted." });
    } catch (error) {
        console.log("tasks_creation_error", error)
        return res.status(500).json({ status: 0, message: "Failed to create task." });
    }
})

taskRoute.get('/:taskid', async (req, res) => {
    // * request param = taskid
    // * response = { status, message, data(if successfull) }
    try {
        const taskid = req.params.taskid

        if (!isValidUUID(taskid)) {
            return res.status(400).json({ status: 0, message: "Invalid taskid." })
        }

        const { data: tasks, error } = await supabase
            .from('tasks')
            .select(`
                listname,
                taskname,
                taskdescription,
                duedate,
                created_at,
                tags,
                assigned_user: user!inner(
                    firstname,
                    lastname,
                    email,
                    profilecolor
                ),
                created_by: user!inner(
                    firstname,
                    lastname,
                    email,
                    profilecolor
                )
                `)
            .eq('taskid', taskid)
            .eq('enabled', true)

        if (error) {
            console.log("gettask_error", error)
            return res.status(500).json({ status: 0, message: "Failed to get record." })
        }

        if (tasks?.length > 0)
            return res.status(200).json({ status: 1, message: "Successful.", data: tasks })
        else
            return res.status(200).json({ status: 0, message: "No record exists." })
    } catch (error) {
        console.log("gettask_error", error)
        return res.status(500).json({ status: 0, message: "Failed to task details." });
    }
})

taskRoute.get('/search/:term', async (req, res) => {
    return res.status(200).json({ status: 1, message: "Successfully built." })
})

taskRoute.patch('/', async (req, res) => {
    return res.status(200).json({ status: 1, message: "Successfully built." })
})

taskRoute.put('/', async (req, res) => {
    return res.status(200).json({ status: 1, message: "Successfully built." })
})

taskRoute.delete('/', async (req, res) => {
    return res.status(200).json({ status: 1, message: "Successfully built." })
})

module.exports = { taskRoute }