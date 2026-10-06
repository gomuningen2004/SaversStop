import { CalendarDays } from 'lucide-react';

type ForecastMethodologyProps = {
  methodology: string;
};

function ForecastMethodology({ methodology }: ForecastMethodologyProps) {
  return (
    <section className="mt-8">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex gap-3">
          <CalendarDays
            size={18}
            className="mt-0.5 shrink-0 text-slate-500"
          />

          <div>
            <p className="font-medium text-slate-800">Forecast methodology</p>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              {methodology}
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              This is an estimate based on historical behaviour and planned
              goals. It does not predict individual future transactions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ForecastMethodology;
