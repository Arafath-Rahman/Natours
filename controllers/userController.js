const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...alllowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (alllowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //create an error if user tries to update password
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new AppError(
        'This route is not for update password. Please use /updateMyPassword route',
        400
      )
    );
  }

  //2) filtered out unwanted properties which should not be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  //3)update the informations
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message:
      'This route is not yet implemented! try /signup for create a user.',
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// do not update password with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
