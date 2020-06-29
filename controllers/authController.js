const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

//creating jwt token with .sign() for logging user in
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 3600 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // hide the password from output
  user.password = undefined;

  //SEND COOKIE
  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

//SIGN UP a USER
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  //creating a token & send it to user
  createSendToken(newUser, 201, res);
});

//LOG IN a USER
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1) if email & password exists
  if (!email || !password) {
    return next(new AppError('Please provide email & password!', 400));
  }

  //2) if user exists & pasword matches
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password!', 400));
  }

  //3) if all ok, send token to client
  createSendToken(user, 200, res);
});

//protect routes
exports.protect = catchAsync(async (req, res, next) => {
  // 1) get the token & check of it's there...
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! please log in to get access', 401)
    );
  }
  // 2) verification token...
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) check if user still exists...
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError('The user belonging to the token does not exist', 401)
    );
  }

  // 4) check if user changed password after the token was issued...
  if (currentUser.passwordChangedAfter(decoded.iat)) {
    return next(
      new AppError(
        'User has recently changed password! please login again.',
        401
      )
    );
  }

  req.user = currentUser;
  //GRANT USER TO PROTECTED ROUTE
  next();
});

//RESTRICT USERS ACCORDING TO THEIR 'ROLE'
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action!', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) get user with the posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email.', 404));
  }

  //2) generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3) send the token to users email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Follow the link to reset your password :\n ${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10min only)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('Error sending email! Please try again later.', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) get the user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpiresAt: { $gt: Date.now() },
  });

  //2) if the token is not expired, and there is a user, set the new password
  if (!user) {
    return next(new AppError('The token is invalid or has expired!', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpiresAt = undefined;
  await user.save();

  //3) change the passwordChangedAt property(at userModel)
  //4) logged in the  user, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1. get the user from collection
  const user = await User.findById(req.user.id).select('+password');

  //2. check if the POSTed password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(
      new AppError('Entered password is not correct. Try again!', 401)
    );
  }

  //3. if so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4. log in the user, send JWT
  createSendToken(user, 200, res);
});
