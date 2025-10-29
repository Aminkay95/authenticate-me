const express = require('express');

require('express-async-errors');

const morgan = require('morgan');
const cors = require('cors');
const csurf = require('csurf');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');


const { environment } = require('./config')

const isProduction = environment === 'production';


const app = express();

//-----------------          MIDDDLEWARES       ----------------------

//logging information by morgan

app.use(morgan('dev'));

// parsing cookies

app.use(cookieParser());


// Parse JSON bodies of requests

app.use(express.json());

// Security

// cors to allow different origins only for development
if(!isProduction){
    app.use(cors());
}

// helmet for better security for cross-site scripting (XSS)
app.use(
    helmet.crossOriginResourcePolicy({
        policy: "cross-origin"
    })
)

// csurf to prevent Cross-site Request Fogery (CSRF)

app.use(
    csurf({
        cookie: {
            secure: isProduction,
            sameSite: isProduction && "Lax",
            httpOnly: true
        }
    })
)

//-------------- Routes -------------

const routes = require('./routes');


app.use(routes);


// -----------------Error handling Middlewares

// resource not found Error handler middleware
app.use((_req, _res, next) => {
    const err = new Error('The requested resource could not be found.');
    err.title = "Resource not found";
    err.status = 404;
    err.errors = ['The requested resource could not be found.']
    next(err);
});

// Sequelize error-handler

const { ValidationError} = require('sequelize')

app.use((err, _req, _res, next) => {
    if(err instanceof ValidationError){
        err.errors = err.errors.map((e) => e.message);
        err.title = 'Validation Error';
    }
    next(err)
});

// Error Formatter Error-Handler

app.use((err, _req, res, _next) => {
    res.status(err.status || 500);
    console.error(err);
    res.json({
        title: err.title || 'Server Error',
        message: err.message,
        errors: err.errors,
        stack: isProduction ? null : err.stack
    });
});



module.exports = app;
