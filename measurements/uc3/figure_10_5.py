"""Figure 10-5: Cross-scenario comparison for StudyFlow UC.3 (Chapter 10).
(a) expected duration contribution by action group, from Table 10-1
(b) completion-time distribution, re-sampled from the Table 10-1 distributions
Run: python figure_10_5.py   -> writes fig10_5.png
"""
import numpy as np
import matplotlib.pyplot as plt

N = 100_000
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 12})


def sample(seed, alternative):
    rng = np.random.default_rng(seed)
    E = lambda lam: rng.exponential(1 / lam, N)      # Exp(rate in 1/s)
    Nm = lambda m, s: rng.normal(m, s, N)            # N(mean s, sd s)
    t = (E(0.2) + Nm(1, .1) + E(0.0167)              # UC.3.1, 3.2, 3.3
         + Nm(2, .2) + Nm(1, .1) + Nm(3, .3) + Nm(1, .1)   # UC.3.6-3.9
         + E(0.05) + E(1 / 3) + Nm(1, .1))           # UC.3.10, 3.11, 3.12
    if alternative:
        t += Nm(2, .2)                               # UC.3.A1 validate
    else:
        t += Nm(1, .1) + E(0.0333)                   # UC.3.4, 3.5
    return t


base, alt = sample(5151, False), sample(99, True)
for name, v in [('Baseline', base), ('Alternative', alt)]:
    print(f'{name}: mean {v.mean():.1f} s, sd {v.std():.1f} s, '
          f'p50 {np.percentile(v, 50):.0f} s, p90 {np.percentile(v, 90):.0f} s')
print(f'P(alternative < baseline) = {(alt < base).mean():.2f}')

fig, (a1, a2) = plt.subplots(1, 2, figsize=(13, 4.9), gridspec_kw={'width_ratios': [1.15, 1]})
C = {'task': '#15392D', 'avail': '#7FA88F', 'rev': '#C9DDB0', 'sys': '#E8A060'}
K = {'task': 'Task / combined entry (UC.3.3)', 'avail': 'Availability entry (UC.3.5, baseline only)',
     'rev': 'Initiate, review, confirm (student)', 'sys': 'System actions (incl. UC.3.A1 in alt.)'}
rows = [('Alternative', [(60, 'task'), (28, 'rev'), (11, 'sys')], 1.64),
        ('Baseline', [(60, 'task'), (30, 'avail'), (28, 'rev'), (10, 'sys')], 2.11)]
seen = set()
for y, (nm, parts, mean) in enumerate(rows):
    x = 0
    for v, c in parts:
        a1.barh(y, v, left=x, color=C[c], edgecolor='white', height=0.55,
                label=K[c] if c not in seen else None)
        seen.add(c)
        if v >= 20:
            a1.text(x + v / 2, y, f'{v} s', ha='center', va='center',
                    color='white' if c == 'task' else '#172A22', fontsize=11, fontweight='bold')
        else:
            a1.text(x + v / 2, y + 0.38, f'{v} s', ha='center', va='center',
                    color='#9A4E17', fontsize=10.5, fontweight='bold')
        x += v
    a1.text(x + 4, y, f'{x} s expected\nInnoslate mean {mean:.2f} min', va='center', fontsize=10.5)
a1.set_yticks([0, 1]); a1.set_yticklabels(['Alternative', 'Baseline'], fontsize=12, fontweight='bold')
a1.set_xlim(0, 180); a1.set_ylim(-0.5, 1.6)
a1.set_xlabel('Expected duration contribution (s), from Table 10-1')
a1.set_title('(a) Where the completion time comes from', loc='left', fontsize=12.5,
             fontweight='bold', color='#15392D')
a1.legend(loc='upper center', bbox_to_anchor=(0.5, -0.2), ncol=2, frameon=False, fontsize=10)

bins = np.arange(0, 420, 10)
a2.hist(base, bins=bins, density=True, alpha=0.55, color='#7FA88F', label='Baseline')
a2.hist(alt, bins=bins, density=True, alpha=0.55, color='#E8A060', label='Alternative')
for v, c in [(base, '#2E6B4E'), (alt, '#B4602A')]:
    for q, ls in [(50, '-'), (90, '--')]:
        a2.axvline(np.percentile(v, q), color=c, ls=ls, lw=1.6)
a2.text(0.98, 0.60, 'solid = median\ndashed = 90th percentile\n'
        f'Baseline: {np.percentile(base,50):.0f} s / {np.percentile(base,90):.0f} s\n'
        f'Alternative: {np.percentile(alt,50):.0f} s / {np.percentile(alt,90):.0f} s',
        transform=a2.transAxes, ha='right', va='top', fontsize=10.5,
        bbox=dict(boxstyle='round,pad=0.4', fc='#EEF4EC', ec='#AFCAB7'))
a2.set_xlabel('Completion time (s)'); a2.set_ylabel('Density'); a2.set_xlim(0, 420)
a2.set_title('(b) Distribution of completion time (re-sampled)', loc='left', fontsize=12.5,
             fontweight='bold', color='#15392D')
a2.legend(loc='upper right', frameon=False)
for ax in (a1, a2):
    for s in ('top', 'right'):
        ax.spines[s].set_visible(False)
plt.tight_layout()
plt.savefig('fig10_5.png', dpi=200)
print('saved fig10_5.png')
