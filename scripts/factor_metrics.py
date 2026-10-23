from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Iterable

import numpy as np
import pandas as pd


REQUIRED_COLUMNS = {
    "factor_id",
    "variant",
    "symbol",
    "signal_session",
    "score",
    "score_available_at",
    "data_cutoff_ts",
    "eligible",
    "forward_return",
    "return_start_session",
    "return_end_session",
    "return_available_at",
    "factor_data_state",
}


@dataclass(frozen=True)
class EvaluationResult:
    period_metrics: pd.DataFrame
    window_metrics: pd.DataFrame
    exclusions: dict[str, int]


def _explicit_bool(series: pd.Series) -> pd.Series:
    mapping = {
        True: True,
        False: False,
        1: True,
        0: False,
        "1": True,
        "0": False,
        "true": True,
        "false": False,
        "TRUE": True,
        "FALSE": False,
    }
    parsed = series.map(mapping)
    if parsed.isna().any():
        raise ValueError("eligible_contains_non_explicit_boolean")
    return parsed.astype(bool)


def validate_and_prepare(
    panel: pd.DataFrame,
) -> tuple[pd.DataFrame, dict[str, int], pd.DataFrame]:
    missing = sorted(REQUIRED_COLUMNS - set(panel.columns))
    if missing:
        raise ValueError(f"missing_columns:{','.join(missing)}")

    work = panel.copy()
    work["eligible"] = _explicit_bool(work["eligible"])
    work["signal_session"] = pd.to_datetime(work["signal_session"], errors="raise")
    work["return_start_session"] = pd.to_datetime(work["return_start_session"], errors="raise")
    work["return_end_session"] = pd.to_datetime(work["return_end_session"], errors="raise")
    work["score_available_at"] = pd.to_datetime(work["score_available_at"], utc=True, errors="raise")
    work["data_cutoff_ts"] = pd.to_datetime(work["data_cutoff_ts"], utc=True, errors="raise")
    work["return_available_at"] = pd.to_datetime(work["return_available_at"], utc=True, errors="raise")
    work["score"] = pd.to_numeric(work["score"], errors="coerce")
    work["forward_return"] = pd.to_numeric(work["forward_return"], errors="coerce")

    if (work["score_available_at"] > work["data_cutoff_ts"]).any():
        raise ValueError("future_feature_available_after_cutoff")
    if (work["return_start_session"] <= work["signal_session"]).any():
        raise ValueError("label_starts_on_or_before_signal_session")
    if (work["return_end_session"] < work["return_start_session"]).any():
        raise ValueError("label_end_before_start")
    end_utc = work["return_end_session"].dt.tz_localize("Asia/Shanghai").dt.tz_convert("UTC")
    if (work["return_available_at"] < end_utc).any():
        raise ValueError("return_marked_available_before_label_end")

    duplicate_key = ["factor_id", "variant", "symbol", "signal_session"]
    if work.duplicated(duplicate_key).any():
        raise ValueError("duplicate_factor_symbol_session")

    exclusions = {
        "ineligible": int((~work["eligible"]).sum()),
        "unknown_factor_state": int((work["factor_data_state"] != "KNOWN").sum()),
        "missing_score": int(work["score"].isna().sum()),
        "missing_forward_return": int(work["forward_return"].isna().sum()),
    }
    usable = (
        work["eligible"]
        & work["factor_data_state"].eq("KNOWN")
        & work["score"].notna()
        & work["forward_return"].notna()
    )
    coverage_source = work.assign(_usable=usable)
    coverage = (
        coverage_source.loc[coverage_source["eligible"]]
        .groupby(["factor_id", "variant", "signal_session"], sort=True)
        .agg(eligible_count=("symbol", "size"), usable_count=("_usable", "sum"))
        .reset_index()
    )
    coverage["coverage"] = coverage["usable_count"] / coverage["eligible_count"]
    return work.loc[usable].copy(), exclusions, coverage


def _pearson(left: pd.Series, right: pd.Series) -> float:
    if len(left) < 3 or left.nunique() < 2 or right.nunique() < 2:
        return float("nan")
    return float(left.corr(right, method="pearson"))


def _rank_ic(left: pd.Series, right: pd.Series) -> float:
    if len(left) < 3 or left.nunique() < 2 or right.nunique() < 2:
        return float("nan")
    # Rank first, then use Pearson correlation so the monitor does not require
    # scipy merely to compute Spearman Rank IC.
    return float(left.rank(method="average").corr(right.rank(method="average"), method="pearson"))


def _membership_weights(frame: pd.DataFrame, top: bool) -> dict[str, float]:
    pct = frame["score"].rank(method="first", pct=True)
    selected = frame.loc[pct >= 0.8 if top else pct <= 0.2, "symbol"].astype(str)
    if selected.empty:
        return {}
    weight = 1.0 / len(selected)
    return {symbol: weight for symbol in selected}


def _turnover(current: dict[str, float], previous: dict[str, float]) -> float:
    names = set(current) | set(previous)
    if not previous:
        return float("nan")
    return 0.5 * sum(abs(current.get(name, 0.0) - previous.get(name, 0.0)) for name in names)


def compute_period_metrics(
    panel: pd.DataFrame,
    one_way_cost_bps: float,
    coverage: pd.DataFrame | None = None,
) -> pd.DataFrame:
    records: list[dict[str, float | int | str | pd.Timestamp]] = []
    for (factor_id, variant), group in panel.groupby(["factor_id", "variant"], sort=True):
        previous_top: dict[str, float] = {}
        previous_bottom: dict[str, float] = {}
        for session, cross in group.groupby("signal_session", sort=True):
            ranks = cross["score"].rank(method="first", pct=True)
            top = cross.loc[ranks >= 0.8]
            bottom = cross.loc[ranks <= 0.2]
            top_weights = _membership_weights(cross, top=True)
            bottom_weights = _membership_weights(cross, top=False)
            top_turnover = _turnover(top_weights, previous_top)
            bottom_turnover = _turnover(bottom_weights, previous_bottom)
            turnover = float(np.nanmean([top_turnover, bottom_turnover])) if previous_top else 0.0
            gross_spread = float(top["forward_return"].mean() - bottom["forward_return"].mean())
            cost = turnover * one_way_cost_bps / 10000.0 * 2.0
            records.append(
                {
                    "factor_id": factor_id,
                    "variant": variant,
                    "signal_session": session,
                    "n": int(len(cross)),
                    "pearson_ic": _pearson(cross["score"], cross["forward_return"]),
                    "rank_ic": _rank_ic(cross["score"], cross["forward_return"]),
                    "gross_spread": gross_spread,
                    "turnover": turnover,
                    "cost_proxy": cost,
                    "net_spread": gross_spread - cost,
                    "top_return": float(top["forward_return"].mean()),
                    "bottom_return": float(bottom["forward_return"].mean()),
                }
            )
            previous_top = top_weights
            previous_bottom = bottom_weights
    result = pd.DataFrame.from_records(records)
    if coverage is not None and not result.empty:
        result = result.merge(
            coverage[["factor_id", "variant", "signal_session", "eligible_count", "coverage"]],
            on=["factor_id", "variant", "signal_session"],
            how="left",
            validate="one_to_one",
        )
    elif not result.empty:
        result["eligible_count"] = result["n"]
        result["coverage"] = 1.0
    return result


def _normal_two_sided_p(t_stat: float) -> float:
    if not math.isfinite(t_stat):
        return 1.0
    return math.erfc(abs(t_stat) / math.sqrt(2.0))


def _window_record(
    factor_id: str,
    variant: str,
    frame: pd.DataFrame,
    window: int,
    periods_per_year: int,
) -> dict[str, float | int | str]:
    sample = frame.tail(window)
    n = len(sample)
    rank_ic_mean = float(sample["rank_ic"].mean())
    rank_ic_std = float(sample["rank_ic"].std(ddof=1))
    net_mean = float(sample["net_spread"].mean())
    net_std = float(sample["net_spread"].std(ddof=1))
    t_stat = net_mean / (net_std / math.sqrt(n)) if n >= 2 and net_std > 0 else float("nan")
    return {
        "factor_id": factor_id,
        "variant": variant,
        "window_periods": window,
        "observations": n,
        "rank_ic_mean": rank_ic_mean,
        "pearson_ic_mean": float(sample["pearson_ic"].mean()),
        "rank_ic_ir": rank_ic_mean / rank_ic_std * math.sqrt(periods_per_year)
        if rank_ic_std > 0
        else float("nan"),
        "gross_spread_mean": float(sample["gross_spread"].mean()),
        "net_spread_mean": net_mean,
        "net_spread_sum": float(sample["net_spread"].sum()),
        "net_spread_t_stat": t_stat,
        "p_value": _normal_two_sided_p(t_stat),
        "hit_rate": float((sample["net_spread"] > 0).mean()),
        "turnover_mean": float(sample["turnover"].mean()),
        "coverage_mean": float(sample["coverage"].mean()),
        "coverage_names_mean": float(sample["n"].mean()),
        "latest_signal_session": str(sample["signal_session"].max().date()),
    }


def benjamini_hochberg(values: Iterable[float]) -> list[float]:
    p = np.asarray(list(values), dtype=float)
    if len(p) == 0:
        return []
    order = np.argsort(p)
    ranked = p[order]
    adjusted = ranked * len(p) / np.arange(1, len(p) + 1)
    adjusted = np.minimum.accumulate(adjusted[::-1])[::-1]
    adjusted = np.clip(adjusted, 0.0, 1.0)
    result = np.empty_like(adjusted)
    result[order] = adjusted
    return result.tolist()


def aggregate_windows(
    period_metrics: pd.DataFrame,
    windows: list[int],
    periods_per_year: int,
) -> pd.DataFrame:
    records: list[dict[str, float | int | str]] = []
    for (factor_id, variant), frame in period_metrics.groupby(["factor_id", "variant"], sort=True):
        frame = frame.sort_values("signal_session")
        for window in windows:
            records.append(_window_record(factor_id, variant, frame, window, periods_per_year))
    result = pd.DataFrame.from_records(records)
    if result.empty:
        return result
    result["q_value"] = 1.0
    for (_, window), index in result.groupby(["variant", "window_periods"]).groups.items():
        result.loc[index, "q_value"] = benjamini_hochberg(result.loc[index, "p_value"])
    return result


def evaluate_panel(panel: pd.DataFrame, mode_spec: dict, one_way_cost_bps: float) -> EvaluationResult:
    prepared, exclusions, coverage = validate_and_prepare(panel)
    period = compute_period_metrics(prepared, one_way_cost_bps, coverage)
    windows = aggregate_windows(
        period,
        list(mode_spec["windows_periods"]),
        int(mode_spec["periods_per_year"]),
    )
    return EvaluationResult(period, windows, exclusions)
