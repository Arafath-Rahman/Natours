// Schema ↪ Model ↪ Documents
//Mongoose 'Schema' creation 😇
const mongoose = require('mongoose');

//creating schema with rules...
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A Tour must have e name'],
    unique: true,
    trim: true,
  },
  duration: {
    type: Number,
    required: [true, 'A Tour must have a duration.'],
  },
  price: {
    type: Number,
    required: [true, 'A Tour must have a price'],
  },
  priceDiscount: Number,
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a MaxGroupSize'],
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have difficulty'],
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },
  summary: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a summary'],
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a cover image'],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  startDates: [Date],
});

//making a 'Model' out of a Schema 🎬
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
