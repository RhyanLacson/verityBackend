// models/Claim.js
const mongoose = require('mongoose');

/* ---------- Subdocs ---------- */
const EvidenceSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    domain: String,
    qualityScore: Number,          // 0..100 (or 0..1 if you prefer; FE normalizes)
    addedBy: String,               // displayName / address
    timestamp: Date,
  },
  { _id: false }
);

const VoterScopeSchema = new mongoose.Schema(
  {
    everyone: { type: Boolean, default: true },        // FE often uses “everyone”
    requireCategory: { type: Boolean, default: false },// FE default false
    allowedRoles: { type: [String], default: [] },
    allowedGeo: {
      countries: { type: [String], default: [] },
      provinces: { type: [String], default: [] },
      cities: { type: [String], default: [] },
    },
  },
  { _id: false }
);

/* ---------- Main schema ---------- */
const ClaimSchema = new mongoose.Schema(
  {
    claimId: { type: String, required: true, unique: true },

    title: { type: String, required: true },
    summary: { type: String, default: '' },
    url: { type: String, default: '' },

    category: {
      type: String,
      required: true,
      enum: ['Tech', 'Health', 'Politics', 'Finance', 'Science'],
      index: true,
    },

    poster: { type: String, required: true, index: true },

    // Keep both to avoid FE/BE mismatch
    ipfsCid: String,
    ipfsHash: String,

    // Evidence the FE shows under the claim
    evidence: { type: [EvidenceSchema], default: [] },

    /* ---- Timing ---- */
    postedAt: { type: Date, default: Date.now },
    votingDurationSec: { type: Number, default: 300 },
    votingEndsAt: Date,
    startTime: Date,
    endTime: Date,

    /* ---- Status (aligned with FE) ---- */
    status: {
      type: String,
      enum: [
        'pending',  // before it enters voting
        'voting',
        'ended',    // FE sets when time is up
        'verified', // after AI/resolve
        'flagged',  // moderation
        'resolving',
        'resolved',
      ],
      default: 'pending',
      index: true,
    },

    /* ---- Voting scope / eligibility ---- */
    voterScope: { type: VoterScopeSchema, default: undefined },
    eligibilityHash: String,

    /* ---- Chain metadata ---- */
    txHash: String,
    chainId: Number,
    blockNumber: Number,

    /* ---- Final resolution (on-chain or computed) ---- */
    resolution: {
      outcome: { type: String, enum: ['truth', 'fake', 'unresolved'] },
      aiVerdict: String,
      aiConfidence: Number,
      aiSources: [String],
      totalStakeTrue: Number,
      totalStakeFake: Number,
      resolvedAt: Date,
      blockchainTxHash: String,
    },

    metadata: {
      totalEligibleVoters: Number,
    },

    /* ---- AI verification (what your BE route writes) ---- */
    aiVerification: {
      result: { type: String, default: 'Uncertain' },   // "Truth" | "Fake" | "Uncertain"
      finalScore: { type: Number, default: 0 },         // 0..100
      confidence: { type: Number, default: 0 },         // mirror for FE convenience
      reasoning: String,
      breakdown: {
        aiScore: Number,
        evidenceScore: Number,
        userCredibilityScore: Number,
        sourceScore: Number,
        // optional: store weights & notes if you choose
        aiWeight: Number,
        evidenceWeight: Number,
        userCredWeight: Number,
        sourceWeight: Number,
        llmNotes: [String],
      },
      sources: [String],
      verifiedAt: { type: Date, default: Date.now },
      modelUsed: String,                                // e.g., "gemini-2.5-flash"
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ---------- Indexes ---------- */
ClaimSchema.index({ claimId: 1 }, { unique: true });
// category, poster, status already indexed above via field options

module.exports = mongoose.model('Claim', ClaimSchema);