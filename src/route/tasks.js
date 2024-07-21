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

taskRoute.get('/search/query', async (req, res) => {
    // * request query = term, duedate, tags, assignedto, createdby
    // * response = { status, message, data(if successfull) }
    try {
        const { duedate, tags, assignedto, createdby, term } = req.query;

        let query = supabase
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
            .eq('enabled', true);

        if (term) {
            query.textSearch('taskname', term, { type: 'websearch', config: "english" })
        }

        if (duedate) {
            query.ilike('duedate', '%' + dayjs(duedate).format('DD-MM-YYYY') + '%');
        }

        if (assignedto) {
            query.eq('assigned_user', assignedto);
        }

        if (createdby) {
            query.eq('created_by', createdby);
        }

        if (tags) {
            query.containedBy('tags', tags.split(','));
        }

        const { data: tasks, error } = await query;

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

taskRoute.patch('/assign/:taskid/:userid', async (req, res) => {
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

taskRoute.put('/:taskid', async (req, res) => {
    // * request = {taskname, taskdescption, duedate, tags, listname, assigned_user }
    // * response = { status, message }
    try {

        const { taskname, taskdescption, duedate, tags, listname, assigned_user } = req.body;
        const taskid = req.params.taskid

        const decode = decodeToken(req.headers.authorization);

        if (!isValidUUID(taskid)) {
            return res.status(400).json({ status: 0, message: "Invalid taskid." })
        }

        // * check if user already exists in our system, if does not exists then return
        const { data: user, getError } = await supabase.from('user').select('userid', decode.userid).eq('enabled', true);

        if (!user?.length) {
            return res.status(403).json({ status: 0, message: "Unauthorized user." });
        }

        let updatebody = {};

        if (taskname) {
            updatebody.taskname = taskname
        }

        if (taskdescption) {
            updatebody.taskdescption = taskdescption
        }

        if (duedate) {
            updatebody.duedate = dayjs(duedate).format('DD-MM-YYYY hh:mm a')
        }

        if (listname) {
            updatebody.listname = listname
        }

        if (assigned_user) {
            if (!isValidUUID(assigned_user)) {
                return res.status(400).json({ status: 0, message: "Invalid assigned userid." });
            }

            const { data: assigneduser, getError } = await supabase.from('user').select('userid', assigned_user).eq('enabled', true);

            if (!assigneduser.length) {
                return res.status(500).json({ status: 0, message: "Assigned user data does not exists." });
            }

            updatebody.assigned_user = assigned_user
        }

        if (tags) {
            if (Array.isArray(tags)) {
                insertBody.tags = tags
            } else {
                insertBody.tags = [tags]
            }
        }

        if (Object.keys(updatebody)?.length > 0) {
            const { data, error } = await supabase
                .from('user')
                .update(updatebody)
                .eq('taskid', taskid)
                .select()

            if (error) {
                console.log('puttask_error', error)
                return res.status(500).json({ status: 0, message: "Failed to update." })
            }
            return res.status(200).json({ status: 1, message: "Successfully updated." })
        }
        return res.status(200).json({ status: 0, message: "Empty request not updated." })
    } catch (error) {
        console.log("puttask_error", error)
        return res.status(500).json({ status: 0, message: "Failed to update task details." });
    }
})

taskRoute.delete('/:taskid', async (req, res) => {
    // * request params = taskid
    // * response = { status, message }
    try {

        const taskid = req.params.taskid
        const decode = decodeToken(req.headers.authorization);

        if (!isValidUUID(taskid)) {
            return res.status(400).json({ status: 0, message: "Invalid taskid." })
        }

        // * check if user already exists in our system, if does not exists then return
        const { data: user, getError } = await supabase.from('user').select('userid', decode.userid).eq('enabled', true);

        if (!user?.length) {
            return res.status(403).json({ status: 0, message: "Unauthorized user." });
        }

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('tasks', taskid)
            .eq('enabled', true);

        if (error) {
            console.log('deletetask_error', error)
            return res.status(500).json({ status: 0, message: "Failed to deleted task." })
        }

        return res.status(200).json({ status: 1, message: "Successfully deleted task." })

    } catch (error) {
        console.log("deletetask_error", error)
        return res.status(500).json({ status: 0, message: "Failed to delete task." });
    }
})

module.exports = { taskRoute }