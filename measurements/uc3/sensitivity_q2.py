"""Section 10.5.2 Q2: sensitivity of the UC.3 comparison to the student-action distribution.
Same Table 10-1 means; student actions drawn either as Exponential (as in Innoslate)
or as Lognormal with coefficient of variation 0.5. System actions stay N(mu, 0.1*mu).
Run: python sensitivity_q2.py"""
import numpy as np

N = 100_000

def session(seed, alternative, dist):
    g = np.random.default_rng(seed)
    def student(mean):                      # mean in seconds
        if dist == 'exponential':
            return g.exponential(mean, N)
        s2 = np.log(1 + 0.5 ** 2)           # lognormal with CV = 0.5
        return g.lognormal(np.log(mean) - s2 / 2, np.sqrt(s2), N)
    system = lambda m: g.normal(m, 0.1 * m, N)
    t = (student(5) + system(1) + student(60)             # UC.3.1, 3.2, 3.3
         + system(2) + system(1) + system(3) + system(1)  # UC.3.6-3.9
         + student(20) + student(3) + system(1))          # UC.3.10, 3.11, 3.12
    t += system(2) if alternative else system(1) + student(30)   # UC.3.A1 | UC.3.4 + 3.5
    return t

for dist in ('exponential', 'lognormal'):
    b, a = session(1, False, dist), session(2, True, dist)
    print(f'{dist:12s} baseline mean {b.mean():5.1f} s  sd {b.std():4.1f} s  p90 {np.percentile(b, 90):5.1f} s | '
          f'alternative mean {a.mean():5.1f} s  sd {a.std():4.1f} s  p90 {np.percentile(a, 90):5.1f} s | '
          f'P(alt < base) = {(a < b).mean():.2f}')
print(f'P(task entry < 10 s) under Exp(0.0167) = {1 - np.exp(-10 / 60):.2f}')
print(f'P(availability entry < 10 s) under Exp(0.0333) = {1 - np.exp(-10 / 30):.2f}')
