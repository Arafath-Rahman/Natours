const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

//1) GLOBAL MIDDLEWARES 🔥

//secure HTTP headers
app.use(helmet());

//development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//request lilmiter from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request attempts from user, please try again in 1 hour!',
});
app.use('/api', limiter);

// body parser, reading data from body to req.body
app.use(express.json({ limit: '10kb' }));

//using 'static' build-in middleware to serve static files from folders
app.use(express.static(`${__dirname}/public`));

//creating our own 'TEST' middleware
app.use((req, res, next) => {
  req.requestedTime = new Date().toISOString();
  next();
});

// ROUTES 🔥
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// middleware for unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

//error handling middleware
app.use(globalErrorHandler);

module.exports = app;
