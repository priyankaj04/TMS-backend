const bcrypt = require('bcrypt');
const saltRounds = 10;

const getRandomColor = () => {
    const bg = ['#c2410c', '#3f6212', '#065f46', '#0c4a6e', '#1e3a8a', '#4c1d95', '#831843'];
    const getRandomColor = Math.floor(Math.random() * 7);
    return bg[getRandomColor];
}

module.exports = { getRandomColor }