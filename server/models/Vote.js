const mongoose = require('mongoose');


const voteSchema = new mongoose.Schema(
  {
    // Core identifiers
    claimId: { type: String, required: true, index: true },


    // Voter identity
    voter: { type: String, required: true },           // display name from FE
    voterAddress: { type: String, required: true, index: true }, // normalized (lowercase)


    // Position – FE sends 'truth' | 'fake'
    position: { type: String, enum: ['truth', 'fake'], required: true },


    // Stake/weight – FE sends both ETH (number) and wei (string)
    stake: { type: Number, required: true },        // ETH
    stakeWei: { type: String, required: true },     // wei (string)
    weight: { type: Number, required: true },       // normalized float
    weightWei: { type: String, required: true },    // wei (string)


    // Evidence – FE sends array of URLs (strings)
    evidence: { type: [String], required: true, default: [] },


    // Quality/score details (optional but used by FE)
    evidenceQualityScore: { type: Number, default: 1.0 },
    weightTruthScore: { type: Number, default: 1.0 },


    // Badge/meta from FE
    badgeTier: { type: String, default: '' },
    categoryBadge: { type: String, default: '' },
    truthScoreAtVote: { type: Number, default: 0 },
    roleBadges: { type: [String], default: [] },


    // Optional location meta
    voterCity: String,
    voterProvince: String,
    voterCountry: String,


    // Chain metadata from FE
    txHash: { type: String, required: true },
    blockchainTxHash: { type: String }, // FE duplicates txHash; keep optional
    blockNumber: { type: Number, required: true },
    chainId: { type: Number, required: true },


    // Rewards (optional on create)
    reward: { type: Number, default: 0 },
    rewardWei: { type: String, default: '0' },
    rewarded: { type: Boolean, default: false },


    // FE timestamps
    timestamp: Number,       // unix seconds
    votedAt: Date,           // ISO string


    status: {
      type: String,
      enum: ['onchain', 'pending'],
      default: 'onchain',
    },
  },
  { timestamps: true }
);


// Prevent double vote per claim per wallet
voteSchema.index({ claimId: 1, voterAddress: 1 }, { unique: true });


module.exports = mongoose.model('Vote', voteSchema);





