import mongoose from 'mongoose';

const { Schema } = mongoose;

// const blogSchema = new Schema({
//   title:  String, // String is shorthand for {type: String}
//   author: String,
//   body:   String,
//   comments: [{ body: String, date: Date }],
//   date: { type: Date, default: Date.now },
//   hidden: Boolean,
//   meta: {
//     votes: Number,
//     favs:  Number
//   }
// });

const reviewSchema = new Schema({
  product_id: { type: Number, required: true },
  reviewer_name: { type: String, required: true },
  reviewer_email: { type: String, required: true },
  date: { type: Date, default: Date.now() },
  rating: { type: Number, min: 1, max: 5, required: true },
  summary: { type: String, maxLength: 60, required: true },
  body: { type: String, minLength: 50, maxLength: 1000, required: true },
  recommended: { type: Boolean, required: true },
  response: { type: String, maxLength: 1000 },
  size: { type: Number, min: 1, max: 5, required: true },
  width: { type: Number, min: 1, max: 5, required: true },
  comfort: { type: Number, min: 1, max: 5, required: true },
  quality: { type: Number, min: 1, max: 5, required: true },
  length: { type: Number, min: 1, max: 5, required: true },
  helpful: { type: Number, required: true },
  reported: { type: Boolean, default: false },
  photos: [{ url: String }]
});

// const reviewerSchema = new Schema({
//   name: String,
//   email: String
// });

// const photoSchema = new Schema({
//   url: String
// })

// const productSchema = new Schema({
//   name: String
// })