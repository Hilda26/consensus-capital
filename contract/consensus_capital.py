# ConsensusCapital - GenLayer Intelligent Contract
# Source of truth for opportunities, model outputs, and consensus.

import json
from genlayer import gl
from genlayer.types import Address, u256
from genlayer.std import TreeMap
from genlayer.errors import VmUserError


ALLOWED_BANDS = ("HIGH_CONVICTION", "WATCHLIST", "SPECULATIVE", "AVOID")
DIMENSIONS = ("risk", "upside", "market_fit", "team_quality", "timing", "traction", "moat")


def _require(cond: bool, msg: str) -> None:
    if not cond:
        raise VmUserError(msg)


def _validate_dims(d: dict) -> None:
    for k in DIMENSIONS:
        v = d.get(k)
        _require(isinstance(v, (int, float)) and 0 <= v <= 100, f"dimension {k} out of range")


def _validate_model_output(m: dict) -> None:
    _require(isinstance(m.get("model_id"), str), "model_id required")
    _validate_dims(m.get("dimension_scores") or {})
    _require(m.get("recommendation_hint") in ALLOWED_BANDS, "bad recommendation_hint")
    c = m.get("confidence")
    _require(isinstance(c, (int, float)) and 0 <= c <= 1, "confidence out of range")
    _require(isinstance(m.get("reasoning"), str) and m["reasoning"].strip(), "reasoning empty")
    for k in ("strengths", "weaknesses", "unknowns"):
        _require(isinstance(m.get(k), list), f"{k} must be list")


def _validate_consensus(c: dict) -> None:
    cs = c.get("consensus_score")
    _require(isinstance(cs, (int, float)) and 0 <= cs <= 100, "consensus_score range")
    conf = c.get("confidence")
    _require(isinstance(conf, (int, float)) and 0 <= conf <= 1, "confidence range")
    di = c.get("disagreement_index")
    _require(isinstance(di, (int, float)) and 0 <= di <= 1, "disagreement_index range")
    _require(c.get("recommendation_band") in ALLOWED_BANDS, "bad recommendation_band")
    _validate_dims(c.get("dimension_scores") or {})
    _require(isinstance(c.get("reasoning"), str) and c["reasoning"].strip(), "reasoning empty")
    for k in ("strengths", "weaknesses", "unknowns", "follow_up_questions"):
        _require(isinstance(c.get(k), list), f"{k} must be list")


EVAL_PROMPT = """You are independently evaluating an investment opportunity for a decision-support product.

Do not provide regulated financial advice.
Do not guarantee returns.
Do not tell the user to buy, sell, or invest.
Do not simply summarise the opportunity.
Assess the opportunity realistically across risk, upside, market fit, team quality, timing, traction, and moat.
Capture uncertainty and missing evidence.
Return strict JSON only.
"""

AGG_PROMPT = """Aggregate the independent model evaluations into a final consensus investment intelligence result.

Do not hide disagreement.
If models disagree, surface it through the disagreement index and reasoning.
Do not guarantee investment outcomes.
Build a recommendation band based on evidence, model outputs, and uncertainty.
Return strict JSON only.
"""


class ConsensusCapital(gl.Contract):
    owner: Address
    opportunity_count: u256
    review_count: u256
    update_count: u256

    opportunities: TreeMap[str, str]
    opportunity_reviews: TreeMap[str, str]
    model_outputs: TreeMap[str, str]
    consensus_outputs: TreeMap[str, str]
    watch_state: TreeMap[str, str]
    user_opportunities: TreeMap[str, str]
    opportunity_updates: TreeMap[str, str]
    protocol_state: TreeMap[str, str]

    def __init__(self) -> None:
        self.owner = gl.message.sender_address
        self.opportunity_count = u256(0)
        self.review_count = u256(0)
        self.update_count = u256(0)

    # --- Deterministic writers ---

    @gl.public.write
    def create_opportunity(self, opportunity_id: str, opportunity_json: str) -> None:
        _require(opportunity_id != "", "opportunity_id required")
        _require(self.opportunities.get(opportunity_id) is None, "opportunity exists")
        try:
            data = json.loads(opportunity_json)
        except Exception:
            raise VmUserError("invalid opportunity json")
        _require(isinstance(data.get("title"), str) and data["title"].strip(), "title required")
        data["status"] = "SUBMITTED"
        data["proposer_address"] = str(gl.message.sender_address)
        self.opportunities[opportunity_id] = json.dumps(data)
        existing = self.user_opportunities.get(str(gl.message.sender_address)) or "[]"
        arr = json.loads(existing)
        arr.append(opportunity_id)
        self.user_opportunities[str(gl.message.sender_address)] = json.dumps(arr)
        self.opportunity_count = u256(int(self.opportunity_count) + 1)
        self._run_review(opportunity_id)

    @gl.public.write
    def submit_follow_up_update(self, opportunity_id: str, update_id: str, update_json: str) -> None:
        _require(self.opportunities.get(opportunity_id) is not None, "opportunity not found")
        try:
            json.loads(update_json)
        except Exception:
            raise VmUserError("invalid update json")
        existing = self.opportunity_updates.get(opportunity_id) or "[]"
        arr = json.loads(existing)
        arr.append({"update_id": update_id, "payload": json.loads(update_json)})
        self.opportunity_updates[opportunity_id] = json.dumps(arr)
        self.update_count = u256(int(self.update_count) + 1)
        opp = json.loads(self.opportunities[opportunity_id])
        opp["status"] = "UPDATED"
        self.opportunities[opportunity_id] = json.dumps(opp)
        self._run_review(opportunity_id)

    @gl.public.write
    def rerun_consensus(self, opportunity_id: str) -> None:
        _require(self.opportunities.get(opportunity_id) is not None, "opportunity not found")
        self._run_review(opportunity_id)

    @gl.public.write
    def archive_opportunity(self, opportunity_id: str) -> None:
        opp_raw = self.opportunities.get(opportunity_id)
        _require(opp_raw is not None, "opportunity not found")
        opp = json.loads(opp_raw)
        _require(opp.get("proposer_address") == str(gl.message.sender_address), "not proposer")
        opp["status"] = "ARCHIVED"
        self.opportunities[opportunity_id] = json.dumps(opp)

    @gl.public.write
    def toggle_watch(self, opportunity_id: str, watch_json: str) -> None:
        _require(self.opportunities.get(opportunity_id) is not None, "opportunity not found")
        try:
            json.loads(watch_json)
        except Exception:
            raise VmUserError("invalid watch json")
        key = f"{str(gl.message.sender_address)}:{opportunity_id}"
        self.watch_state[key] = watch_json

    # --- Internal review pipeline ---

    def _run_review(self, opportunity_id: str) -> None:
        opp_raw = self.opportunities[opportunity_id]
        opp = json.loads(opp_raw)
        opp["status"] = "UNDER_REVIEW"
        self.opportunities[opportunity_id] = json.dumps(opp)

        outputs = []
        for focus in DIMENSIONS:
            raw = self._evaluate_dimension(opp_raw, focus)
            try:
                parsed = json.loads(raw)
            except Exception:
                raise VmUserError(f"evaluator {focus} returned invalid JSON")
            _validate_model_output(parsed)
            outputs.append(parsed)

        self.model_outputs[opportunity_id] = json.dumps(outputs)
        consensus_raw = self._aggregate_consensus(json.dumps(outputs), opportunity_id)
        try:
            consensus = json.loads(consensus_raw)
        except Exception:
            raise VmUserError("aggregator returned invalid JSON")
        consensus["opportunity_id"] = opportunity_id
        _validate_consensus(consensus)
        self.consensus_outputs[opportunity_id] = json.dumps(consensus)
        self.review_count = u256(int(self.review_count) + 1)
        opp["status"] = "REVIEWED"
        self.opportunities[opportunity_id] = json.dumps(opp)

    # --- Non-deterministic GenLayer evaluators ---

    def _evaluate_dimension(self, opportunity_json: str, focus: str) -> str:
        def runner() -> str:
            prompt = (
                EVAL_PROMPT
                + f"\nDimension focus: {focus}\n"
                + f"Opportunity JSON:\n{opportunity_json}\n"
                + 'Return strict JSON with fields: model_id, dimension_focus, dimension_scores '
                  '{risk,upside,market_fit,team_quality,timing,traction,moat all 0..100}, '
                  'recommendation_hint, strengths, weaknesses, unknowns, reasoning, confidence (0..1).'
            )
            return gl.nondet.exec_prompt(prompt)
        return gl.eq_principle.prompt_comparative(runner, "Both outputs must agree on the dimension focus, recommendation hint, and broad score ranges.")

    def _aggregate_consensus(self, model_json_array: str, opportunity_id: str) -> str:
        def runner() -> str:
            prompt = (
                AGG_PROMPT
                + f"\nOpportunity id: {opportunity_id}\n"
                + f"Model outputs JSON array:\n{model_json_array}\n"
                + 'Return strict JSON with fields: opportunity_id, consensus_score (0..100), '
                  'confidence (0..1), disagreement_index (0..1), recommendation_band, dimension_scores, '
                  'summary, strengths, weaknesses, unknowns, follow_up_questions, reasoning.'
            )
            return gl.nondet.exec_prompt(prompt)
        return gl.eq_principle.prompt_comparative(runner, "Both outputs must agree on recommendation band and consensus score within 10 points.")

    # --- View functions ---

    @gl.public.view
    def get_opportunity(self, opportunity_id: str) -> str:
        return self.opportunities.get(opportunity_id) or ""

    @gl.public.view
    def get_opportunity_reviews(self, opportunity_id: str) -> str:
        return self.opportunity_reviews.get(opportunity_id) or ""

    @gl.public.view
    def get_model_outputs(self, opportunity_id: str) -> str:
        return self.model_outputs.get(opportunity_id) or "[]"

    @gl.public.view
    def get_consensus_output(self, opportunity_id: str) -> str:
        return self.consensus_outputs.get(opportunity_id) or ""

    @gl.public.view
    def get_user_opportunities(self, address: Address) -> str:
        return self.user_opportunities.get(str(address)) or "[]"

    @gl.public.view
    def get_total_opportunities(self) -> u256:
        return self.opportunity_count

    @gl.public.view
    def get_protocol_state(self) -> str:
        return json.dumps({
            "opportunity_count": int(self.opportunity_count),
            "review_count": int(self.review_count),
            "update_count": int(self.update_count),
        })
