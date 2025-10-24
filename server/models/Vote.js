const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  claimId: {
    type: String,
    required: true,
    index: true
  },
  voter: {
    type: String,
    required: true,
    index: true
  },
  voterAddress: {
    type: String,
    required: false
  },
  position: {
    type: String,
    required: true,
    enum: ['truth', 'fake']
  },
  stake: {
    type: Number,
    required: true
  },
  evidence: [{
    url: String,
    note: String
  }],
  evidenceQualityScore: {
    type: Number,
    default: 1.0
  },
  badgeTier: {
    type: String,
    enum: ['silver', 'gold', 'expert'],
    default: 'silver'
  },
  categoryBadge: {
    type: String
  },
  roleBadges: {
    type: [String],
    default: []
  },
  truthScoreAtVote: {
    type: Number,
    default: 0
  },
  weightTruthScore: {
    type: Number,
    default: 1.0
  },
  tierMultiplier: {
    type: Number,
    default: 1.0
  },
  weight: {
    type: Number,
    required: true
  },
  voterCity: String,
  voterProvince: String,
  voterCountry: String,
  blockchainTxHash: String,
  reward: {
    type: Number,
    default: 0
  },
  rewarded: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Number, // keep as numeric (Unix-like)
    default: () => Math.floor(Date.now() / 1000)
  },
  votedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Prevent duplicate votes on same claim
voteSchema.index({ claimId: 1, voter: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
