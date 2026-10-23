import sys
import unittest
from pathlib import Path
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from refresh_investor import DataError, check, clocks, features, panel, IDS
from factor_metrics import validate_and_prepare


class CloudIntegrity(unittest.TestCase):
    def market(self):
        days = pd.bdate_range('2026-01-01', periods=50).strftime('%Y%m%d')
        return pd.DataFrame([{'ts_code': code, 'trade_date': day, 'open': 10+i*.1,
            'close': 10+i*.1+(j % 3)*.01, 'adj_factor': 1., 'vol': 100+i*j}
            for j, code in enumerate(('600000.SH', '000001.SZ', '300001.SZ'))
            for i, day in enumerate(days)])

    def test_future_perturbation(self):
        raw = self.market()
        cutoff = sorted(raw.trade_date.unique())[30]
        before = features(raw).loc[lambda x: x.trade_date <= cutoff].reset_index(drop=True)
        changed = raw.copy()
        changed.loc[changed.trade_date > cutoff, ['open', 'close', 'vol', 'adj_factor']] *= 7
        after = features(changed).loc[lambda x: x.trade_date <= cutoff].reset_index(drop=True)
        pd.testing.assert_frame_equal(before, after)

    def test_holiday_and_next_session_clock(self):
        sessions = ['20260924','20260928','20260929','20260930','20261008','20261009','20261012','20261016','20261019','20261023','20261026']
        weekly = clocks(sessions, 'weekly')
        row = next(c for c in weekly if c['signal'] == '2026-09-30')
        self.assertEqual(row, {'signal':'2026-09-30','start':'2026-10-08','end':'2026-10-12'})
        self.assertNotIn('2026-10-16', [c['signal'] for c in weekly if c['end'] <= '2026-10-23'])

    def test_gate_rejects_future_feature_and_same_day_label(self):
        f = features(self.market())
        days = sorted(f.trade_date.unique())
        clock = dict(zip(('signal','start','end'), [str(pd.Timestamp(days[i]).date()) for i in (30,31,36)]))
        basic = pd.DataFrame({'ts_code':['600000.SH','000001.SZ','300001.SZ'],'total_mv':[10.,20.,30.],'pe_ttm':[10.,20.,30.]})
        p = panel(f, clock, basic, pd.DataFrame({'ts_code':[]}))
        self.assertEqual(set(p.factor_id), set(IDS))
        self.assertFalse(p.symbol.str.startswith('300').any())
        validate_and_prepare(p)
        p.loc[0,'score_available_at'] = clock['end']+'T18:00:00+08:00'
        with self.assertRaisesRegex(ValueError, 'future_feature'):
            validate_and_prepare(p)
        p.loc[0,'score_available_at'] = p.loc[0,'data_cutoff_ts']
        p.loc[0,'return_start_session'] = clock['signal']
        with self.assertRaisesRegex(ValueError, 'label_starts'):
            validate_and_prepare(p)

    def test_missing_and_truncated_responses_fail(self):
        with self.assertRaises(DataError):
            check(pd.DataFrame(), 'daily_basic', '20261023')
        with self.assertRaises(DataError):
            check(pd.DataFrame(index=range(6000)), 'daily', '20261023')

if __name__ == '__main__':
    unittest.main()
