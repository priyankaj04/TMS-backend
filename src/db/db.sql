CREATE DATABASE taskmanagement;

CREATE TABLE user(
    userid UUID NOT NULL,
    profilecolor VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    enabled BOOLEAN,
    created_at TIMESTAMP
);

-- CREATE TABLE list(
--     listid UUID NOT NULL,
--     listname VARCHAR(255) NOT NULL,
--     cards VARCHAR(255)
-- );

CREATE TABLE tasks(
    taskid UUID NOT NULL,
    listname VARCHAR(255) NOT NULL,
    taskname VARCHAR(255) NOT NULL,
    taskdescription TEXT,
    duedate TIMESTAMP,
    enabled BOOLEAN,
    created_at TIMESTAMP,
    assigned_user UUID NOT NULL REFERENCES user (userid),
    created_by UUID NOT NULL REFERENCES user (userid),
    tags VARCHAR(255),
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES user (userid)
);