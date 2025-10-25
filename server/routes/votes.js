const express = require('express');
const router = express.Router();
const Vote = require('../models/Vote');

// @route   GET /api/votes/:claimId
// @desc    Get all votes for a claim
// @access  Public
router.get('/:claimId', async (req, res) => {
  try {
    const votes = await Vote.find({ claimId: req.params.claimId });
    res.json(votes);
  } catch (error) {
    console.error('Error fetching votes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/votes/user/:walletAddress
// @desc    Get all votes by a user
// @access  Public
router.get('/user/:walletAddress', async (req, res) => {
  try {
    const votes = await Vote.find({ 
      voter: req.params.walletAddress.toLowerCase() 
    }).sort({ votedAt: -1 });
    
    res.json(votes);
  } catch (error) {
    console.error('Error fetching user votes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/votes
// @desc    Save a new vote to the votes collection
// @access  Public
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};


    // Accept either position or isTrue from FE
    let position = body.position;
    if (!position && typeof body.isTrue === 'boolean') {
      position = body.isTrue ? 'truth' : 'fake';
    }


    // Normalize wallet
    const voterAddress = (body.voterAddress || '').toLowerCase();


    // Required fields that FE sends after on-chain confirm
    const required = {
      claimId: body.claimId,
      voter: body.voter,                      // displayName
      voterAddress,
      position,
      stake: body.stake,                      // number (ETH)
      weight: body.weight,                    // number (normalized)
      stakeWei: body.stakeWei,                // string
      weightWei: body.weightWei,              // string
      txHash: body.txHash,                    // string
      chainId: body.chainId,                  // number
      blockNumber: body.blockNumber,          // number
      evidence: body.evidence,                // string[]
    };


    const missing = Object.entries(required)
      .filter(([_, v]) =>
        v === undefined || v === null ||
        (typeof v === 'string' && v.trim() === '') ||
        (Array.isArray(v) && v.length === 0)
      )
      .map(([k]) => k);


    if (missing.length) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }


    // Enforce position enum
    if (!['truth', 'fake'].includes(position)) {
      return res.status(400).json({ error: 'Invalid position; expected "truth" or "fake"' });
    }


    // Prevent duplicate vote
    const existing = await Vote.findOne({ claimId: body.claimId, voterAddress });
    if (existing) {
      return res.status(400).json({ error: 'User already voted on this claim' });
    }


    // Build document exactly as FE expects to see it later
    const doc = {
      claimId: String(body.claimId),


      voter: body.voter,
      voterAddress,


      position,


      stake: Number(body.stake),
      weight: Number(body.weight),
      stakeWei: String(body.stakeWei),
      weightWei: String(body.weightWei),


      // evidence comes as string[]
      evidence: Array.isArray(body.evidence) ? body.evidence : [],


      evidenceQualityScore: body.evidenceQualityScore ?? 1.0,
      weightTruthScore: body.weightTruthScore ?? 1.0,


      badgeTier: body.badgeTier ?? '',
      categoryBadge: body.categoryBadge ?? '',
      truthScoreAtVote: body.truthScoreAtVote ?? 0,
      roleBadges: Array.isArray(body.roleBadges) ? body.roleBadges : [],


      voterCity: body.voterCity,
      voterProvince: body.voterProvince,
      voterCountry: body.voterCountry,


      txHash: body.txHash,
      blockchainTxHash: body.blockchainTxHash || body.txHash,
      blockNumber: Number(body.blockNumber),
      chainId: Number(body.chainId),


      reward: Number(body.reward ?? 0),
      rewardWei: body.rewardWei ?? '0',
      rewarded: Boolean(body.rewarded ?? false),


      timestamp: body.timestamp ?? Math.floor(Date.now() / 1000),
      votedAt: body.votedAt ? new Date(body.votedAt) : new Date(),


      status: body.status || 'onchain',
    };


    const saved = await new Vote(doc).save();
    return res.status(201).json({ message: 'Vote successfully saved', vote: saved });
  } catch (err) {
    console.error('❌ Vote save error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});





// @route   PUT /api/votes/:claimId/:voter
// @desc    Update vote (for rewards)
// @access  Public
router.put('/:claimId/:voter', async (req, res) => {
  try {
    const vote = await Vote.findOneAndUpdate(
      { 
        claimId: req.params.claimId,
        voter: req.params.voter.toLowerCase()
      },
      req.body,
      { new: true }
    );

    if (!vote) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    res.json(vote);
  } catch (error) {
    console.error('Error updating vote:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
