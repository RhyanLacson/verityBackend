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
    const {
      claimId,
      voter,          // wallet address (frontend sends this)
      position,       // 'truth' | 'fake' (frontend sends this)
      stake,
      badgeTier,
      categoryBadge,
      truthScoreAtVote,
      evidence,
      evidenceQualityScore,
      weightTruthScore,
      weight,
      metadata
    } = req.body;

    // ✅ Validation
    if (!claimId || !voter || !position || stake == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ✅ Prevent duplicate vote from same wallet for same claim
    const existing = await Vote.findOne({
      claimId,
      voter: voter.toLowerCase(),
    });
    if (existing) {
      return res.status(400).json({ error: 'User already voted on this claim' });
    }

    // ✅ Create vote record
    const newVote = new Vote({
      claimId,
      voter: voter.toLowerCase(),
      voterAddress: voter.toLowerCase(),
      position,
      stake,
      badgeTier,
      categoryBadge,
      roleBadges: metadata?.roleBadges || [],
      truthScoreAtVote,
      evidence: Array.isArray(evidence)
        ? evidence.map((e) => (typeof e === 'string' ? { url: e } : e))
        : [],
      evidenceQualityScore,
      weight: weight || weightTruthScore || 1.0,
      blockchainTxHash: metadata?.txHash,
      voterCity: metadata?.voterCity,
      voterProvince: metadata?.voterProvince,
      voterCountry: metadata?.voterCountry
    });

    const savedVote = await newVote.save();

    res.status(201).json({
      message: 'Vote successfully saved',
      vote: savedVote
    });
  } catch (error) {
    console.error('❌ Error creating vote:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
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
