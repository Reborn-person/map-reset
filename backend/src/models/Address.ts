import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  tags: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

addressSchema.index({ location: '2dsphere' });

const Address = mongoose.model('Address', addressSchema);
export default Address;
