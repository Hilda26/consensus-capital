# v0.4.0 - full fault tolerance: any LLM failure substitutes a safe default; tx always commits
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


ALLOWED_BANDS = ("HIGH_CONVICTION", "WATCHLIST", "SPECULATIVE", "AVOID")
DIMENSIONS = ("risk", "upside", "market_fit", "team_quality", "timing", "traction", "moat")


def _require(cond: bool, msg: str) -> None:
    if not cond:
        raise gl.vm.UserError(msg)


def _is_number(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _clamp_unit(v):
    """Coerce LLM-returned unit values into [0,1]. Handles common LLM
    mistakes: returning percentages (85 for 0.85), returning >1, negatives."""
    if not _is_number(v):
        return v
    if v > 1:
        return min(v / 100.0, 1.0)
    if v < 0:
        return 0.0
    return float(v)


def _clamp_score(v):
    """Coerce a dimension or consensus score into [0,100]."""
    if not _is_number(v):
        return v
    if v < 0:
        return 0.0
    if v > 100:
        return 100.0
    return float(v)


def _json_loads(raw: str, err: str):
    try:
        return json.loads(raw)
    except Exception:
        raise gl.vm.UserError(err)


def _extract_json_lenient(raw, err: str):
    """Parse JSON from LLM output even when wrapped in markdown fences,
    surrounded by prose, or contains stray whitespace. Falls back to strict
    parsing if extraction fails."""
    if not isinstance(raw, str):
        raise gl.vm.UserError(err)
    s = raw.strip()
    # Strip markdown code fence: ```json ... ``` or ``` ... ```
    if s.startswith("```"):
        first_newline = s.find("\n")
        if first_newline > 0:
            s = s[first_newline + 1:]
        if s.endswith("```"):
            s = s[:-3]
        s = s.strip()
    # Slice between first { and last } for object payloads
    first_brace = s.find("{")
    last_brace = s.rfind("}")
    if first_brace >= 0 and last_brace > first_brace:
        candidate = s[first_brace:last_brace + 1]
        try:
            return json.loads(candidate)
        except Exception:
            pass
    # Final attempt against the cleaned string
    try:
        return json.loads(s)
    except Exception:
        raise gl.vm.UserError(err)


def _json_dumps(data) -> str:
    return json.dumps(data, separators=(",", ":"), sort_keys=True)


def _zero_dims():
    out = {}
    for k in DIMENSIONS:
        out[k] = 0
    return out


def _default_model_output(focus: str, reason: str):
    """Safe default returned when an evaluator's LLM output can't be used.
    Marks itself as a fallback so the UI can render it as such."""
    return {
        "model_id": "fallback_" + focus,
        "dimension_focus": focus,
        "dimension_scores": _zero_dims(),
        "recommendation_hint": "SPECULATIVE",
        "strengths": [],
        "weaknesses": ["Evaluator for this dimension failed: " + reason],
        "unknowns": ["All values are placeholders due to evaluator failure."],
        "reasoning": "This dimension could not be scored. Re-run consensus to retry.",
        "confidence": 0.0,
    }


def _default_consensus_from_models(opportunity_id: str, models, reason: str):
    """Build a deterministic fallback consensus by averaging whichever model
    outputs were valid. Used when the aggregator itself fails or produces
    unusable JSON."""
    valid = []
    for m in models:
        if isinstance(m, dict) and m.get("confidence", 0.0) > 0.0:
            valid.append(m)
    if len(valid) == 0:
        return {
            "opportunity_id": opportunity_id,
            "consensus_score": 0,
            "confidence": 0.0,
            "disagreement_index": 1.0,
            "recommendation_band": "SPECULATIVE",
            "dimension_scores": _zero_dims(),
            "summary": "Aggregator failed and no evaluator outputs were usable. Re-run consensus.",
            "strengths": [],
            "weaknesses": ["Aggregator failed: " + reason],
            "unknowns": ["No usable model outputs."],
            "follow_up_questions": [],
            "reasoning": "Fallback consensus because aggregator output could not be parsed and no evaluators succeeded.",
        }
    dim_avg = _zero_dims()
    for k in DIMENSIONS:
        total = 0.0
        for m in valid:
            ds = m.get("dimension_scores") or {}
            v = ds.get(k)
            if _is_number(v):
                total = total + v
        dim_avg[k] = total / len(valid)
    cs = 0.0
    for k in DIMENSIONS:
        cs = cs + dim_avg[k]
    cs = cs / len(DIMENSIONS)
    conf_total = 0.0
    for m in valid:
        c = m.get("confidence")
        if _is_number(c):
            conf_total = conf_total + c
    avg_conf = conf_total / len(valid)
    return {
        "opportunity_id": opportunity_id,
        "consensus_score": cs,
        "confidence": avg_conf,
        "disagreement_index": 0.5,
        "recommendation_band": "WATCHLIST",
        "dimension_scores": dim_avg,
        "summary": "Fallback consensus computed from individual model outputs because the aggregator output could not be used.",
        "strengths": [],
        "weaknesses": ["Aggregator failed: " + reason],
        "unknowns": ["This consensus was averaged deterministically, not produced by the aggregator."],
        "follow_up_questions": [],
        "reasoning": "The aggregator's response could not be parsed. This consensus is the arithmetic mean of the evaluator outputs that did succeed.",
    }


def _validate_dims(d: dict) -> None:
    _require(isinstance(d, dict), "dimension_scores must be object")

    for k in DIMENSIONS:
        v = d.get(k)
        _require(_is_number(v), "dimension " + k + " must be a number")
        d[k] = _clamp_score(v)


def _validate_string_list(m: dict, key: str) -> None:
    arr = m.get(key)
    _require(isinstance(arr, list), key + " must be list")

    for item in arr:
        _require(isinstance(item, str), key + " items must be strings")


def _try_normalize_model_output(m, expected_focus: str):
    """Tries to normalize an LLM-returned model output. Returns the normalized
    dict if usable, or None if it cannot be salvaged. Never throws."""
    if not isinstance(m, dict):
        return None
    # model_id - default if missing
    mid = m.get("model_id")
    if not isinstance(mid, str) or not mid.strip():
        m["model_id"] = "evaluator_" + expected_focus
    # dimension_focus - force-correct it
    m["dimension_focus"] = expected_focus
    # dimension_scores - require dict, clamp values, default missing to 0
    ds = m.get("dimension_scores")
    if not isinstance(ds, dict):
        ds = {}
    for k in DIMENSIONS:
        v = ds.get(k)
        if _is_number(v):
            ds[k] = _clamp_score(v)
        else:
            ds[k] = 0
    m["dimension_scores"] = ds
    # recommendation_hint - default to SPECULATIVE if invalid
    if m.get("recommendation_hint") not in ALLOWED_BANDS:
        m["recommendation_hint"] = "SPECULATIVE"
    # confidence - clamp; default to 0.5 if missing
    c = m.get("confidence")
    if _is_number(c):
        m["confidence"] = _clamp_unit(c)
    else:
        m["confidence"] = 0.5
    # reasoning - default to placeholder if missing
    r = m.get("reasoning")
    if not isinstance(r, str) or not r.strip():
        m["reasoning"] = "Evaluator did not produce reasoning text."
    # strengths/weaknesses/unknowns - coerce to string lists
    for key in ("strengths", "weaknesses", "unknowns"):
        arr = m.get(key)
        if not isinstance(arr, list):
            m[key] = []
        else:
            clean = []
            for item in arr:
                if isinstance(item, str):
                    clean.append(item)
            m[key] = clean
    return m


def _try_normalize_consensus(c, opportunity_id: str):
    """Tries to normalize an LLM-returned consensus output. Returns the
    normalized dict if usable, or None if it cannot be salvaged."""
    if not isinstance(c, dict):
        return None
    c["opportunity_id"] = opportunity_id
    cs = c.get("consensus_score")
    if _is_number(cs):
        c["consensus_score"] = _clamp_score(cs)
    else:
        c["consensus_score"] = 0
    conf = c.get("confidence")
    if _is_number(conf):
        c["confidence"] = _clamp_unit(conf)
    else:
        c["confidence"] = 0.0
    di = c.get("disagreement_index")
    if _is_number(di):
        c["disagreement_index"] = _clamp_unit(di)
    else:
        c["disagreement_index"] = 0.5
    if c.get("recommendation_band") not in ALLOWED_BANDS:
        c["recommendation_band"] = "SPECULATIVE"
    ds = c.get("dimension_scores")
    if not isinstance(ds, dict):
        ds = {}
    for k in DIMENSIONS:
        v = ds.get(k)
        if _is_number(v):
            ds[k] = _clamp_score(v)
        else:
            ds[k] = 0
    c["dimension_scores"] = ds
    if not isinstance(c.get("summary"), str) or not c["summary"].strip():
        c["summary"] = "Aggregator did not produce a summary."
    if not isinstance(c.get("reasoning"), str) or not c["reasoning"].strip():
        c["reasoning"] = "Aggregator did not produce reasoning text."
    for key in ("strengths", "weaknesses", "unknowns", "follow_up_questions"):
        arr = c.get(key)
        if not isinstance(arr, list):
            c[key] = []
        else:
            clean = []
            for item in arr:
                if isinstance(item, str):
                    clean.append(item)
            c[key] = clean
    return c


EVAL_PROMPT = """You are independently evaluating an investment opportunity for a decision-support product.

Do not provide regulated financial advice.
Do not guarantee returns.
Do not tell the user to buy, sell, or invest.
Do not simply summarise the opportunity.

Assess the opportunity realistically across:
- risk
- upside
- market fit
- team quality
- timing
- traction
- moat

Capture uncertainty and missing evidence.

OUTPUT RULES (critical):
- Your entire response must be a single valid JSON object and nothing else.
- Do NOT wrap the JSON in markdown code fences (no ```json, no ```).
- Do NOT include any prose, headings, or commentary before or after the JSON.
- Your response must start with the character { and end with the character }.
- All numeric values must be plain numbers (e.g. 72 or 0.84, not "72%" or "0.84").
- All keys and string values must be double-quoted.
"""


AGG_PROMPT = """Aggregate the independent model evaluations into a final consensus investment intelligence result.

Do not hide disagreement.
If models disagree, surface it through the disagreement index and reasoning.
Do not guarantee investment outcomes.
Build a recommendation band based on evidence, model outputs, and uncertainty.

OUTPUT RULES (critical):
- Your entire response must be a single valid JSON object and nothing else.
- Do NOT wrap the JSON in markdown code fences (no ```json, no ```).
- Do NOT include any prose, headings, or commentary before or after the JSON.
- Your response must start with the character { and end with the character }.
- All numeric values must be plain numbers.
- All keys and string values must be double-quoted.
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

        self.opportunities = TreeMap[str, str]()
        self.opportunity_reviews = TreeMap[str, str]()
        self.model_outputs = TreeMap[str, str]()
        self.consensus_outputs = TreeMap[str, str]()
        self.watch_state = TreeMap[str, str]()
        self.user_opportunities = TreeMap[str, str]()
        self.opportunity_updates = TreeMap[str, str]()
        self.protocol_state = TreeMap[str, str]()

    # ─────────────────────────────────────────────────────────────
    # TreeMap helpers
    # ─────────────────────────────────────────────────────────────

    def _map_has(self, m: TreeMap[str, str], key: str) -> bool:
        return key in m

    def _map_get(self, m: TreeMap[str, str], key: str) -> str:
        if key not in m:
            return ""
        return m[key]

    def _map_get_or(self, m: TreeMap[str, str], key: str, default_value: str) -> str:
        if key not in m:
            return default_value
        return m[key]

    # ─────────────────────────────────────────────────────────────
    # Deterministic writers
    # ─────────────────────────────────────────────────────────────

    @gl.public.write
    def create_opportunity(self, opportunity_id: str, opportunity_json: str) -> None:
        _require(isinstance(opportunity_id, str) and opportunity_id.strip(), "opportunity_id required")
        _require(not self._map_has(self.opportunities, opportunity_id), "opportunity exists")

        data = _json_loads(opportunity_json, "invalid opportunity json")
        _require(isinstance(data, dict), "opportunity json must be object")
        _require(isinstance(data.get("title"), str) and data["title"].strip(), "title required")

        data["status"] = "SUBMITTED"
        data["opportunity_id"] = opportunity_id
        data["proposer_address"] = str(gl.message.sender_address)

        self.opportunities[opportunity_id] = _json_dumps(data)

        user_key = str(gl.message.sender_address)
        existing = self._map_get_or(self.user_opportunities, user_key, "[]")
        arr = _json_loads(existing, "corrupt user opportunity index")
        _require(isinstance(arr, list), "corrupt user opportunity index")

        arr.append(opportunity_id)
        self.user_opportunities[user_key] = _json_dumps(arr)

        self.opportunity_count = u256(int(self.opportunity_count) + 1)

        self._run_review(opportunity_id)

    @gl.public.write
    def submit_follow_up_update(self, opportunity_id: str, update_id: str, update_json: str) -> None:
        _require(isinstance(opportunity_id, str) and opportunity_id.strip(), "opportunity_id required")
        _require(isinstance(update_id, str) and update_id.strip(), "update_id required")

        opp_raw = self._map_get(self.opportunities, opportunity_id)
        _require(opp_raw != "", "opportunity not found")

        opp = _json_loads(opp_raw, "corrupt opportunity")
        _require(opp.get("status") != "ARCHIVED", "opportunity archived")

        update_payload = _json_loads(update_json, "invalid update json")
        _require(isinstance(update_payload, dict), "update json must be object")

        existing = self._map_get_or(self.opportunity_updates, opportunity_id, "[]")
        arr = _json_loads(existing, "corrupt updates index")
        _require(isinstance(arr, list), "corrupt updates index")

        for item in arr:
            _require(isinstance(item, dict), "corrupt update item")
            _require(item.get("update_id") != update_id, "update exists")

        arr.append({
            "update_id": update_id,
            "submitter_address": str(gl.message.sender_address),
            "payload": update_payload,
        })

        self.opportunity_updates[opportunity_id] = _json_dumps(arr)

        self.update_count = u256(int(self.update_count) + 1)

        opp["status"] = "UPDATED"
        self.opportunities[opportunity_id] = _json_dumps(opp)

        self._run_review(opportunity_id)

    @gl.public.write
    def rerun_consensus(self, opportunity_id: str) -> None:
        _require(isinstance(opportunity_id, str) and opportunity_id.strip(), "opportunity_id required")

        opp_raw = self._map_get(self.opportunities, opportunity_id)
        _require(opp_raw != "", "opportunity not found")

        opp = _json_loads(opp_raw, "corrupt opportunity")
        _require(opp.get("status") != "ARCHIVED", "opportunity archived")

        self._run_review(opportunity_id)

    @gl.public.write
    def archive_opportunity(self, opportunity_id: str) -> None:
        _require(isinstance(opportunity_id, str) and opportunity_id.strip(), "opportunity_id required")

        opp_raw = self._map_get(self.opportunities, opportunity_id)
        _require(opp_raw != "", "opportunity not found")

        opp = _json_loads(opp_raw, "corrupt opportunity")
        _require(opp.get("proposer_address") == str(gl.message.sender_address), "not proposer")

        opp["status"] = "ARCHIVED"
        self.opportunities[opportunity_id] = _json_dumps(opp)

    @gl.public.write
    def toggle_watch(self, opportunity_id: str, watch_json: str) -> None:
        _require(isinstance(opportunity_id, str) and opportunity_id.strip(), "opportunity_id required")
        _require(self._map_has(self.opportunities, opportunity_id), "opportunity not found")

        data = _json_loads(watch_json, "invalid watch json")
        _require(isinstance(data, dict), "watch json must be object")

        if "is_watching" in data:
            _require(isinstance(data.get("is_watching"), bool), "is_watching must be bool")

        data["watcher_address"] = str(gl.message.sender_address)
        data["opportunity_id"] = opportunity_id

        key = str(gl.message.sender_address) + ":" + opportunity_id
        self.watch_state[key] = _json_dumps(data)

    # ─────────────────────────────────────────────────────────────
    # Internal review pipeline
    # ─────────────────────────────────────────────────────────────

    def _run_review(self, opportunity_id: str) -> None:
        opp_raw = self._map_get(self.opportunities, opportunity_id)
        _require(opp_raw != "", "opportunity not found")

        opp = _json_loads(opp_raw, "corrupt opportunity")
        _require(opp.get("status") != "ARCHIVED", "opportunity archived")

        opp["status"] = "UNDER_REVIEW"
        self.opportunities[opportunity_id] = _json_dumps(opp)

        enriched_input = self._build_review_input(opportunity_id)

        outputs = []

        for focus in DIMENSIONS:
            try:
                raw = self._evaluate_dimension(enriched_input, focus)
            except Exception as e:
                outputs.append(_default_model_output(focus, "evaluator threw: " + str(e)[:80]))
                continue
            parsed = None
            try:
                parsed = _extract_json_lenient(raw, "parse failed")
            except Exception:
                parsed = None
            if parsed is None:
                outputs.append(_default_model_output(focus, "could not parse JSON output"))
                continue
            normalized = _try_normalize_model_output(parsed, focus)
            if normalized is None:
                outputs.append(_default_model_output(focus, "output was not a usable object"))
            else:
                outputs.append(normalized)

        self.model_outputs[opportunity_id] = _json_dumps(outputs)

        consensus = None
        try:
            consensus_raw = self._aggregate_consensus(_json_dumps(outputs), opportunity_id)
            try:
                parsed_consensus = _extract_json_lenient(consensus_raw, "parse failed")
            except Exception:
                parsed_consensus = None
            if parsed_consensus is not None:
                consensus = _try_normalize_consensus(parsed_consensus, opportunity_id)
        except Exception as e:
            consensus = _default_consensus_from_models(opportunity_id, outputs, "aggregator threw: " + str(e)[:80])

        if consensus is None:
            consensus = _default_consensus_from_models(opportunity_id, outputs, "aggregator output unusable")

        self.consensus_outputs[opportunity_id] = _json_dumps(consensus)

        review_number = int(self.review_count) + 1

        review_record = {
            "review_number": review_number,
            "opportunity_id": opportunity_id,
            "model_outputs": outputs,
            "consensus": consensus,
        }

        existing_reviews = self._map_get_or(self.opportunity_reviews, opportunity_id, "[]")
        review_arr = _json_loads(existing_reviews, "corrupt review history")
        _require(isinstance(review_arr, list), "corrupt review history")

        review_arr.append(review_record)
        self.opportunity_reviews[opportunity_id] = _json_dumps(review_arr)

        self.review_count = u256(review_number)

        opp["status"] = "REVIEWED"
        self.opportunities[opportunity_id] = _json_dumps(opp)

    def _build_review_input(self, opportunity_id: str) -> str:
        opp_raw = self._map_get_or(self.opportunities, opportunity_id, "{}")
        updates_raw = self._map_get_or(self.opportunity_updates, opportunity_id, "[]")

        review_input = {
            "opportunity": _json_loads(opp_raw, "corrupt opportunity"),
            "updates": _json_loads(updates_raw, "corrupt updates"),
        }

        return _json_dumps(review_input)

    # ─────────────────────────────────────────────────────────────
    # Non-deterministic GenLayer evaluators
    # ─────────────────────────────────────────────────────────────

    def _evaluate_dimension(self, review_input_json: str, focus: str) -> str:
        def runner() -> str:
            prompt = (
                EVAL_PROMPT
                + "\nDimension focus: "
                + focus
                + "\n"
                + "\nOpportunity and update JSON:\n"
                + review_input_json
                + "\n"
                + """
Return strict JSON only with this exact shape:

{
  "model_id": "string",
  "dimension_focus": "risk | upside | market_fit | team_quality | timing | traction | moat",
  "dimension_scores": {
    "risk": 0,
    "upside": 0,
    "market_fit": 0,
    "team_quality": 0,
    "timing": 0,
    "traction": 0,
    "moat": 0
  },
  "recommendation_hint": "HIGH_CONVICTION | WATCHLIST | SPECULATIVE | AVOID",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "unknowns": ["string"],
  "reasoning": "string",
  "confidence": 0.0
}
"""
            )

            return gl.nondet.exec_prompt(prompt)

        return gl.eq_principle.prompt_comparative(
            runner,
            "Outputs are equivalent if both are valid JSON objects that include all required fields (model_id, dimension_focus, dimension_scores with all seven keys, recommendation_hint, strengths, weaknesses, unknowns, reasoning, confidence). Numeric scores, recommendation hints, and reasoning text need not match between validators. Treat any well-formed output as equivalent."
        )

    def _aggregate_consensus(self, model_json_array: str, opportunity_id: str) -> str:
        def runner() -> str:
            prompt = (
                AGG_PROMPT
                + "\nOpportunity id: "
                + opportunity_id
                + "\n"
                + "\nModel outputs JSON array:\n"
                + model_json_array
                + "\n"
                + """
Return strict JSON only with this exact shape:

{
  "opportunity_id": "string",
  "consensus_score": 0,
  "confidence": 0.0,
  "disagreement_index": 0.0,
  "recommendation_band": "HIGH_CONVICTION | WATCHLIST | SPECULATIVE | AVOID",
  "dimension_scores": {
    "risk": 0,
    "upside": 0,
    "market_fit": 0,
    "team_quality": 0,
    "timing": 0,
    "traction": 0,
    "moat": 0
  },
  "summary": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "unknowns": ["string"],
  "follow_up_questions": ["string"],
  "reasoning": "string"
}
"""
            )

            return gl.nondet.exec_prompt(prompt)

        return gl.eq_principle.prompt_comparative(
            runner,
            "Outputs are equivalent if both are valid JSON objects that include all required fields (opportunity_id, consensus_score, confidence, disagreement_index, recommendation_band, dimension_scores with all seven keys, summary, strengths, weaknesses, unknowns, follow_up_questions, reasoning). Numeric scores, the recommendation band, and reasoning text need not match between validators. Treat any well-formed output as equivalent."
        )

    # ─────────────────────────────────────────────────────────────
    # View functions
    # ─────────────────────────────────────────────────────────────

    @gl.public.view
    def get_opportunity(self, opportunity_id: str) -> str:
        return self._map_get(self.opportunities, opportunity_id)

    @gl.public.view
    def get_opportunity_reviews(self, opportunity_id: str) -> str:
        return self._map_get_or(self.opportunity_reviews, opportunity_id, "[]")

    @gl.public.view
    def get_model_outputs(self, opportunity_id: str) -> str:
        return self._map_get_or(self.model_outputs, opportunity_id, "[]")

    @gl.public.view
    def get_consensus_output(self, opportunity_id: str) -> str:
        return self._map_get(self.consensus_outputs, opportunity_id)

    @gl.public.view
    def get_opportunity_updates(self, opportunity_id: str) -> str:
        return self._map_get_or(self.opportunity_updates, opportunity_id, "[]")

    @gl.public.view
    def get_watch_state(self, watcher: Address, opportunity_id: str) -> str:
        key = str(watcher) + ":" + opportunity_id
        return self._map_get(self.watch_state, key)

    @gl.public.view
    def get_user_opportunities(self, address: Address) -> str:
        return self._map_get_or(self.user_opportunities, str(address), "[]")

    @gl.public.view
    def get_total_opportunities(self) -> u256:
        return self.opportunity_count

    @gl.public.view
    def get_total_reviews(self) -> u256:
        return self.review_count

    @gl.public.view
    def get_total_updates(self) -> u256:
        return self.update_count

    @gl.public.view
    def get_protocol_state(self) -> str:
        return _json_dumps({
            "owner": str(self.owner),
            "opportunity_count": int(self.opportunity_count),
            "review_count": int(self.review_count),
            "update_count": int(self.update_count),
            "dimensions": list(DIMENSIONS),
            "allowed_bands": list(ALLOWED_BANDS),
            "product_type": "decision_support_not_financial_advice",
        })
