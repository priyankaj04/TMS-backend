const isValidEmail = (email) => {
    const emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(email);
}

const isValidAlphabet = (alpha) => {
    if(!(alpha || alpha == ''))
      return false
  
    const alphabetRegex = /^[a-zA-Z]+$/;
      return alphabetRegex.test(alpha);
}

const isValidPassword = (password) => {
    if(!(password || password == ''))
      return false
  
    const passwordRgex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
      return passwordRgex.test(password);
}

module.exports = { isValidEmail, isValidAlphabet, isValidPassword }