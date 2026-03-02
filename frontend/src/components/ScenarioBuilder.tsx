"use client";

import { useState } from "react";
import {
  fetchPiti,
  fetchAffordability,
  fetchAmortization,
  fetchExplain,
  type LoanTerms,
  type PitiResponse,
  type AffordabilityResponse,
  type AmortizationResponse,
  type ExplainResponse,
} from "@/lib/api";

const defaultTerms: LoanTerms = {
  home_value: 350000,
  down_payment: 70000,
  annual_rate_pct: 6.5,
  term_years: 30,
  annual_property_tax_pct: 1.2,
  annual_insurance_pct: 0.35,
  hoa_monthly: 0,
  maintenance_monthly_pct: 0.5,
  monthly_take_home_income: 6500,
  other_monthly_needs: 800,
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ScenarioBuilder() {
  const [terms, setTerms] = useState<LoanTerms>(defaultTerms);
  const [piti, setPiti] = useState<PitiResponse | null>(null);
  const [affordability, setAffordability] = useState<AffordabilityResponse | null>(null);
  const [amortization, setAmortization] = useState<AmortizationResponse | null>(null);
  const [explain, setExplain] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const pitiRes = await fetchPiti(terms);
      const [affRes, amortRes] = await Promise.all([
        fetchAffordability(
          pitiRes.total_monthly,
          terms.monthly_take_home_income,
          terms.other_monthly_needs ?? 0
        ),
        fetchAmortization(terms, 60),
      ]);
      const explainRes = await fetchExplain(
        affRes.monthly_income,
        affRes.monthly_housing,
        affRes.is_affordable,
        affRes.housing_pct_of_income,
        affRes.needs_budget_50,
        affRes.remaining_needs_after_housing,
      );
      setPiti(pitiRes);
      setAffordability(affRes);
      setAmortization(amortRes);
      setExplain(explainRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <h1 className="text-2xl font-semibold text-zinc-900">HomePilot – Scenario</h1>

      <form onSubmit={handleSubmit} className="grid gap-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Home value ($)</span>
            <input
              type="number"
              min="1"
              step="1000"
              value={terms.home_value}
              onChange={(e) => setTerms({ ...terms, home_value: Number(e.target.value) })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Down payment ($)</span>
            <input
              type="number"
              min="0"
              step="1000"
              value={terms.down_payment}
              onChange={(e) => setTerms({ ...terms, down_payment: Number(e.target.value) })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Interest rate (%)</span>
            <input
              type="number"
              min="0"
              step="0.125"
              value={terms.annual_rate_pct}
              onChange={(e) => setTerms({ ...terms, annual_rate_pct: Number(e.target.value) })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Term (years)</span>
            <input
              type="number"
              min="1"
              max="30"
              value={terms.term_years}
              onChange={(e) => setTerms({ ...terms, term_years: Number(e.target.value) })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Property tax (%/year)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={terms.annual_property_tax_pct}
              onChange={(e) => setTerms({ ...terms, annual_property_tax_pct: Number(e.target.value) })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Insurance (%/year)</span>
            <input
              type="number"
              min="0"
              step="0.05"
              value={terms.annual_insurance_pct}
              onChange={(e) => setTerms({ ...terms, annual_insurance_pct: Number(e.target.value) })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">HOA ($/month)</span>
            <input
              type="number"
              min="0"
              value={terms.hoa_monthly ?? 0}
              onChange={(e) => setTerms({ ...terms, hoa_monthly: Number(e.target.value) })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Maintenance (%/year)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={terms.maintenance_monthly_pct ?? 0.5}
              onChange={(e) => setTerms({ ...terms, maintenance_monthly_pct: Number(e.target.value) })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Monthly take-home ($)</span>
            <input
              type="number"
              min="1"
              value={terms.monthly_take_home_income}
              onChange={(e) => setTerms({ ...terms, monthly_take_home_income: Number(e.target.value) })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Other monthly needs ($)</span>
            <input
              type="number"
              min="0"
              value={terms.other_monthly_needs ?? 0}
              onChange={(e) => setTerms({ ...terms, other_monthly_needs: Number(e.target.value) })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Calculating…" : "Calculate"}
        </button>
      </form>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>
      )}

      {piti && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Monthly housing cost</h2>
          <ul className="space-y-1 text-zinc-700">
            <li>Principal & interest: {formatMoney(piti.principal_and_interest)}</li>
            <li>Property tax: {formatMoney(piti.property_tax_monthly)}</li>
            <li>Insurance: {formatMoney(piti.insurance_monthly)}</li>
            <li>PMI: {formatMoney(piti.pmi_monthly)}</li>
            <li>HOA: {formatMoney(piti.hoa_monthly)}</li>
            <li>Maintenance: {formatMoney(piti.maintenance_monthly)}</li>
            <li className="border-t border-zinc-200 pt-2 font-medium">Total: {formatMoney(piti.total_monthly)}</li>
          </ul>
        </section>
      )}

      {affordability && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">50/30/20 affordability</h2>
          <p className={affordability.is_affordable ? "text-green-700" : "text-amber-700"}>
            {affordability.message}
          </p>
          <ul className="mt-3 space-y-1 text-zinc-700">
            <li>Needs (50%): {formatMoney(affordability.needs_budget_50)}</li>
            <li>Wants (30%): {formatMoney(affordability.wants_budget_30)}</li>
            <li>Savings (20%): {formatMoney(affordability.savings_budget_20)}</li>
            <li>Housing is {affordability.housing_pct_of_income.toFixed(1)}% of income</li>
          </ul>
        </section>
      )}

      {explain && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">AI summary</h2>
          <p className="text-zinc-700">{explain.narrative}</p>
          {explain.suggestions.length > 0 && (
            <ul className="mt-3 list-inside list-disc space-y-1 text-zinc-600">
              {explain.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {amortization && amortization.schedule.length > 0 && (
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <h2 className="border-b border-zinc-200 p-4 text-lg font-semibold text-zinc-900">
            Amortization (first 60 months)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 text-left text-zinc-600">
                  <th className="p-2">Month</th>
                  <th className="p-2">Payment</th>
                  <th className="p-2">Principal</th>
                  <th className="p-2">Interest</th>
                  <th className="p-2">Balance</th>
                </tr>
              </thead>
              <tbody>
                {amortization.schedule.slice(0, 60).map((row) => (
                  <tr key={row.month} className="border-t border-zinc-100">
                    <td className="p-2">{row.month}</td>
                    <td className="p-2">{formatMoney(row.payment)}</td>
                    <td className="p-2">{formatMoney(row.principal)}</td>
                    <td className="p-2">{formatMoney(row.interest)}</td>
                    <td className="p-2">{formatMoney(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
