const crypto = require('crypto');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// * create UUID v7 using crypto
// * used as userid and taskid
function getUUIDv7() {
    let prevTimestamp = -1;
    let seq = 0;

    // * Negative system clock adjustments are ignored to keep monotonicity
    const timestamp = Math.max(Date.now(), prevTimestamp);
    seq = timestamp === prevTimestamp ? seq + 1 : 0;
    prevTimestamp = timestamp;

    const var_rand = new Uint32Array(2);
    crypto.getRandomValues(var_rand);
    var_rand[0] = (VAR << (32 - VAR_BITS)) | (var_rand[0] >>> VAR_BITS);

    const digits =
        timestamp.toString(16).padStart(UNIX_TS_MS_BITS / 4, "0") +
        VER_DIGIT + var_rand[0].toString(16).slice(-3) +
        seq.toString(16).padStart(SEQ_BITS / 4, "0") +
        var_rand[0].toString(16).padStart((VAR_BITS + RAND_BITS) / 2 / 4, "0") +
        var_rand[1].toString(16).padStart((VAR_BITS + RAND_BITS) / 2 / 4, "0");

    return (
        digits.slice(0, 8) +
        "-" +
        digits.slice(8, 12) +
        "-" +
        digits.slice(12, 16) +
        "-" +
        digits.slice(16, 20) +
        "-" +
        digits.slice(20, 32)
    );
}


// * get random color
// * used in profile color in users table
const getRandomColor = () => {
    const bg = ['#c2410c', '#3f6212', '#065f46', '#0c4a6e', '#1e3a8a', '#4c1d95', '#831843'];
    const getRandomColor = Math.floor(Math.random() * 7);
    return bg[getRandomColor];
}


// * hash password and return hashed password
// * used in hashing password in user table
const getHashPassword = (password) => {
    return bcrypt.hash(password, saltRounds, function(err, hash) {
        return hash
    });    
}

module.exports = { getRandomColor, getUUIDv7, getHashPassword }