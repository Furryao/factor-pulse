# Investor data updates on GitHub

GitHub Actions checks at 22:00 China time on weekdays, skips exchange holidays,
validates complete observations, then publishes GitHub Pages in the same workflow.
GitHub scheduling can be delayed; it is not an exact-time market feed.

## One-time setup

In this repository, open Settings → Secrets and variables → Actions → New repository secret.
Name: `TUSHARE_TOKEN`. Value: your Tushare Pro token. Do not put it in files,
issues, logs or chat. The token must have access to daily, adj_factor,
daily_basic, stock_st, stk_limit, suspend_d and trade_cal.

Then open Actions → Publish Factor Pulse → Run workflow, choose `refresh`.
The first run replays the last published weekly and monthly observations before
it can publish anything. An unchanged data date still performs this replay when
manually requested. Success is shown in the workflow summary.

## Frozen calculation contract

Only the six existing investor diagnostics are calculated. Definitions,
mainboard code scope, positive-volume/non-ST event-date proxy, observation
minimums, 80/20 cross-sectional groups, equal weights, turnover and 15 bps
one-way costs match the published P1 implementation. The copied
`factor_metrics.py` is the existing metrics implementation, not a new return model.

Feature history begins on 2025-04-29, the same start used for the recent published
P1 release. Inputs are adjusted OHLC and stock-specific rolling observations.
Daily/basic availability assumptions remain 15:30/18:00 China time. Labels
begin at the next official session open and end after the following weekly or
monthly signal. Incomplete periods never enter returns. These are descriptive
research results using an event-date status proxy, not certified executable
strategy returns or exact historical point-in-time data.

Every run validates official SSE/SZSE calendar agreement, market-wide daily and
adjustment coverage, uniqueness, OHLC, positive adjustments, required valuation
and status responses, latest limits/suspensions, >=95% factor coverage and >=200
usable names. The feature/label clock validator runs before metrics. Synthetic
tests enforce future-input isolation and reject invalid clocks. Reconstructed
last published weekly and monthly values must agree within 1e-9 in return units;
any data revision, cohort or formula drift stops publication. Historical output
rows are never rewritten.

Raw responses and stock-specific panels exist only in the ephemeral hosted
runner, with no raw-data cache or uploaded raw-data artifacts in this public
repository. The public run summary contains aggregate coverage and hashes only.
Historical source revisions can therefore require a manual reconciliation.
The token is supplied only to the refresh step through an encrypted GitHub secret
and is sent only to `https://api.tushare.pro`. Request payloads and vendor error
text are never logged. Only investor/data.json is automatically committed.

The scheduled refresh and the existing push-to-Pages flow share a concurrency
group. They deploy the current validated checkout directly, because pushes made
with GITHUB_TOKEN do not trigger another push workflow. An invalid or missing
data response stops the job before any commit or deployment. No desktop, Codex,
connected-app session, personal access token or private raw-data upload is needed.

Sources: [Tushare API](https://tushare.pro/document/1?doc_id=40),
[GitHub secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets),
[GitHub triggers](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).
