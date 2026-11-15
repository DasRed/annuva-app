import {describe, expect, it} from 'vitest';
import computeDashboard from '@/calculation/computeDashboard';
import sampleInput from '../fixture/sampleInput';

const all = {customerId: null, year: null};

describe('computeDashboard', () => {
    it('derives actual years and the plan year', () => {
        const result = computeDashboard(sampleInput, all);
        expect(result.lastActualYear).toBe(2025);
        expect(result.planYear).toBe(2026);
        expect(result.years.map((row) => [row.year, row.plan])).toEqual([[2025, false], [2026, true]]);
    });

    it('counts only issued invoices as revenue', () => {
        const [year2025] = computeDashboard(sampleInput, all).years;
        expect(year2025.revenue).toBe(7_500 + 14_000 + 7_500 + 120_000);
        expect(year2025.expenses).toBe(15_000);
        expect(year2025.result).toBe(149_000 - 15_000);
    });

    it('computes the plan year from recurring charges against all fixed costs', () => {
        const plan = computeDashboard(sampleInput, all).years[1];
        expect(plan.revenue).toBe(6_000 + 1_500 + 6_000 + 3_000 + 5_000 + 6_000 + 1_500);
        expect(plan.expenses).toBe(10_000 + 1_500 + 3_000 + 1_500);
    });

    it('rates customers as in the specification example', () => {
        const customers = computeDashboard(sampleInput, all).customers;
        const muster = customers.find((row) => row.customerId === 'muster')!;
        // server share = 100 / 3 hosting customers = 33.33
        expect(muster.serverShare).toBe(3_333);
        // surplus = 75 − 15 − 33.33 = 26.67
        expect(muster.surplus).toBe(2_667);
        expect(muster.rating).toBe('worth_it');
        expect(customers.find((row) => row.customerId === 'alpha')!.rating).toBe('own_project');
        expect(customers.find((row) => row.customerId === 'verein')!.rating).toBe('closed');
    });

    it('calculates the server coverage', () => {
        // 3 × 60 − 100 = +80
        expect(computeDashboard(sampleInput, all).kpis.serverCoverage).toBe(8_000);
    });

    it('lists invoices to issue as upcoming but never as revenue or cash flow', () => {
        const result = computeDashboard(sampleInput, all);
        expect(result.upcoming.some((item) => item.kind === 'issue_invoice' && item.refId === 'i4')).toBe(true);
        expect(result.kpis.toIssueSum).toBe(20_000);
        expect(result.kpis.toIssueCount).toBe(1);
        expect(result.cashflow.some((month) => month.month === '2026-02' && month.income > 0)).toBe(false);
    });

    it('groups recurring invoices of partner customers by partner', () => {
        const upcoming = computeDashboard(sampleInput, all).upcoming.filter((item) => item.kind === 'recurring_invoice');
        const agency = upcoming.find((item) => item.recipient === 'Agentur Beispiel')!;
        expect(agency.customers).toEqual(['Muster GmbH', 'Beispiel Praxis']);
        expect(agency.amount).toBe(6_000 + 1_500 + 6_000 + 3_000 + 5_000);
    });

    it('does not duplicate renewals that are already planned as costs', () => {
        const renewals = computeDashboard(sampleInput, all).upcoming.filter((item) => item.kind === 'renewal');
        expect(renewals.some((item) => item.refId === 'f1')).toBe(false);
        expect(renewals.find((item) => item.refId === 'f2')!.rebilled).toBe(true);
    });

    it('applies the customer filter to revenue but not to tax', () => {
        const result = computeDashboard(sampleInput, {customerId: 'praxis', year: null});
        expect(result.years[0].revenue).toBe(14_000);
        expect(result.kpis.tax).toBeNull();
        expect(result.tax[0].profit).toBe(134_000);
    });

    it('estimates tax with adjustments and the marginal rate', () => {
        const tax = computeDashboard(sampleInput, all).tax[0];
        expect(tax.taxableProfit).toBe(134_000 + 1_000);
        expect(tax.tax).toBe(Math.round(135_000 * 0.3));
        expect(tax.effectiveYear).toBe(2026);
    });

    it('builds a gapless monthly cash flow with cumulative balance', () => {
        const cashflow = computeDashboard(sampleInput, all).cashflow;
        expect(cashflow[0].month).toBe('2025-01');
        const months = cashflow.map((month) => month.month);
        expect(months).toContain('2025-02');
        expect(cashflow[cashflow.length - 1].balance).toBe(cashflow.reduce((sum, month) => sum + month.income + month.incomePlanned - month.expenses - month.expensesPlanned, 0));
        // the 2025 tax estimate is booked as planned expense in April 2026
        expect(cashflow.find((month) => month.month === '2026-04')!.expensesPlanned).toBeGreaterThanOrEqual(40_500);
    });

    it('builds the expense pivot by category and year', () => {
        const pivot = computeDashboard(sampleInput, all).expensePivot;
        expect(pivot.years).toEqual([2025, 2026]);
        expect(pivot.rows.find((row) => row.category === 'server')!.values).toEqual({2025: 10_000, 2026: 10_000});
        expect(pivot.total).toBe(25_000);
    });

    it('counts resources per customer and sorts tasks with done at the end', () => {
        const result = computeDashboard(sampleInput, all);
        expect(result.resources.counts.find((row) => row.customerId === 'muster')).toMatchObject({container: 1, domain: 1});
        expect(result.tasks[result.tasks.length - 1].status).toBe('done');
        expect(result.kpis.tasksOpen).toBe(1);
        expect(result.kpis.tasksWaiting).toBe(1);
    });
});
