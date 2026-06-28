# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *


class Contract(gl.Contract):
    """
    GenNews - AI-Powered Prediction Market that auto-settles by reading real news.
    
    AI is the HEART of this system:
    - gl.nondet.web.render() reads news from Reuters, Bloomberg, TechCrunch
    - gl.nondet.exec_prompt() AI judges the outcome
    - gl.eq_principle.prompt_comparative() validators reach consensus
    
    Without GenLayer = project DIES. Solidity cannot read news on-chain.
    """

    # ===================================================================
    # STORAGE FIELDS
    # TreeMap/DynArray auto-init to empty, DO NOT reassign in __init__!
    # ===================================================================
    bets: TreeMap[u256, dict]                              # bet_id -> BetInfo
    user_stakes: TreeMap[Address, TreeMap[u256, dict]]      # user -> bet_id -> StakeInfo
    next_bet_id: u256
    total_bets_created: u256
    total_volume: u256

    def __init__(self):
        """Only init primitive values. DO NOT touch TreeMap!"""
        self.next_bet_id = u256(1)
        self.total_bets_created = u256(0)
        self.total_volume = u256(0)

    # ===================================================================
    # WRITE METHODS
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
        Create a new prediction market bet.
        
        Args:
            question: Prediction question (e.g. "Will Bitcoin reach $150k by Dec 2026?")
            deadline: Unix timestamp (seconds)
            initial_stake: Initial token stake amount
            initial_choice: "YES" or "NO"
        Returns:
            bet_id: ID of the newly created bet
        """
        # --- Validation ---
        if initial_stake == u256(0):
            raise gl.UserError("Initial stake must be > 0")
        if initial_choice not in ["YES", "NO"]:
            raise gl.UserError("Initial choice must be YES or NO")
        if len(question) < 10:
            raise gl.UserError("Question too short (min 10 chars)")

        bet_id = self.next_bet_id

        # --- Create bet info ---
        self.bets[bet_id] = {
            "question": question,
            "deadline": int(deadline),
            "creator": str(gl.message.sender_address),
            "total_yes": u256(0),
            "total_no": u256(0),
            "settled": False,
            "outcome": "",
            "reason": "",
            "confidence": u256(0),
            "created_at": 0
        }

        # Creator's initial stake
        if initial_choice == "YES":
            self.bets[bet_id]["total_yes"] = initial_stake
        else:
            self.bets[bet_id]["total_no"] = initial_stake

        # Save user stake
        sender = gl.message.sender_address
        if sender not in self.user_stakes:
            self.user_stakes[sender] = {}

        self.user_stakes[sender][bet_id] = {
            "choice": initial_choice,
            "amount": initial_stake,
            "claimed": False
        }

        # Update counters
        self.next_bet_id += u256(1)
        self.total_bets_created += u256(1)
        self.total_volume += initial_stake

        return bet_id

    @gl.public.write
    def stake(self, bet_id: u256, choice: str, amount: u256):
        """
        Stake on an existing bet.
        
        Args:
            bet_id: Bet ID
            choice: "YES" or "NO"
            amount: Token amount to stake
        """
        # --- Validation ---
        if amount == u256(0):
            raise gl.UserError("Amount must be > 0")
        if choice not in ["YES", "NO"]:
            raise gl.UserError("Choice must be YES or NO")
        if bet_id not in self.bets:
            raise gl.UserError("Bet does not exist")

        bet = self.bets[bet_id]

        if bet["settled"]:
            raise gl.UserError("Bet already settled")

        # --- Update pool ---
        if choice == "YES":
            bet["total_yes"] += amount
        else:
            bet["total_no"] += amount

        # --- Track user stake ---
        sender = gl.message.sender_address
        if sender not in self.user_stakes:
            self.user_stakes[sender] = {}

        if bet_id in self.user_stakes[sender]:
            # User already staked - only allow same side
            existing = self.user_stakes[sender][bet_id]
            if existing["choice"] != choice:
                raise gl.UserError("Cannot bet on both sides")
            existing["amount"] += amount
        else:
            # New stake
            self.user_stakes[sender][bet_id] = {
                "choice": choice,
                "amount": amount,
                "claimed": False
            }

        self.total_volume += amount

    @gl.public.write
    def settle_bet(self, bet_id: u256):
        """
        Settle bet using AI reading real news - THIS IS THE HEART OF GENNEWS!
        
        Flow:
        1. AI reads 5 credible news sources (Reuters, Bloomberg, TechCrunch...)
        2. AI analyzes and judges YES/NO
        3. Validators compare results using prompt_comparative
        4. Consensus result is stored on-chain
        """
        # --- Validation ---
        if bet_id not in self.bets:
            raise gl.UserError("Bet does not exist")

        bet = self.bets[bet_id]

        if bet["settled"]:
            raise gl.UserError("Bet already settled")

        # --- Copy data to local vars (storage inaccessible in nondet) ---
        question = bet["question"]

        # --- AI SETTLEMENT: The CORE of GenNews ---
        # Create search query from question
        search_terms = question.replace("Will ", "").replace("?", "").replace("by ", "")

        # List of credible news sources
        sources = [
            "https://www.reuters.com/search/news?blob=" + search_terms.replace(" ", "+"),
            "https://www.bloomberg.com/search?query=" + search_terms.replace(" ", "+"),
            "https://techcrunch.com/?s=" + search_terms.replace(" ", "+"),
            "https://www.cnbc.com/search/?query=" + search_terms.replace(" ", "%20"),
            "https://news.google.com/search?q=" + search_terms.replace(" ", "+")
        ]

        def evaluate():
            """
            Non-deterministic function: AI reads news and judges outcome.
            
            This is WHY GenLayer is ESSENTIAL:
            1. gl.nondet.web.render() - reads real news pages
            2. gl.nondet.exec_prompt() - AI analyzes content
            Solidity CANNOT do this.
            """
            articles = []
            failed_count = 0

            # Crawl each news source
            for url in sources:
                try:
                    content = gl.nondet.web.render(url, mode="html")
                    # Take first 2000 chars (avoid token overflow)
                    articles.append(url + ":\n" + str(content)[:2000])
                except Exception:
                    failed_count += 1
                    continue

            # If no sources accessible
            if len(articles) == 0:
                return {"outcome": "NO", "confidence": 0, "reason": "Cannot access any news source"}

            # Combine all source content
            combined = "\n\n--- SOURCE ---\n\n".join(articles)

            # Prompt for AI Judge
            prompt = """You are a neutral AI judge for a prediction market called GenNews.
Your job is to determine if an event happened based on credible news sources.

**Question to resolve:**
""" + question + """

**News articles from """ + str(len(articles)) + """ sources:**
""" + combined + """

**Your task:**
1. Analyze the evidence above carefully
2. Determine if the event described in the question has ACTUALLY HAPPENED (YES) or NOT (NO)
3. Rate your confidence level (0-100)
4. Provide a brief reasoning (max 100 words)

**Rules:**
- Only answer YES if there is CLEAR, EXPLICIT evidence from multiple sources
- If sources contradict each other, lower your confidence
- If no relevant information found, answer NO with low confidence
- Be conservative: when in doubt, require stronger evidence

**Return JSON format (strict):**
{"outcome": "YES" or "NO", "confidence": 85, "reason": "Brief explanation"}"""

            result = gl.nondet.exec_prompt(prompt, response_format="json")
            return result

        # --- CONSENSUS: prompt_comparative compares MEANING, not format ---
        # This is why we do NOT use strict_eq: AI results may differ in format
        # but agree in meaning (same YES/NO)
        result = gl.eq_principle.prompt_comparative(
            evaluate,
            principle="""Two AI judge results match if and only if:
1. They have the SAME 'outcome' field (both YES or both NO)
2. The reasoning supports the same conclusion
The exact confidence score and wording can differ."""
        )

        # --- Store consensus result on-chain ---
        bet["settled"] = True
        bet["outcome"] = result.get("outcome", "NO") if isinstance(result, dict) else "NO"
        bet["reason"] = result.get("reason", "AI analysis complete") if isinstance(result, dict) else str(result)
        bet["confidence"] = u256(result.get("confidence", 0)) if isinstance(result, dict) else u256(0)

    @gl.public.write
    def claim_winnings(self, bet_id: u256) -> u256:
        """
        Claim winnings from a settled bet.
        
        Payout = (user_stake / winning_pool) * total_pool
        Example: stake 100, winning_pool 500, total_pool 1000 -> payout = 200
        
        Returns: tokens claimed (0 if lost)
        """
        # --- Validation ---
        if bet_id not in self.bets:
            raise gl.UserError("Bet does not exist")

        bet = self.bets[bet_id]

        if not bet["settled"]:
            raise gl.UserError("Bet not settled yet")

        sender = gl.message.sender_address
        if sender not in self.user_stakes:
            raise gl.UserError("You have no stake in this bet")
        if bet_id not in self.user_stakes[sender]:
            raise gl.UserError("You have no stake in this bet")

        user_stake = self.user_stakes[sender][bet_id]

        if user_stake["claimed"]:
            raise gl.UserError("Already claimed")

        # --- Check if user predicted correctly ---
        if user_stake["choice"] != bet["outcome"]:
            # Lost the bet
            user_stake["claimed"] = True
            return u256(0)

        # --- Won: calculate payout ---
        total_pool = bet["total_yes"] + bet["total_no"]
        winning_pool = bet["total_yes"] if bet["outcome"] == "YES" else bet["total_no"]

        if winning_pool == u256(0):
            raise gl.UserError("No winning stakes")

        # payout = (stake / winning_pool) * total_pool
        payout = (user_stake["amount"] * total_pool) // winning_pool

        user_stake["claimed"] = True

        return payout

    # ===================================================================
    # VIEW METHODS (read-only, no gas)
    # ===================================================================

    @gl.public.view
    def get_bet(self, bet_id: u256) -> dict:
        """Get detailed info of a single bet."""
        if bet_id not in self.bets:
            raise gl.UserError("Bet does not exist")
        
        bet = dict(self.bets[bet_id])
        bet["bet_id"] = int(bet_id)
        bet["total_yes"] = int(bet["total_yes"])
        bet["total_no"] = int(bet["total_no"])
        bet["confidence"] = int(bet["confidence"])
        return bet

    @gl.public.view
    def get_user_stake(self, user: Address, bet_id: u256) -> dict:
        """Get user stake info for a specific bet."""
        if user not in self.user_stakes:
            return {"choice": "", "amount": 0, "claimed": False}
        if bet_id not in self.user_stakes[user]:
            return {"choice": "", "amount": 0, "claimed": False}
        
        stake = dict(self.user_stakes[user][bet_id])
        stake["amount"] = int(stake["amount"])
        return stake

    @gl.public.view
    def get_all_bets(self) -> list:
        """Get list of all bets with basic info."""
        result = []
        for i in range(1, int(self.next_bet_id)):
            bid = u256(i)
            if bid in self.bets:
                bet = dict(self.bets[bid])
                bet["bet_id"] = i
                bet["total_yes"] = int(bet["total_yes"])
                bet["total_no"] = int(bet["total_no"])
                bet["confidence"] = int(bet["confidence"])
                result.append(bet)
        return result

    @gl.public.view
    def get_stats(self) -> dict:
        """Get overall platform statistics."""
        return {
            "total_bets": int(self.total_bets_created),
            "total_volume": int(self.total_volume),
            "next_bet_id": int(self.next_bet_id)
        }
