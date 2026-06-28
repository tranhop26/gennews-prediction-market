# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *


class Contract(gl.Contract):
    """
    GenNews - Prediction Market tự động settle bằng AI đọc tin tức thật.
    
    AI là TRÁI TIM của hệ thống:
    - gl.nondet.web.render() đọc tin tức từ Reuters, Bloomberg, TechCrunch
    - gl.nondet.exec_prompt() AI phán quyết kết quả
    - gl.eq_principle.prompt_comparative() validators đạt consensus
    
    Không có GenLayer = dự án CHẾT. Solidity không thể đọc tin tức on-chain.
    """

    # ===================================================================
    # STORAGE FIELDS
    # TreeMap/DynArray tự động init = empty, KHÔNG gán lại trong __init__!
    # ===================================================================
    bets: TreeMap[u256, dict]                              # bet_id -> BetInfo
    user_stakes: TreeMap[Address, TreeMap[u256, dict]]      # user -> bet_id -> StakeInfo
    next_bet_id: u256
    total_bets_created: u256
    total_volume: u256

    def __init__(self):
        """CHỈ khởi tạo primitive values. KHÔNG động vào TreeMap!"""
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
        Tạo bet mới.
        
        Args:
            question: Câu hỏi dự đoán (vd: "Will Bitcoin reach $150k by Dec 2026?")
            deadline: Unix timestamp (giây)
            initial_stake: Số token stake ban đầu
            initial_choice: "YES" hoặc "NO"
        Returns:
            bet_id: ID của bet vừa tạo
        """
        # --- Validation ---
        if initial_stake == u256(0):
            raise gl.UserError("Initial stake must be > 0")
        if initial_choice not in ["YES", "NO"]:
            raise gl.UserError("Initial choice must be YES or NO")
        if len(question) < 10:
            raise gl.UserError("Question too short (min 10 chars)")

        bet_id = self.next_bet_id

        # --- Tạo bet info ---
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

        # Stake ban đầu của creator
        if initial_choice == "YES":
            self.bets[bet_id]["total_yes"] = initial_stake
        else:
            self.bets[bet_id]["total_no"] = initial_stake

        # Lưu stake của user
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
        Stake vào một bet đã tồn tại.
        
        Args:
            bet_id: ID của bet
            choice: "YES" hoặc "NO"
            amount: Số token stake
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
            # User đã stake trước đó — chỉ cho phép cùng side
            existing = self.user_stakes[sender][bet_id]
            if existing["choice"] != choice:
                raise gl.UserError("Cannot bet on both sides")
            existing["amount"] += amount
        else:
            # Stake mới
            self.user_stakes[sender][bet_id] = {
                "choice": choice,
                "amount": amount,
                "claimed": False
            }

        self.total_volume += amount

    @gl.public.write
    def settle_bet(self, bet_id: u256):
        """
        Settle bet bằng AI đọc tin tức — ĐÂY LÀ TRÁI TIM CỦA GENNEWS!
        
        Flow:
        1. AI đọc 5 nguồn tin uy tín (Reuters, Bloomberg, TechCrunch...)
        2. AI phân tích và phán quyết YES/NO
        3. Validators so sánh kết quả bằng prompt_comparative
        4. Kết quả consensus được lưu on-chain
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
        # Tạo search query từ question
        search_terms = question.replace("Will ", "").replace("?", "").replace("by ", "")

        # Danh sách nguồn tin uy tín
        sources = [
            "https://www.reuters.com/search/news?blob=" + search_terms.replace(" ", "+"),
            "https://www.bloomberg.com/search?query=" + search_terms.replace(" ", "+"),
            "https://techcrunch.com/?s=" + search_terms.replace(" ", "+"),
            "https://www.cnbc.com/search/?query=" + search_terms.replace(" ", "%20"),
            "https://news.google.com/search?q=" + search_terms.replace(" ", "+")
        ]

        def evaluate():
            """
            Non-deterministic function: AI đọc tin tức và phán quyết.
            
            Đây là lý do GenLayer CẦN THIẾT:
            1. gl.nondet.web.render() — đọc trang tin tức thật
            2. gl.nondet.exec_prompt() — AI phân tích nội dung
            Solidity KHÔNG THỂ làm được điều này.
            """
            articles = []
            failed_count = 0

            # Crawl từng nguồn tin
            for url in sources:
                try:
                    content = gl.nondet.web.render(url, mode="html")
                    # Lấy 2000 ký tự đầu (tránh token overflow)
                    articles.append(url + ":\n" + str(content)[:2000])
                except Exception:
                    failed_count += 1
                    continue

            # Nếu không đọc được nguồn nào
            if len(articles) == 0:
                return {"outcome": "NO", "confidence": 0, "reason": "Cannot access any news source"}

            # Ghép nội dung tất cả nguồn
            combined = "\n\n--- SOURCE ---\n\n".join(articles)

            # Prompt cho AI Judge
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

        # --- CONSENSUS: prompt_comparative so sánh Ý NGHĨA, không so format ---
        # Đây là lý do KHÔNG dùng strict_eq: kết quả AI có thể khác format
        # nhưng cùng ý nghĩa (cùng YES/NO)
        result = gl.eq_principle.prompt_comparative(
            evaluate,
            principle="""Two AI judge results match if and only if:
1. They have the SAME 'outcome' field (both YES or both NO)
2. The reasoning supports the same conclusion
The exact confidence score and wording can differ."""
        )

        # --- Lưu kết quả consensus on-chain ---
        bet["settled"] = True
        bet["outcome"] = result.get("outcome", "NO") if isinstance(result, dict) else "NO"
        bet["reason"] = result.get("reason", "AI analysis complete") if isinstance(result, dict) else str(result)
        bet["confidence"] = u256(result.get("confidence", 0)) if isinstance(result, dict) else u256(0)

    @gl.public.write
    def claim_winnings(self, bet_id: u256) -> u256:
        """
        User claim tiền thắng cược.
        
        Payout = (user_stake / winning_pool) * total_pool
        VD: stake 100, winning_pool 500, total_pool 1000 → payout = 200
        
        Returns: số token claim được (0 nếu thua)
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

        # --- Kiểm tra đoán đúng/sai ---
        if user_stake["choice"] != bet["outcome"]:
            # Thua cược
            user_stake["claimed"] = True
            return u256(0)

        # --- Thắng cược: tính payout ---
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
        """Lấy thông tin chi tiết một bet."""
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
        """Lấy thông tin stake của user trong một bet."""
        if user not in self.user_stakes:
            return {"choice": "", "amount": 0, "claimed": False}
        if bet_id not in self.user_stakes[user]:
            return {"choice": "", "amount": 0, "claimed": False}
        
        stake = dict(self.user_stakes[user][bet_id])
        stake["amount"] = int(stake["amount"])
        return stake

    @gl.public.view
    def get_all_bets(self) -> list:
        """Lấy danh sách tất cả bets với thông tin cơ bản."""
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
        """Lấy thống kê tổng quan."""
        return {
            "total_bets": int(self.total_bets_created),
            "total_volume": int(self.total_volume),
            "next_bet_id": int(self.next_bet_id)
        }
