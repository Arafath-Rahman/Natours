const mongoose = require('mongoose');
const slugify = require('slugify');
//const User = require('./userModel');
//const validator = require('validator');

// Schema ↪ Model ↪ Documents
//Mongoose 'Schema' creation 😇
//creating schema with rules...
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A Tour must have e name'],
      unique: true,
      trim: true,
      maxlength: [40, 'The name must be less or equal 40 characters.'],
      minlength: [10, 'The name must be more or equal 10 characters.'],
      //validate: [validator.isAlpha, 'Tour name must contain only characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A Tour must have a duration.'],
    },
    price: {
      type: Number,
      required: [true, 'A Tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //this only points to current doc on new document creation
          return val < this.price;
        },
        message: 'Discounted Price ({VALUE}) shoulde less than original price',
      },
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a MaxGroupSize'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'],
      enum: {
        values: ['difficult', 'medium', 'easy'],
        message: 'difficulty is either: easy, medium or difficult.',
      },
    },
    rating: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
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
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    //creating embedded documents here inside location
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// make 'price' an index
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

// virtual properties (these are not part of DB)
tourSchema.virtual('durationInWeeks').get(function () {
  return this.duration / 7;
});

//Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//'PRE' DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// //how to embed documents in a document
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.pre('save', function (next) {
//   console.log('pre save hook/middleware running...');
//   next();
// });

// //'POST' DOCUMENT MIDDLEWARE: runs after .save() and .create()
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// //'PRE' QUERY MIDDLEWARE: runs before .find()
tourSchema.pre(/^find/, function (next) {
  this.start = Date.now();
  this.find({ secretTour: { $ne: true } });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

//'POST' QUERY MIDDLEWARE: runs before .find()
tourSchema.post(/^find/, function (docs, next) {
  console.log(`This query took ${Date.now() - this.start} milliseconds!`);
  next();
});

//'PRE' AGGREGATE MIDDLEWARE: runs before the Aggregation
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});

//making a 'Model' out of a Schema 🎬
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
