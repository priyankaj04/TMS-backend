const jwt = require('jsonwebtoken');

function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
}

const isValidEmail = (email) => {
  const emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email);
}

const isValidAlphabet = (alpha) => {
  if (!(alpha || alpha == ''))
    return false

  const alphabetRegex = /^[a-zA-Z]+$/;
  return alphabetRegex.test(alpha);
}

const isValidPassword = (password) => {
  if (!(password || password == ''))
    return false

  const passwordRgex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
  return passwordRgex.test(password);
}

const decodeToken = (authorization) => {
		const token = authorization && authorization.replace(/^Bearer\s+/, "");
		const decode = jwt.verify(token, process.env.TOKEN_KEY);
    return decode;
}

module.exports = { isValidUUID, isValidEmail, isValidAlphabet, isValidPassword, decodeToken }