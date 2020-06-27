const AppError = require('../utils/appError');

const handleInvalidIdErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 404);
};

const handleDuplicateNameDB = (err) => {
  const message = `Duplicate value found: "${err.keyValue.name}". Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const message = Object.values(err.errors)
    .map((el) => el.message)
    .join(' | ');
  return new AppError(message, 404);
};

const handleJWTerror = () =>
  new AppError('Invalid token. Please login again!', 401);

const handleJWTExpireError = () =>
  new AppError('Token expired. Please login again!', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  //operational error, trusted error:send message to client
  if (err.isOperational) {
    console.log(err);
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    //programming error, unknown error: dont leak error message
    // 1) log console
    console.log('Error: 🔥 ', err);

    //2) send generic response
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    console.log(error);
    if (error.kind === 'ObjectId') error = handleInvalidIdErrorDB(error);
    if (error.code === 11000) error = handleDuplicateNameDB(error);
    if (error._message && error._message.includes('Validation failed', 0))
      error = handleValidationErrorDB(error);

    if (error.name === 'JsonWebTokenError') error = handleJWTerror();
    if (error.name === 'TokenExpiredError') error = handleJWTExpireError();

    sendErrorProd(error, res);
  }
};
