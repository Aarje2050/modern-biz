'use client'

interface DateRange {
  name: string;
  days: number;
}

interface DateRangePickerProps {
  currentRange: string;
  ranges: Record<string, DateRange>;
  onRangeChange: (range: string) => void;
}

export default function AnalyticsDateRangePicker({ 
  currentRange,
  ranges,
  onRangeChange
}: DateRangePickerProps) {
  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
      {Object.entries(ranges).map(([key, { name }]) => (
        <button
          key={key}
          onClick={() => onRangeChange(key)}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            currentRange === key
              ? 'bg-white shadow text-blue-600'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          {name}
        </button>
      ))}
    </div>
  );
}