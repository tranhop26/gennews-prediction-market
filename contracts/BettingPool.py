# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


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
    # STORAGE FIELDS (JSON strings, not dict)
    # TreeMap auto-init to empty, DO NOT reassign in __init__!
    # ===================================================================
    bets: TreeMap[u256, str]           # bet_id -> JSON string of bet info
    user_stakes: TreeMap[str, str]     # "address_betid" -> JSON string of stake info
    next_bet_id: u256
    total_bets_created: u256
    total_volume: u256

    def __init__(self):
        """Only init primitive values. DO NOT touch TreeMap!"""
        self.next_bet_id = u256(1)
        self.total_bets_created = u256(0)
        self.total_volume = u256(0)

    # ===================================================================
    # HELPER: composite key for user_stakes
    # ===================================================================
    def _stake_key(self, user: str, bet_id: u256) -> str:
        return str(user) + "_" + str(int(bet_id))

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
        """
        if initial_stake == u256(0):
            raise gl.UserError("Initial stake must be > 0")
        if initial_choice not in ["YES", "NO"]:
            raise gl.UserError("Initial choice must be YES or NO")
        if len(question) < 10:
            raise gl.UserError("Question too short (min 10 chars)")

        bet_id = self.next_bet_id
        creator = str(gl.message.sender_address)

        total_yes = int(initial_stake) if initial_choice == "YES" else 0
        total_no = int(initial_stake) if initial_choice == "NO" else 0

        bet_info = {
            "question": question,
            "deadline": int(deadline),
            "creator": creator,
            "total_yes": total_yes,
            "total_no": total_no,
            "settled": False,
            "outcome": "",
            "reason": "",
            "confidence": 0,
            "created_at": 0
        }
        self.bets[bet_id] = json.dumps(bet_info)

        # Save creator's stake
        stake_key = self._stake_key(creator, bet_id)
        stake_info = {
            "choice": initial_choice,
            "amount": int(initial_stake),
            "claimed": False
        }
        self.user_stakes[stake_key] = json.dumps(stake_info)

        # Update counters
        self.next_bet_id += u256(1)
        self.total_bets_created += u256(1)
        self.total_volume += initial_stake

        return bet_id

    @gl.public.write
    def stake(self, bet_id: u256, choice: str, amount: u256):
        """
        Stake on an existing bet.
        """
        if amount == u256(0):
            raise gl.UserError("Amount must be > 0")
        if choice not in ["YES", "NO"]:
            raise gl.UserError("Choice must be YES or NO")
        if bet_id not in self.bets:
            raise gl.UserError("Bet does not exist")

        bet = json.loads(self.bets[bet_id])

        if bet["settled"]:
            raise gl.UserError("Bet already settled")

        # Update pool
        if choice == "YES":
            bet["total_yes"] += int(amount)
        else:
            bet["total_no"] += int(amount)
        self.bets[bet_id] = json.dumps(bet)

        # Track user stake
        sender = str(gl.message.sender_address)
        stake_key = self._stake_key(sender, bet_id)

        if stake_key in self.user_stakes:
            existing = json.loads(self.user_stakes[stake_key])
            if existing["choice"] != choice:
                raise gl.UserError("Cannot bet on both sides")
            existing["amount"] += int(amount)
            self.user_stakes[stake_key] = json.dumps(existing)
        else:
            stake_info = {
                "choice": choice,
                "amount": int(amount),
                "claimed": False
            }
            self.user_stakes[stake_key] = json.dumps(stake_info)

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
        if bet_id not in self.bets:
            raise gl.UserError("Bet does not exist")

        bet = json.loads(self.bets[bet_id])

        if bet["settled"]:
            raise gl.UserError("Bet already settled")

        # Copy question to local var (storage inaccessible in nondet)
        question = bet["question"]

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
            Non-deterministic: AI reads news and judges outcome.
            gl.nondet.web.render() + gl.nondet.exec_prompt() = impossible on Solidity
            """
            articles = []
            failed_count = 0

            for url in sources:
                try:
                    content = gl.nondet.web.render(url, mode="html")
                    articles.append(url + ":\n" + str(content)[:2000])
                except Exception:
                    failed_count += 1
                    continue

            if len(articles) == 0:
                return {"outcome": "NO", "confidence": 0, "reason": "Cannot access any news source"}

            combined = "\n\n--- SOURCE ---\n\n".join(articles)

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

        # CONSENSUS: prompt_comparative compares MEANING, not format
        # NOT strict_eq because AI results may differ in wording but agree on YES/NO
        result = gl.eq_principle.prompt_comparative(
            evaluate,
            principle="""Two AI judge results match if and only if:
1. They have the SAME 'outcome' field (both YES or both NO)
2. The reasoning supports the same conclusion
The exact confidence score and wording can differ."""
        )

        # Store consensus result on-chain
        bet["settled"] = True
        bet["outcome"] = result.get("outcome", "NO") if isinstance(result, dict) else "NO"
        bet["reason"] = result.get("reason", "AI analysis complete") if isinstance(result, dict) else str(result)
        bet["confidence"] = result.get("confidence", 0) if isinstance(result, dict) else 0
        self.bets[bet_id] = json.dumps(bet)

    @gl.public.write
    def claim_winnings(self, bet_id: u256) -> u256:
        """
        Claim winnings from a settled bet.
        Payout = (user_stake / winning_pool) * total_pool
        """
        if bet_id not in self.bets:
            raise gl.UserError("Bet does not exist")

        bet = json.loads(self.bets[bet_id])

        if not bet["settled"]:
            raise gl.UserError("Bet not settled yet")

        sender = str(gl.message.sender_address)
        stake_key = self._stake_key(sender, bet_id)

        if stake_key not in self.user_stakes:
            raise gl.UserError("You have no stake in this bet")

        user_stake = json.loads(self.user_stakes[stake_key])

        if user_stake["claimed"]:
            raise gl.UserError("Already claimed")

        if user_stake["choice"] != bet["outcome"]:
            user_stake["claimed"] = True
            self.user_stakes[stake_key] = json.dumps(user_stake)
            return u256(0)

        total_pool = bet["total_yes"] + bet["total_no"]
        winning_pool = bet["total_yes"] if bet["outcome"] == "YES" else bet["total_no"]

        if winning_pool == 0:
            raise gl.UserError("No winning stakes")

        payout = (user_stake["amount"] * total_pool) // winning_pool

        user_stake["claimed"] = True
        self.user_stakes[stake_key] = json.dumps(user_stake)

        return u256(payout)

    # ===================================================================
    # VIEW METHODS
    # ===================================================================

    @gl.public.view
    def get_bet(self, bet_id: u256) -> str:
        """Get detailed info of a single bet."""
        if bet_id not in self.bets:
            return json.dumps({"error": "Bet does not exist"})
        bet = json.loads(self.bets[bet_id])
        bet["bet_id"] = int(bet_id)
        return json.dumps(bet)

    @gl.public.view
    def get_user_stake(self, user: Address, bet_id: u256) -> str:
        """Get user stake info for a specific bet."""
        stake_key = self._stake_key(str(user), bet_id)
        if stake_key not in self.user_stakes:
            return json.dumps({"choice": "", "amount": 0, "claimed": False})
        return self.user_stakes[stake_key]

    @gl.public.view
    def get_all_bets(self) -> str:
        """Get list of all bets."""
        result = []
        for i in range(1, int(self.next_bet_id)):
            bid = u256(i)
            if bid in self.bets:
                bet = json.loads(self.bets[bid])
                bet["bet_id"] = i
                result.append(bet)
        return json.dumps(result)

    @gl.public.view
    def get_stats(self) -> str:
        """Get overall platform statistics."""
        return json.dumps({
            "total_bets": int(self.total_bets_created),
            "total_volume": int(self.total_volume),
            "next_bet_id": int(self.next_bet_id)
        })
