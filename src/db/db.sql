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

CREATE TABLE list(
    listid UUID NOT NULL,
    listname VARCHAR(255) NOT NULL,
    cards VARCHAR(255)
);

CREATE TABLE tasks(
    taskid UUID NOT NULL,
    listid UUID NOT NULL REFERENCES list (listid),
    users VARCHAR(255),
    taskname VARCHAR(255) NOT NULL,
    taskdescription TEXT,
    duedate TIMESTAMP,
    enabled BOOLEAN,
    created_at TIMESTAMP,
    created_by UUID NOT NULL REFERENCES user (userid),
    tags VARCHAR(255),
    deleted_at TIMESTAMP,
    deleted_by UUID NOT NULL REFERENCES user (userid)
);