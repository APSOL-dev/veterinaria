import React from 'react';

interface PowerBIDateRangeFilterProps {
  minDate: string; // YYYY-MM-DD
  maxDate: string; // YYYY-MM-DD
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onChange: (startDate: string, endDate: string) => void;
  onReset: () => void;
}

export const PowerBIDateRangeFilter: React.FC<PowerBIDateRangeFilterProps> = ({
  minDate,
  maxDate,
  startDate,
  endDate,
  onChange,
  onReset
}) => {
  const minTs = new Date(minDate || '2026-08-01').getTime();
  const maxTs = new Date(maxDate || '2027-02-28').getTime();
  const totalDuration = maxTs - minTs || 1;

  const currentStartTs = new Date(startDate || minDate).getTime();
  const currentEndTs = new Date(endDate || maxDate).getTime();

  const leftPercentage = Math.max(0, Math.min(100, ((currentStartTs - minTs) / totalDuration) * 100));
  const rightPercentage = Math.max(0, Math.min(100, ((currentEndTs - minTs) / totalDuration) * 100));

  const handleStartInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && (!endDate || val <= endDate)) {
      onChange(val, endDate);
    } else if (val) {
      onChange(val, val);
    }
  };

  const handleEndInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && (!startDate || val >= startDate)) {
      onChange(startDate, val);
    } else if (val) {
      onChange(val, val);
    }
  };

  const handleStartSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = Number(e.target.value);
    const targetTs = minTs + (percent / 100) * totalDuration;
    const targetDate = new Date(targetTs).toISOString().split('T')[0];
    if (targetDate <= endDate) {
      onChange(targetDate, endDate);
    }
  };

  const handleEndSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = Number(e.target.value);
    const targetTs = minTs + (percent / 100) * totalDuration;
    const targetDate = new Date(targetTs).toISOString().split('T')[0];
    if (targetDate >= startDate) {
      onChange(startDate, targetDate);
    }
  };

  const isFiltered = startDate !== minDate || endDate !== maxDate;

  return (
    <div className="bg-surface-container-lowest px-3 py-1.5 rounded-xl border border-outline-variant/40 shadow-xs flex items-center gap-2 font-body-md text-xs">
      {/* Invisible Native Input Thumbs to Avoid Duplication with Custom Circles */}
      <style>{`
        .powerbi-range-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: transparent;
          border: none;
          box-shadow: none;
          cursor: pointer;
          pointer-events: auto;
        }
        .powerbi-range-input::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: transparent;
          border: none;
          box-shadow: none;
          cursor: pointer;
          pointer-events: auto;
        }
      `}</style>

      <span className="material-symbols-outlined text-[16px] text-primary" title="Filtro de fecha de proyección">filter_alt</span>
      
      {/* Date Pickers */}
      <div className="flex items-center gap-1">
        <input
          type="date"
          value={startDate}
          min={minDate}
          max={maxDate}
          onChange={handleStartInputChange}
          className="text-[11px] font-mono font-medium text-slate-800 bg-surface-container-low border border-outline-variant/40 rounded-lg px-1.5 py-1 outline-none hover:border-primary transition-all cursor-pointer"
        />
        <span className="text-slate-400 font-bold text-[10px]">-</span>
        <input
          type="date"
          value={endDate}
          min={startDate || minDate}
          max={maxDate}
          onChange={handleEndInputChange}
          className="text-[11px] font-mono font-medium text-slate-800 bg-surface-container-low border border-outline-variant/40 rounded-lg px-1.5 py-1 outline-none hover:border-primary transition-all cursor-pointer"
        />
      </div>

      {/* Dual Range Slider (Único círculo visual en cada punta) */}
      <div className="relative w-32 sm:w-40 h-6 flex items-center select-none px-1">
        {/* Background Track Line */}
        <div className="absolute left-0 w-full h-1.5 bg-slate-300 rounded-full"></div>

        {/* Active Progress Highlight Line */}
        <div
          className="absolute h-1.5 bg-[#8362A5] rounded-full"
          style={{
            left: `${leftPercentage}%`,
            width: `${Math.max(0, rightPercentage - leftPercentage)}%`
          }}
        ></div>

        {/* Unique Left White Circular Handle */}
        <div
          className="absolute w-4 h-4 rounded-full bg-white border-2 border-[#8362A5] shadow-md z-10 transform -translate-x-1/2 pointer-events-none"
          style={{ left: `${leftPercentage}%` }}
        ></div>

        {/* Unique Right White Circular Handle */}
        <div
          className="absolute w-4 h-4 rounded-full bg-white border-2 border-[#8362A5] shadow-md z-10 transform -translate-x-1/2 pointer-events-none"
          style={{ left: `${rightPercentage}%` }}
        ></div>

        {/* Interactive Dual Range Slider Inputs */}
        <input
          type="range"
          min="0"
          max="100"
          value={leftPercentage}
          onChange={handleStartSlider}
          className="powerbi-range-input absolute left-0 w-full h-full appearance-none bg-transparent pointer-events-none cursor-pointer z-20"
        />
        <input
          type="range"
          min="0"
          max="100"
          value={rightPercentage}
          onChange={handleEndSlider}
          className="powerbi-range-input absolute left-0 w-full h-full appearance-none bg-transparent pointer-events-none cursor-pointer z-30"
        />
      </div>

      {/* Reset Filter Button */}
      {isFiltered && (
        <button
          type="button"
          onClick={onReset}
          className="p-1 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-surface-container-high cursor-pointer flex items-center"
          title="Limpiar filtro de fechas"
        >
          <span className="material-symbols-outlined text-[16px]">restart_alt</span>
        </button>
      )}
    </div>
  );
};
