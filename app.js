const express = require('express');
const morgan = require('morgan');

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
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server.`,
  // });

  const err = new Error(`Can't find ${req.originalUrl} on this server.`);
  err.status = 'fail';
  err.statusCode = 404;
  next(err);
});

//error handling middleware
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

module.exports = app;
