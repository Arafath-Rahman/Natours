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

const User = mongoose.model('User', userSchema);

module.exports = User;
