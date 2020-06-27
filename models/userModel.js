const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name.'],
  },
  email: {
    type: String,
    required: [true, 'Please Enter your email.'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail],
  },
  photo: {
    type: String,
  },
  password: {
    type: String,
    required: [true, 'please provide a password.'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'please confirm your password.'],
    validate: {
      //this only works on.save()/.create()
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: Date,
});

userSchema.pre('save', async function (next) {
  // only run this function if 'password' is modified
  if (!this.isModified('password')) return next();

  //encrypt password: hash the password with cost 12
  this.password = await bcrypt.hash(this.password, 12);
  //deleting the passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

// this method will available to all 'Documents' created with userSchema
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.passwordChangedAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
