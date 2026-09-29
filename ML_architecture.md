# Deep Implementation Steps — ML Model Architecture

Matches the architecture: **Input (cargo size + O-D) → Vessel Optimization + Freight Forecasting → combined with Risk Mitigation → fused into final output: Correct Time to Enter the Market, Freight Rates, Port O-D info, Risk flags.**

---

## MODEL 1 — Freight Forecasting

### Step 1: Data ingestion
- Load real Baltic Dry Index (BDI) sub-indices: BCI (Capesize), BPI (Panamax), BSI (Supramax), BHSI (Handysize)
- Load commodity price series (coal, iron ore) with matching date range
- Align all series onto a common daily/weekly date index — outer join, forward-fill small gaps, flag longer gaps rather than silently filling them

### Step 2: Exploratory analysis (do this before modeling)
- Plot each vessel-class index over time — visually confirm seasonality, volatility clusters, any structural breaks (e.g., 2020 COVID disruption, 2021 supply shock)
- Run seasonal decomposition (trend/seasonal/residual) using `statsmodels.tsa.seasonal_decompose` or Prophet's built-in decomposition
- Compute basic stationarity check (Augmented Dickey-Fuller test) — freight rates are typically non-stationary, this confirms whether you need differencing for ARIMA-family models

### Step 3: Feature engineering
- Lag features: rate at t-1, t-7, t-30
- Rolling statistics: 7-day and 30-day moving average, rolling volatility (std dev)
- Rate of change: percentage change over 7/30 days (this becomes your "trend direction" signal)
- Seasonal indicators: month, quarter, day-of-week
- Commodity price lag features (coal/iron ore lagged 7-30 days, since commodity demand typically leads freight demand)

### Step 4: Baseline model — Prophet
- Fit Prophet separately per vessel class (4 models: Capesize, Panamax, Supramax, Handysize)
- Use `add_seasonality` for any domain-known cycles beyond Prophet's defaults
- Generate forecast with built-in uncertainty intervals (`yhat_lower`, `yhat_upper`) — this gives you the confidence band for free

### Step 5: Comparison model — LightGBM
- Frame as supervised regression: features = Step 3 engineered features at time t, target = rate at t+H (H = 30/60/90)
- Train separate models per horizon (a 30-day model and a 90-day model are not the same problem)
- Use time-based train/validation split (never random split — this leaks future information into training)

### Step 6: Backtesting (mandatory before trusting either model)
- Walk-forward validation: train on data up to month N, predict month N+1, slide forward, repeat
- Compute MAPE and RMSE per fold, average across folds
- Compare Prophet vs. LightGBM — pick whichever has lower average error; if close, prefer Prophet for interpretability

### Step 7: Market entry signal computation
- Compute: `entry_signal = (forecasted_rate_next_30d - trailing_90d_avg) / trailing_90d_avg`
- If significantly negative (beyond one standard deviation below recent average) → flag as favorable entry window
- Attach the confidence interval width as a "certainty" indicator — wider interval = less confident signal, surface this rather than hide it

### Step 8: Output contract
```
{
  "vessel_type": "Supramax",
  "route": "Indonesia-Paradip",
  "forecast_30d": [...],
  "confidence_interval": [...],
  "entry_signal": "favorable" | "neutral" | "unfavorable",
  "signal_strength": 0.0-1.0
}
```

---

## MODEL 2 — Vessel-Cargo Optimization

### Step 1: Build the real port constraint table
Columns: `port_name, max_draft_m, max_loa_m, max_beam_m, cargo_handling_rate_tons_per_day, berth_count`
Populate with real figures for all 7 East Coast ports.

### Step 2: Build the vessel class specification table
Columns: `vessel_type, typical_draft_m, typical_loa_m, typical_beam_m, capacity_tons_min, capacity_tons_max`
(Standard industry figures for Handysize/Supramax/Panamax/Capesize — well-documented, public.)

### Step 3: Hard constraint filter function
```
def filter_feasible_vessels(cargo_size, destination_port):
    port = get_port_constraints(destination_port)
    feasible = []
    for vessel in vessel_classes:
        if vessel.typical_draft_m <= port.max_draft_m
           and vessel.typical_loa_m <= port.max_loa_m
           and vessel.capacity_tons_min <= cargo_size <= vessel.capacity_tons_max:
            feasible.append(vessel)
    return feasible
```
This must run before any scoring — never rank a vessel that physically cannot use the port.

### Step 4: Turnaround time estimation
```
turnaround_days = cargo_size / port.cargo_handling_rate_tons_per_day
```
Add a berth-availability buffer factor if you have congestion data from Model 3.

### Step 5: Cost-per-ton scoring
For each feasible vessel:
```
cost_per_ton = (forecasted_rate_from_model_1 * voyage_days) / cargo_size
score = weighted_combination(cost_per_ton, turnaround_days, idle_time_risk)
```
Weight cost-per-ton most heavily; turnaround/idle time as secondary factors. Keep weights as named, adjustable constants.

### Step 6: Rank and output
Sort feasible vessels by score ascending (lower cost-per-ton = better), return ranked list with the scoring breakdown per vessel.

### Step 7: Output contract
```
{
  "feasible_vessels": [
    {"vessel_type": "Supramax", "cost_per_ton": ..., "turnaround_days": ..., "rank": 1},
    {"vessel_type": "Handysize", "cost_per_ton": ..., "turnaround_days": ..., "rank": 2}
  ],
  "excluded_vessels": [
    {"vessel_type": "Capesize", "reason": "exceeds max draft at Paradip"}
  ]
}
```
Including *excluded* vessels with reasons is free explainability content.

---

## MODEL 3 — Risk Mitigation (cyclone, traffic congestion, port constraint)

### Sub-model 3a: Cyclone Alert (rule-based calendar, not ML)
1. Load real IMD historical cyclone track data for the Bay of Bengal
2. Aggregate by month: count of cyclone events historically per calendar month, per affected coastal region
3. Build a lookup: `month -> historical_cyclone_frequency -> risk_level (low/medium/high)`
4. Given a planned voyage window, check overlap with high-risk months for the relevant destination port's coastal region
5. Output: `{"cyclone_risk": "high", "historical_basis": "6 of last 10 years had cyclone activity in this window near Paradip"}`

### Sub-model 3b: Traffic/Port Congestion
1. If AIS API access available: pull vessel density near target port over recent days, compute a congestion index (vessels waiting vs. berth capacity)
2. If no AIS access: use real IPA monthly throughput data as a proxy
3. Output: `{"congestion_risk": "medium", "data_source": "AIS live" | "IPA historical proxy"}` — always label the data source, since this affects how much weight the user should give it

### Sub-model 3c: Port Constraint Rerouting
1. If cyclone or congestion risk is flagged "high" for the primary destination port
2. Query Model 2's port constraint table for alternate ports that can also handle the same vessel type and cargo size
3. Compute the tradeoff: additional sailing distance/time to the alternate port vs. the primary
4. Output a ranked rerouting suggestion only if a genuinely feasible alternate exists

### Combined Output Contract for Model 3
```
{
  "cyclone_risk": {...},
  "congestion_risk": {...},
  "rerouting_suggestion": {
    "alternate_port": "Gopalpur",
    "additional_distance_nm": 120,
    "recommended": true
  }
}
```

---

## MODEL 4 — Backhaul Matcher + Explainable AI

### Step 1: Build the real export commodity reference table
Columns: `port_name, export_commodity, typical_volume_range_tons, typical_destination_region`
Populate with real data (e.g., Paradip -> iron ore pellets -> Australia/China-bound routes).

### Step 2: Matching function
```
def find_backhaul_match(destination_port, vessel_type, arrival_window, origin_region):
    exports = get_exports(destination_port)
    matches = []
    for export in exports:
        if export.typical_destination_region == origin_region
           and vessel_can_carry(vessel_type, export.typical_volume_range_tons):
            matches.append(export)
    return matches
```

### Step 3: Revenue offset estimate
```
estimated_revenue = export_volume * reverse_route_freight_rate_from_model_1
```
Pull the reverse-route rate from Model 1's output if that route/vessel-class combination exists in your data; otherwise state clearly this is a rough estimate based on comparable routes.

### Step 4: Explainability generation (the "Explainable AI" part)
This is NOT a separate trained model — it's a constrained text-generation step over Steps 1-3's actual outputs.

```
prompt = f"""
Using ONLY these facts, write a 2-sentence explanation for why this backhaul match was suggested.
Do not add any numbers or claims not listed below.

Facts:
- Destination port: {destination_port}
- Available export: {export.commodity}, {export.volume} tons
- Return region alignment: {origin_region}
- Estimated revenue offset: {estimated_revenue}
"""
```
Send this to your LLM API. The explainability is genuine because the underlying matching criteria are transparent and inspectable — the LLM only translates structured facts into prose, it doesn't make the decision.

### Step 5: Output contract
```
{
  "backhaul_match": {
    "commodity": "Iron ore pellets",
    "volume_tons": 45000,
    "estimated_revenue_offset": "...",
    "explanation": "<generated text>"
  }
}
```

---

## FINAL FUSION LAYER — "Correct Time to Enter the Market"

This is the converging arrow in your diagram — combine Models 1, 2, and 3's outputs into one decision.

### Step 1: Define the fusion logic
```
def compute_final_recommendation(forecast, optimization, risk):
    if forecast.entry_signal == "favorable" and risk.cyclone_risk != "high" and risk.congestion_risk != "high":
        verdict = "Good time to charter now"
    elif risk.cyclone_risk == "high" or risk.congestion_risk == "high":
        verdict = "Delay or reroute - risk factors present"
    elif forecast.entry_signal == "unfavorable":
        verdict = "Wait - rates trending unfavorable"
    else:
        verdict = "Neutral - acceptable but not optimal window"
    return verdict
```
Start with clear if/else rules over your three validated models' outputs rather than a fourth black-box model — easier to build and easier to defend to a judge.

### Step 2: Final combined output contract
```
{
  "verdict": "Good time to charter now",
  "recommended_vessel": {...from Model 2...},
  "freight_forecast": {...from Model 1...},
  "risk_flags": {...from Model 3...},
  "backhaul_opportunity": {...from Model 4, if applicable...},
  "explanation": "<LLM-generated summary combining all of the above>"
}
```

### Step 3: Final explainability pass
Generate one top-level natural-language summary (separate from Model 4's backhaul-specific explanation) walking through the fusion logic — e.g., "We recommend chartering now because rates are trending 12% below average and no significant cyclone or congestion risk was detected for Paradip in this window." This is the single sentence a logistics manager will read first.

---

## Build/test order recap
1. Model 1 (Freight Forecasting) — must work and backtest correctly first
2. Model 2 (Vessel Optimization) — needs Model 1's output as an input
3. Model 3 (Risk Mitigation) — independent, can be built in parallel with 1-2
4. Fusion layer — needs 1, 2, 3 all producing valid output
5. Model 4 (Backhaul Matcher) — build last, plugs into the fusion output as an additional panel