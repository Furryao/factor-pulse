"""Cloud-only refresh of six research diagnostics; no executable strategy claims.

Raw vendor responses stay in the ephemeral runner. Only aggregate results are
committed. Fail closed on missing data, historical drift, or incomplete labels.
"""
import argparse
import copy
import hashlib
import json
import os
import threading
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd
from factor_metrics import validate_and_prepare, compute_period_metrics

IDS = ('reversal_5d', 'momentum_20d', 'exposure_size_log_total_mv',
       'value_ep_ttm', 'lowvol_20d', 'volume_momentum_5_20')
START = '20250429'  # Exact start of the published P1 feature history.
FIELDS = {
    'daily': 'ts_code,trade_date,open,high,low,close,pre_close,vol,amount',
    'adj_factor': 'ts_code,trade_date,adj_factor',
    'daily_basic': 'ts_code,trade_date,total_mv,pe_ttm',
    'stock_st': 'ts_code,trade_date,type',
    'stk_limit': 'ts_code,trade_date,up_limit,down_limit',
    'suspend_d': 'ts_code,trade_date,suspend_timing,suspend_type',
    'trade_cal': 'exchange,cal_date,is_open,pretrade_date',
}


class DataError(RuntimeError):
    pass


def require(condition, message):
    if not condition:
        raise DataError(message)


class Client:
    def __init__(self, token):
        require(bool(token), 'Configure the TUSHARE_TOKEN repository secret first.')
        self.token, self.cache, self.receipts = token, {}, []
        self.lock, self.last_request = threading.Lock(), 0.0

    def get(self, api, **params):
        key = (api, json.dumps(params, sort_keys=True))
        if key in self.cache:
            return self.cache[key].copy()
        payload = json.dumps({'api_name': api, 'token': self.token,
                              'params': params, 'fields': FIELDS[api]}).encode()
        for attempt in range(4):
            with self.lock:
                time.sleep(max(0, 0.65 - (time.monotonic() - self.last_request)))
                self.last_request = time.monotonic()
            try:
                req = urllib.request.Request('https://api.tushare.pro', data=payload,
                                             headers={'Content-Type': 'application/json'})
                with urllib.request.urlopen(req, timeout=60) as response:
                    raw = response.read()
                decoded = json.loads(raw)
                # Never echo request bodies, credentials, or vendor error messages.
                require(decoded.get('code') == 0, f'{api}: vendor returned code {decoded.get("code")}')
                data = decoded['data']
                frame = pd.DataFrame(data['items'], columns=data['fields'])
                self.cache[key] = frame
                self.receipts.append({'api': api, 'params': params, 'rows': len(frame),
                                      'response_sha256': hashlib.sha256(raw).hexdigest()})
                return frame.copy()
            except DataError:
                raise
            except Exception:
                if attempt == 3:
                    raise DataError(f'{api}: request failed after retries') from None
                time.sleep(2 ** attempt)


def mainboard(code):
    if len(code) != 9 or not code[:6].isdigit():
        return False
    if code.endswith('.SH'):
        return code[:3] in {'600', '601', '603', '605'}
    return code.endswith('.SZ') and (1 <= int(code[:6]) <= 999 or 1200 <= int(code[:6]) <= 4999)


def check(frame, api, day, empty=False):
    require(empty or len(frame) > 0, f'{api}/{day}: empty response')
    require(len(frame) < (6000 if api in {'daily', 'daily_basic', 'adj_factor'} else 5800 if api == 'stk_limit' else 1000),
            f'{api}/{day}: response may be truncated')
    if frame.empty:
        return
    require(set(FIELDS[api].split(',')).issubset(frame.columns), f'{api}: missing columns')
    require(frame.trade_date.astype(str).eq(day).all(), f'{api}: wrong partition date')
    key = ['ts_code', 'trade_date']
    if api == 'stock_st':
        key += ['type']
    if api == 'suspend_d':
        key += ['suspend_timing', 'suspend_type']
    require(not frame.duplicated(key).any(), f'{api}: duplicate keys')


def clocks(sessions, mode):
    dates = pd.DatetimeIndex(pd.to_datetime(sessions))
    freq = 'W-FRI' if mode == 'weekly' else 'M'
    signals = pd.Series(dates, index=dates).groupby(dates.to_period(freq)).max().tolist()
    out = []
    for signal, following in zip(signals, signals[1:]):
        starts, ends = dates[dates > signal], dates[dates > following]
        if len(starts) and len(ends):
            out.append({'signal': str(signal.date()), 'start': str(starts[0].date()), 'end': str(ends[0].date())})
    return out


def features(raw):
    f = raw.copy().sort_values(['ts_code', 'trade_date']).reset_index(drop=True)
    g = f.groupby('ts_code', sort=False)
    f['count'] = g.cumcount() + 1
    f['adj_close'] = f.close * f.adj_factor
    f['adj_open'] = f.open * f.adj_factor
    f['ret'] = g.adj_close.pct_change(fill_method=None)
    f['reversal_5d'] = -(f.adj_close / g.adj_close.shift(5) - 1)
    f['momentum_20d'] = f.adj_close / g.adj_close.shift(20) - 1
    f['lowvol_20d'] = -g.ret.transform(lambda v: v.rolling(20, min_periods=20).std())
    f['volume_momentum_5_20'] = g.vol.transform(lambda v: v.rolling(5, min_periods=5).mean()) / g.vol.transform(lambda v: v.rolling(20, min_periods=20).mean()) - 1
    return f


def panel(f, clock, basic, st):
    signal, start, end = (clock[k] for k in ('signal', 'start', 'end'))
    require(signal < start < end, 'invalid observation clock')
    s = f.loc[f.trade_date.eq(signal.replace('-', ''))].copy()
    s = s.merge(basic[['ts_code', 'total_mv', 'pe_ttm']], on='ts_code', how='left', validate='one_to_one')
    s['exposure_size_log_total_mv'] = -np.log(s.total_mv.where(s.total_mv > 0))
    s['value_ep_ttm'] = 1 / s.pe_ttm.where(s.pe_ttm > 0)
    universe = s.ts_code.map(mainboard) & s.vol.gt(0) & ~s.ts_code.isin(set(st.ts_code))
    prices = f.set_index(['trade_date', 'ts_code']).adj_open
    begin = prices.loc[start.replace('-', '')]
    finish = prices.loc[end.replace('-', '')]
    forward = s.ts_code.map(finish) / s.ts_code.map(begin) - 1
    rows = []
    for fid in IDS:
        minimum = 6 if fid == 'reversal_5d' else 20 if fid == 'volume_momentum_5_20' else 1 if fid in IDS[2:4] else 21
        eligible = universe & s['count'].ge(minimum)
        if fid == 'value_ep_ttm':
            eligible &= s.pe_ttm.gt(0)
        rows.append(pd.DataFrame({'factor_id': fid, 'variant': 'raw', 'symbol': s.ts_code,
            'signal_session': signal, 'score': s[fid], 'eligible': eligible,
            'score_available_at': signal + ('T18:00:00+08:00' if fid in IDS[2:4] else 'T15:30:00+08:00'),
            'data_cutoff_ts': signal + 'T18:00:00+08:00', 'forward_return': forward,
            'return_start_session': start, 'return_end_session': end,
            'return_available_at': end + 'T15:30:00+08:00',
            'factor_data_state': np.where(s[fid].notna(), 'KNOWN', 'UNKNOWN_INPUT')}))
    return pd.concat(rows, ignore_index=True).loc[lambda x: x.symbol.map(mainboard)]


def refresh(old, client, now, verify=False):
    require(now.tzinfo is not None, 'timezone required')
    now = now.astimezone(ZoneInfo('Asia/Shanghai'))
    cutoff = now.date() if now.hour >= 19 else now.date() - timedelta(days=1)
    future = (now.date() + timedelta(days=100)).strftime('%Y%m%d')
    calendars = [client.get('trade_cal', exchange=exchange, start_date=START, end_date=future) for exchange in ('SSE', 'SZSE')]
    opened = [sorted(c.loc[c.is_open.astype(int).eq(1), 'cal_date'].astype(str)) for c in calendars]
    require(opened[0] == opened[1] and len(opened[0]) == len(set(opened[0])), 'exchange calendar mismatch/duplicates')
    sessions = opened[0]
    today = max(d for d in sessions if d <= cutoff.strftime('%Y%m%d'))
    asof = str(pd.Timestamp(today).date())
    require(asof >= old['asOf'], 'source calendar is behind published data')
    if asof == old['asOf'] and not verify:
        return copy.deepcopy(old), {'status': 'unchanged', 'asOf': asof}
    selected, pending = {}, {}
    for mode in ('weekly', 'monthly'):
        all_clocks = clocks(sessions, mode)
        complete = [c for c in all_clocks if c['end'] <= asof]
        boundary = old['modes'][mode]['end']
        anchor = next(i for i, c in enumerate(complete) if c['signal'] == boundary)
        require(anchor > 0, 'missing turnover anchor')
        selected[mode] = complete[anchor - 1:]
        pending[mode] = [c for c in all_clocks if c['signal'] <= asof < c['end']]
    days = [d for d in sessions if d <= today]
    print(f'Checking {len(days)} official sessions through {asof}', flush=True)

    def market(day):
        daily, adj = client.get('daily', trade_date=day), client.get('adj_factor', trade_date=day)
        check(daily, 'daily', day); check(adj, 'adj_factor', day)
        require(len(daily) >= 4500, f'daily/{day}: market-wide coverage unexpectedly low')
        require(set(daily.ts_code) <= set(adj.ts_code), 'missing adjustment factors')
        require(daily[['open', 'high', 'low', 'close']].gt(0).all().all(), 'nonpositive OHLC')
        require(daily.high.ge(daily[['open', 'close', 'low']].max(axis=1)).all() and daily.low.le(daily[['open', 'close', 'high']].min(axis=1)).all(), 'invalid OHLC')
        require(adj.adj_factor.gt(0).all(), 'invalid adjustment factor')
        return daily.merge(adj, on=['ts_code', 'trade_date'], validate='one_to_one')

    with ThreadPoolExecutor(max_workers=4) as pool:
        raw = pd.concat(list(pool.map(market, days)), ignore_index=True)
    require(not raw.duplicated(['ts_code', 'trade_date']).any(), 'duplicate market rows')
    print('Market history passed coverage checks; checking valuation and status data', flush=True)
    signals = sorted({c['signal'].replace('-', '') for rows in selected.values() for c in rows} | {today})
    basics, sts = {}, {}
    for day in signals:
        basic, st = client.get('daily_basic', trade_date=day), client.get('stock_st', trade_date=day)
        check(basic, 'daily_basic', day); check(st, 'stock_st', day)
        require(set(raw.loc[raw.trade_date.eq(day), 'ts_code']) <= set(basic.ts_code), 'missing daily basic rows')
        basics[day], sts[day] = basic, st
    limits, suspension = client.get('stk_limit', trade_date=today), client.get('suspend_d', trade_date=today)
    check(limits, 'stk_limit', today); check(suspension, 'suspend_d', today, empty=True)
    require(set(raw.loc[raw.trade_date.eq(today), 'ts_code']) <= set(limits.ts_code), 'latest limits incomplete')
    f = features(raw)
    print('Replaying published observations and checking completed new periods', flush=True)
    result, evidence = copy.deepcopy(old), {}
    for mode, observation_clocks in selected.items():
        p = pd.concat([panel(f, c, basics[c['signal'].replace('-', '')], sts[c['signal'].replace('-', '')]) for c in observation_clocks], ignore_index=True)
        prepared, excluded, coverage = validate_and_prepare(p)
        require(coverage.coverage.ge(.95).all() and coverage.usable_count.ge(200).all(), 'factor coverage gate failed')
        metrics = compute_period_metrics(prepared, 15.0, coverage)
        metrics['date'] = pd.to_datetime(metrics.signal_session).dt.strftime('%Y-%m-%d')
        boundary = old['modes'][mode]['end']
        for fid in IDS:
            reference = metrics.loc[metrics.factor_id.eq(fid) & metrics.date.eq(boundary)]
            require(len(reference) == 1, 'missing published-period replay')
            expected = old['modes'][mode]['factors'][fid]['periods'][-1]['spread']
            require(abs(float(reference.iloc[0].net_spread) - expected) <= 1e-9,
                    f'{mode}/{fid}: historical replay differs; manual review required')
            additions = metrics.loc[metrics.factor_id.eq(fid) & metrics.date.gt(boundary)]
            target = result['modes'][mode]['factors'][fid]
            target['periods'] += [{'date': r.date, 'spread': float(r.net_spread)} for r in additions.itertuples()]
            original = old['modes'][mode]['factors'][fid]['periods']
            require(target['periods'][:len(original)] == original, 'historical prefix changed')
            tail = target['periods'][-result['modes'][mode]['window']:]
            target['mean'] = sum(r['spread'] for r in tail) / len(tail)
            target['positive'] = sum(r['spread'] > 0 for r in tail)
        result['modes'][mode]['end'] = observation_clocks[-1]['signal']
        result['modes'][mode]['settledThrough'] = observation_clocks[-1]['end']
        evidence[mode] = {'min_coverage': float(coverage.coverage.min()), 'min_names': int(coverage.usable_count.min()), 'historical_replay': 'PASS', 'excluded': excluded}
    receipts_hash = hashlib.sha256(json.dumps(client.receipts, sort_keys=True).encode()).hexdigest()
    if asof > old['asOf']:
        result.update({'asOf': asof, 'updatedAt': now.isoformat(), 'pending': pending,
                       'sourceSha256': receipts_hash,
                       'refreshPolicy': 'GitHub 云端每个交易日北京时间 22:00 检查，校验通过后发布'})
    else:
        result = copy.deepcopy(old)  # Verification never rewrites an existing release.
    summary = {'status': 'PASS', 'asOf': asof, 'new_release': asof > old['asOf'], 'modes': evidence,
               'requests': len(client.receipts), 'receipts_sha256': receipts_hash,
               'raw_data_published': False, 'historical_prefix_unchanged': True}
    return result, summary


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--data', type=Path, default=Path('investor/data.json'))
    p.add_argument('--verify', action='store_true')
    args = p.parse_args()
    old = json.loads(args.data.read_text())
    result, summary = refresh(old, Client(os.environ.get('TUSHARE_TOKEN', '')), datetime.now(ZoneInfo('Asia/Shanghai')), args.verify)
    output = json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + '\n'
    if result != old:
        tmp = args.data.with_suffix('.tmp')
        tmp.write_text(output)
        tmp.replace(args.data)
    Path('refresh-summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as stream:
            stream.write('## Investor refresh\n\n```json\n' + json.dumps(summary, ensure_ascii=False, indent=2) + '\n```\n')
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == '__main__':
    try:
        main()
    except DataError as exc:
        raise SystemExit(str(exc))
