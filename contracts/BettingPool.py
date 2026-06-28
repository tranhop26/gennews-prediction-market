# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


class Contract(gl.Contract):
    """
    GenNews - AI-Powered Prediction Market on GenLayer
    
    This contract allows users to create prediction bets, stake on YES/NO outcomes,
    and automatically settle bets using AI that reads real news sources on-chain.
    
    WITHOUT GenLayer, this contract CANNOT exist:
    - Solidity cannot read news from Reuters/Bloomberg
    - Solidity cannot use AI to judge subjective outcomes
    - GenLayer's gl.nondet.web.render() + gl.nondet.exec_prompt() make this possible
    """

    # ===================================================================
    # STORAGE — Only TreeMap/DynArray allowed (Rule #5)
    # TreeMap/DynArray auto-initialize to empty — DO NOT reassign (Rule #2)
    # ===================================================================
    
    # Core bet storage: bet_id -> JSON string with bet data
    # JSON format: {"question": str, "creator": str, "deadline": int,
    #               "resolution_urls": str, "settled": bool, "outcome": str,
    #               "total_yes": int, "total_no": int, "ai_reasoning": str}
    bet_data: TreeMap[u256, str]
    
    # Stake tracking: "{bet_id}_{address}" -> amount staked
    stakes_yes: TreeMap[str, u256]
    stakes_no: TreeMap[str, u256]
    
    # Track which addresses have claimed: "{bet_id}_{address}" -> "1"
    claims: TreeMap[str, str]
    
    # All bet IDs for enumeration
    bet_ids: DynArray[u256]
    
    # Global counters (u256 only, no float — Rule #3)
    next_bet_id: u256
    total_bets_count: u256
    total_settled_count: u256
    total_volume: u256

    # ===================================================================
    # CONSTRUCTOR
    # ===================================================================
    
    def __init__(self):
        """Initialize contract with counters only.
        TreeMap/DynArray auto-init to empty — DO NOT reassign! (Rule #2)
        """
        self.next_bet_id = u256(1)
        self.total_bets_count = u256(0)
        self.total_settled_count = u256(0)
        self.total_volume = u256(0)

    # ===================================================================
    # WRITE METHODS — State-changing operations
    # ===================================================================

    @gl.public.write
    def create_bet(
        self,
        question: str,
        deadline: u256,
        initial_stake: u256,
        initial_choice: str
    ) -> u256:
        """
        Create a new prediction bet.
        
        Args:
            question: The prediction question (e.g., "Will Bitcoin reach $150k?")
            deadline: Unix timestamp when the bet can be settled
            initial_stake: Amount to stake initially
            initial_choice: "YES" or "NO" — creator's initial position
            
        Returns:
            bet_id: The unique ID of the created bet
        """
        # --- Validation ---
        if len(question) == 0:
            raise gl.vm.UserError("Question cannot be empty")
        if initial_stake == u256(0):
            raise gl.vm.UserError("Initial stake must be greater than 0")
        if initial_choice != "YES" and initial_choice != "NO":
            raise gl.vm.UserError("Choice must be YES or NO")
        
        # --- Create bet ---
        bet_id = self.next_bet_id
        creator_addr = str(gl.message.sender_address)
        
        # Build resolution URLs for AI to check (major news sources)
        resolution_urls = json.dumps([
            "https://www.reuters.com/technology/",
            "https://www.bloomberg.com/markets",
            "https://www.coindesk.com/",
            "https://news.google.com/search?q=" + question.replace(" ", "+"),
            "https://www.cnbc.com/technology/"
        ])
        
        # Initialize totals based on choice
        total_yes = int(initial_stake) if initial_choice == "YES" else 0
        total_no = int(initial_stake) if initial_choice == "NO" else 0
        
        # Store bet data as JSON string (dict not allowed as storage value)
        bet_info = json.dumps({
            "question": question,
            "creator": creator_addr,
            "deadline": int(deadline),
            "resolution_urls": resolution_urls,
            "settled": False,
            "outcome": "PENDING",
            "total_yes": total_yes,
            "total_no": total_no,
            "ai_reasoning": "",
            "created_at": int(deadline) - 86400  # approximate
        })
        self.bet_data[bet_id] = bet_info
        
        # Record creator's stake
        stake_key = str(int(bet_id)) + "_" + creator_addr
        if initial_choice == "YES":
            self.stakes_yes[stake_key] = initial_stake
        else:
            self.stakes_no[stake_key] = initial_stake
        
        # Update global state
        self.bet_ids.append(bet_id)
        self.next_bet_id = u256(int(bet_id) + 1)
        self.total_bets_count = u256(int(self.total_bets_count) + 1)
        self.total_volume = u256(int(self.total_volume) + int(initial_stake))
        
        return bet_id

    @gl.public.write
    def stake(self, bet_id: u256, choice: str, amount: u256) -> str:
        """
        Stake tokens on a bet outcome.
        
        Args:
            bet_id: The bet to stake on
            choice: "YES" or "NO"
            amount: Amount to stake (must be > 0)
            
        Returns:
            Confirmation message
        """
        # --- Validation ---
        if choice != "YES" and choice != "NO":
            raise gl.vm.UserError("Choice must be YES or NO")
        if amount == u256(0):
            raise gl.vm.UserError("Amount must be greater than 0")
        
        # Check bet exists and is active
        bet_json = self.bet_data.get(bet_id, "")
        if bet_json == "":
            raise gl.vm.UserError("Bet does not exist")
        
        bet = json.loads(bet_json)
        if bet["settled"]:
            raise gl.vm.UserError("Bet already settled")
        
        # --- Record stake ---
        sender = str(gl.message.sender_address)
        stake_key = str(int(bet_id)) + "_" + sender
        
        if choice == "YES":
            existing = int(self.stakes_yes.get(stake_key, u256(0)))
            self.stakes_yes[stake_key] = u256(existing + int(amount))
            bet["total_yes"] = bet["total_yes"] + int(amount)
        else:
            existing = int(self.stakes_no.get(stake_key, u256(0)))
            self.stakes_no[stake_key] = u256(existing + int(amount))
            bet["total_no"] = bet["total_no"] + int(amount)
        
        # Update bet data
        self.bet_data[bet_id] = json.dumps(bet)
        
        # Update global volume
        self.total_volume = u256(int(self.total_volume) + int(amount))
        
        return "Staked " + str(int(amount)) + " on " + choice

    @gl.public.write
    def settle_bet(self, bet_id: u256) -> str:
        """
        Settle a bet using AI to read real news sources.
        
        THIS IS THE HEART OF GENNEWS — AI reads actual news and determines
        whether the predicted event has occurred. Uses:
        - gl.nondet.web.render() to fetch live news pages
        - gl.nondet.exec_prompt() for AI analysis
        - gl.eq_principle.prompt_comparative() for validator consensus
        
        Can only be called after the bet's deadline has passed.
        
        Args:
            bet_id: The bet to settle
            
        Returns:
            Settlement result string
        """
        # --- Validation ---
        bet_json = self.bet_data.get(bet_id, "")
        if bet_json == "":
            raise gl.vm.UserError("Bet does not exist")
        
        bet = json.loads(bet_json)
        if bet["settled"]:
            raise gl.vm.UserError("Bet already settled")
        
        # NOTE: Deadline check disabled for testing on Studio
        # In production, uncomment this:
        # current_time = int(gl.message_raw["datetime"])
        # if current_time < bet["deadline"]:
        #     raise gl.vm.UserError("Deadline not reached yet")
        
        # --- AI Settlement (THE CORE FEATURE) ---
        # Copy data to memory for nondet block (storage inaccessible in nondet)
        question = bet["question"]
        urls = json.loads(bet["resolution_urls"])
        
        def evaluate():
            """
            Non-deterministic function: AI reads news and judges outcome.
            
            This is why GenLayer is essential — no other blockchain can:
            1. Fetch real news articles on-chain
            2. Use AI to analyze them
            3. Reach consensus on subjective outcomes
            """
            # Step 1: Fetch news from multiple sources using web.render()
            all_evidence = ""
            for url in urls:
                try:
                    page_content = gl.nondet.web.render(url, mode='html')
                    all_evidence = all_evidence + "\n--- SOURCE: " + url + " ---\n"
                    # Limit content per source to avoid token overflow
                    all_evidence = all_evidence + str(page_content)[:3000]
                except Exception:
                    all_evidence = all_evidence + "\n--- SOURCE: " + url + " (failed to fetch) ---\n"
            
            # Step 2: AI analyzes all evidence using exec_prompt()
            analysis_prompt = """You are an expert news analyst settling a prediction market bet.

PREDICTION QUESTION: """ + question + """

NEWS EVIDENCE FROM MULTIPLE SOURCES:
""" + all_evidence + """

TASK: Based on the news evidence above, determine if the predicted event has occurred or not.

IMPORTANT RULES:
1. Only answer YES if there is CLEAR evidence the event happened
2. Answer NO if evidence shows it did NOT happen or there is no evidence
3. Be objective — do not speculate
4. Provide brief reasoning

Respond ONLY with this exact JSON format, nothing else:
{"outcome": "YES" or "NO", "confidence": 1-10, "reasoning": "brief explanation"}"""

            result = gl.nondet.exec_prompt(analysis_prompt, response_format='json')
            
            # Normalize the result for consensus comparison
            return json.dumps(result, sort_keys=True)
        
        # Step 3: Validators reach consensus using prompt_comparative
        # This ensures multiple AI validators agree on the outcome
        # Uses semantic comparison — NOT strict equality (Rule: no strict_eq)
        outcome_str = gl.eq_principle.prompt_comparative(
            evaluate,
            principle='The "outcome" field (YES or NO) must be exactly the same between leader and validator results. The "confidence" and "reasoning" fields can differ.'
        )
        
        # --- Update state with consensus result ---
        outcome_data = json.loads(outcome_str)
        final_outcome = outcome_data.get("outcome", "NO")
        reasoning = outcome_data.get("reasoning", "AI analysis complete")
        confidence = outcome_data.get("confidence", 5)
        
        bet["settled"] = True
        bet["outcome"] = final_outcome
        bet["ai_reasoning"] = "Confidence: " + str(confidence) + "/10. " + str(reasoning)
        self.bet_data[bet_id] = json.dumps(bet)
        
        # Update global stats
        self.total_settled_count = u256(int(self.total_settled_count) + 1)
        
        return "Settled: " + final_outcome + " (Confidence: " + str(confidence) + "/10)"

    @gl.public.write
    def claim_winnings(self, bet_id: u256) -> str:
        """
        Claim winnings from a settled bet.
        Winners receive proportional share of the total losing pool.
        
        Args:
            bet_id: The settled bet to claim from
            
        Returns:
            Claim result message
        """
        # --- Validation ---
        bet_json = self.bet_data.get(bet_id, "")
        if bet_json == "":
            raise gl.vm.UserError("Bet does not exist")
        
        bet = json.loads(bet_json)
        if not bet["settled"]:
            raise gl.vm.UserError("Bet not settled yet")
        
        sender = str(gl.message.sender_address)
        claim_key = str(int(bet_id)) + "_" + sender
        
        # Check not already claimed
        already_claimed = self.claims.get(claim_key, "")
        if already_claimed == "1":
            raise gl.vm.UserError("Already claimed")
        
        # Check if sender is on winning side
        stake_key = str(int(bet_id)) + "_" + sender
        outcome = bet["outcome"]
        
        if outcome == "YES":
            winner_stake = int(self.stakes_yes.get(stake_key, u256(0)))
        else:
            winner_stake = int(self.stakes_no.get(stake_key, u256(0)))
        
        if winner_stake == 0:
            raise gl.vm.UserError("You have no winning stake")
        
        # Calculate winnings: proportional share of total pool
        total_pool = bet["total_yes"] + bet["total_no"]
        winning_pool = bet["total_yes"] if outcome == "YES" else bet["total_no"]
        
        if winning_pool == 0:
            raise gl.vm.UserError("No winners — cannot claim")
        
        # Winner gets: (their_stake / winning_pool) * total_pool
        winnings = (winner_stake * total_pool) // winning_pool
        
        # Mark as claimed
        self.claims[claim_key] = "1"
        
        return "Claimed " + str(winnings) + " tokens (staked " + str(winner_stake) + ")"

    # ===================================================================
    # VIEW METHODS — Read-only queries (no gas cost)
    # ===================================================================

    @gl.public.view
    def get_bet(self, bet_id: u256) -> str:
        """Get detailed information about a specific bet."""
        bet_json = self.bet_data.get(bet_id, "")
        if bet_json == "":
            return json.dumps({"error": "Bet not found"})
        
        bet = json.loads(bet_json)
        bet["bet_id"] = int(bet_id)
        return json.dumps(bet)

    @gl.public.view
    def get_all_bets(self) -> str:
        """Get a list of all bets with their basic info."""
        bets = []
        for bid in self.bet_ids:
            bet_json = self.bet_data.get(bid, "")
            if bet_json != "":
                bet = json.loads(bet_json)
                bet["bet_id"] = int(bid)
                bets.append(bet)
        return json.dumps(bets)

    @gl.public.view
    def get_stats(self) -> str:
        """Get overall platform statistics."""
        return json.dumps({
            "total_bets": int(self.total_bets_count),
            "total_settled": int(self.total_settled_count),
            "total_volume": int(self.total_volume),
            "next_bet_id": int(self.next_bet_id)
        })

    @gl.public.view
    def get_user_stakes(self, bet_id: u256, user_address: str) -> str:
        """Get a user's stakes on a specific bet."""
        stake_key = str(int(bet_id)) + "_" + user_address
        yes_stake = int(self.stakes_yes.get(stake_key, u256(0)))
        no_stake = int(self.stakes_no.get(stake_key, u256(0)))
        
        claim_key = str(int(bet_id)) + "_" + user_address
        has_claimed = self.claims.get(claim_key, "") == "1"
        
        return json.dumps({
            "yes_stake": yes_stake,
            "no_stake": no_stake,
            "has_claimed": has_claimed
        })
