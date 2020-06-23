const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// MIDDLEWARES 🔥
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//using 'static' build-in middleware to serve static files from folders
app.use(express.static(`${__dirname}/public`));

//creating our own middleware
// app.use((req, res, next) => {
//   console.log('Hello from the middlewere! 🤣 ');
//   next();
// });

app.use((req, res, next) => {
  req.requestedTime = new Date().toISOString();
  next();
});

// ROUTES 🔥
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// middleware for unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(404, `Can't find ${req.originalUrl} on this server.`));
});

//error handling middleware
app.use(globalErrorHandler);

module.exports = app;
