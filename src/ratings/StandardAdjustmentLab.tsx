"use client";

import { useMemo, useState } from "react";
import { calculateStandardAdjustment } from "./standard-adjustment";

export function StandardAdjustmentLab() {
  const [preRating, setPreRating] = useState("1200");
  const [netPoints, setNetPoints] = useState("65");
  const [twentyPointWinsCount, setTwentyPointWinsCount] = useState("1");

  const result = useMemo(() => {
    return calculateStandardAdjustment({
      preRating: Number(preRating) || 0,
      netPoints: Number(netPoints) || 0,
      twentyPointWinsCount: Number(twentyPointWinsCount) || 0,
    });
  }, [preRating, netPoints, twentyPointWinsCount]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-950">
        3. Standard Adjustment Tester
      </h2>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Pre-Rating
          </span>
          <input
            value={preRating}
            onChange={(event) => setPreRating(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Net Points
          </span>
          <input
            value={netPoints}
            onChange={(event) => setNetPoints(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            20+ Point Wins Count
          </span>
          <input
            value={twentyPointWinsCount}
            onChange={(event) => setTwentyPointWinsCount(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
          />
        </label>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-100 p-6">
        <p className="text-lg font-bold text-slate-950">
          Qualifies: {result.qualifies ? "Yes" : "No"}
        </p>

        <p className="mt-4 text-lg text-slate-950">
          <span className="font-bold">Adjusted Rating:</span>{" "}
          {result.adjustedRating}
        </p>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          {result.reason}
        </p>
      </div>
    </section>
  );
}
