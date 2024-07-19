const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

require('dotenv').config();

const { router } = require('./src/index');

const PORT = 8000;
const HOST = '0.0.0.0';
const app = express();

// Security middleware
app.use(helmet());

// Logging middleware
app.use(morgan('combined'));

// Enable CORS
app.use(cors());
app.options('*', cors());

// Body parser middleware
app.use(bodyParser.json({ limit: '10mb', extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

// Disable 'x-powered-by' header for security
app.disable('x-powered-by');

// Routes
app.use('/api', router);

// Root route
app.get('/', async (req, res) => {
    res.status(200).json('8000 port is running ' + new Date());
});

// Handle 404 errors
app.use((req, res, next) => {
    res.status(404).json({status: 0, message:'404: Page not found'});
});

// Start the server
app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});