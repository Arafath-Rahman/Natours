const AppError = require('../utils/appError');

const handleInvalidIdErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 404);
};

const handleDuplicateNameDB = (err) => {
  const message = `Duplicate value found: "${err.keyValue.name}". Please use another value.`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(404).json({
    status: 'error',
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  //operational error, trusted error:send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    //programming error, unknown error: dont leak error message
    // 1) log console
    console.log('Error: ', err);

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
    if (error.kind === 'ObjectId') error = handleInvalidIdErrorDB(error);
    if (error.code === 11000) error = handleDuplicateNameDB(error);

    sendErrorProd(error, res);
  }
};
