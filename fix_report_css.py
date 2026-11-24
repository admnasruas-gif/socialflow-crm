from pathlib import Path
p = Path(r"styles.css")
lines = p.read_text(encoding="utf-8").splitlines(keepends=True)
start = next(i for i,l in enumerate(lines) if l.startswith(".executive-report-document {"))
end = next(i for i,l in enumerate(lines) if l.startswith(".empty-state {"))
new_css = r'''
.executive-report-document {
  color: var(--text);
  background: var(--surface);
  font-size: 14px;
  line-height: 1.5;
}

.executive-report-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 0 0 16px;
  border-bottom: 1px solid var(--border);
}

.executive-report-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.executive-report-logo {
  width: 44px;
  height: 44px;
  object-fit: contain;
  flex: 0 0 auto;
  border-radius: var(--radius-field);
  background: var(--surface-secondary);
  padding: 4px;
}

.executive-report-eyebrow {
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.executive-report-hero h2 {
  margin: 4px 0 4px;
  font-size: 24px;
  line-height: 1.15;
  letter-spacing: -.025em;
  font-weight: 700;
}

.executive-report-hero p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.45;
}

.executive-report-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: right;
}

.executive-report-meta strong {
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
}

.executive-report-accent {
  height: 4px;
  border-radius: 999px;
  background: var(--brand-gradient);
  margin: 16px 0 20px;
}

.executive-report-scope {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  margin-bottom: 20px;
  background: var(--surface-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-field);
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.executive-report-scope strong {
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
}

.executive-report-scope b {
  color: var(--text);
  font-weight: 600;
}

.executive-report-section {
  margin: 0 0 24px;
}

.executive-report-section-heading {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
}

.executive-report-section-heading > span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  border-radius: 8px;
  background: var(--surface-subtle);
  color: var(--text);
  font-size: 11px;
  font-weight: 700;
}

.executive-report-section-heading h3 {
  margin: 0;
  font-size: 16px;
  line-height: 1.25;
  font-weight: 600;
}

.executive-report-section-heading p {
  margin: 3px 0 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.executive-report-kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--surface);
  overflow: hidden;
  margin-bottom: 10px;
}

.executive-report-kpis > div {
  padding: 16px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  position: relative;
}

.executive-report-kpis > div:last-child {
  border-right: 0;
}

.executive-report-kpis > div::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--brand-gradient);
}

.executive-report-kpis span,
.executive-report-kpis small {
  display: block;
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 1.35;
}

.executive-report-kpis strong {
  display: block;
  margin: 6px 0 4px;
  font-size: 22px;
  line-height: 1.2;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.executive-report-kpi-detail {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.executive-report-kpi-detail > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-field);
  background: var(--surface-secondary);
}

.executive-report-kpi-detail span {
  color: var(--text-secondary);
  font-size: 11px;
}

.executive-report-kpi-detail strong {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.executive-report-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.executive-report-panel {
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: 16px;
  background: var(--surface);
}

.executive-report-panel-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.executive-report-panel-title h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.executive-report-panel-title span {
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
}

.executive-report-note {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.executive-finance-lines {
  display: grid;
  gap: 0;
}

.executive-finance-lines div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  padding: 9px 0;
  border-bottom: 1px solid var(--border);
}

.executive-finance-lines div:last-child {
  border-bottom: 0;
}

.executive-finance-lines span {
  color: var(--text-secondary);
}

.executive-finance-lines strong {
  color: var(--text);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.executive-report-contract-types {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.executive-report-contract-types > div {
  display: grid;
  gap: 6px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--surface);
}

.executive-report-contract-types strong {
  font-size: 14px;
  font-weight: 600;
}

.executive-report-contract-types span {
  color: var(--text-secondary);
  font-size: 12px;
}

.executive-report-contract-types b {
  color: var(--text);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
}

.executive-recommended-list {
  display: grid;
  gap: 10px;
}

.executive-recommended-item {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--surface);
}

.executive-recommended-item::before {
  content: "";
  width: 4px;
  border-radius: 999px;
  background: var(--brand-gradient);
  flex: 0 0 auto;
}

.executive-recommended-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.executive-recommended-text strong {
  font-size: 13px;
  font-weight: 600;
}

.executive-recommended-text span {
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.executive-recommended-action {
  flex: 0 0 auto;
  white-space: nowrap;
}

.executive-recommended-empty {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 4px 2px;
}

.executive-recommended-empty strong {
  font-size: 13px;
  font-weight: 600;
}

.executive-recommended-empty span {
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.executive-attention-list {
  display: grid;
  gap: 0;
}

.executive-attention-list div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  padding: 9px 0;
  border-bottom: 1px solid var(--border);
}

.executive-attention-list div:last-child {
  border-bottom: 0;
}

.executive-attention-list strong {
  font-weight: 600;
}

.executive-attention-list span {
  color: var(--text-secondary);
}

.executive-report-ranking {
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  overflow: hidden;
  background: var(--surface);
}

.executive-report-ranking table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.executive-report-ranking thead {
  background: var(--surface-secondary);
}

.executive-report-ranking th {
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}

.executive-report-ranking th:not(:first-child),
.executive-report-ranking td:not(:first-child) {
  text-align: right;
}

.executive-report-ranking td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
  line-height: 1.35;
}

.executive-report-ranking tbody tr:last-child td {
  border-bottom: 0;
}

.executive-report-ranking td:first-child {
  min-width: 150px;
  text-align: left;
  font-weight: 600;
}

.executive-report-ranking-cards {
  display: none;
}

.executive-ranking-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: 14px;
  background: var(--surface);
}

.executive-ranking-card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.executive-ranking-card-head strong {
  font-size: 13px;
  font-weight: 600;
}

.executive-ranking-card-head span {
  color: var(--text-secondary);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
  text-align: right;
}

.executive-ranking-card-agreement {
  margin: 3px 0 10px;
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 1.4;
}

.executive-ranking-card dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 10px;
  margin: 0;
}

.executive-ranking-card dl > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
}

.executive-ranking-card dt {
  color: var(--text-secondary);
  font-size: 11px;
}

.executive-ranking-card dd {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.executive-report-criteria ul {
  display: grid;
  gap: 6px;
  margin: 0;
  padding-left: 18px;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.executive-report-criteria li::marker {
  color: var(--brand-yellow);
}

.executive-report-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  border-top: 1px solid var(--border);
  padding-top: 12px;
  color: var(--text-secondary);
  font-size: 11px;
}

.executive-report-footer strong {
  color: var(--text);
  font-weight: 600;
}
'''
p.write_text(''.join(lines[:start]) + new_css + ''.join(lines[end:]), encoding="utf-8")
print("done")
