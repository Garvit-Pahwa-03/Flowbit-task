"use client";
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Custom tooltip to show formatted currency
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-gray-900">{payload[0].payload.range}</p>
        <p className="text-sm text-indigo-600 font-medium">
          €{parseFloat(payload[0].value).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

export function CashflowChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cash-outflow')
      .then(res => res.json())
      .then(d => {
        // Format the data with proper numeric values
        const formattedData = d.map((item: any) => ({
          range: item.range,
          totalAmount: parseFloat(item.totalAmount) || 0,
          displayAmount: `€${parseFloat(item.totalAmount).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        }));
        setData(formattedData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching cash outflow:', err);
        setLoading(false);
      });
  }, []);

  // Calculate max value for better Y-axis scaling
  const maxValue = Math.max(...data.map(d => d.totalAmount), 0);
  const yAxisMax = maxValue > 0 ? Math.ceil(maxValue * 1.2 / 1000) * 1000 : 10000;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Outflow Forecast</CardTitle>
        <CardDescription className='text-[12px]'>Expected payment obligations by due date.</CardDescription>
      </CardHeader>
      <CardContent className="h-[280px] w-full p-4 pt-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : data.length === 0 || data.every(d => d.totalAmount === 0) ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No upcoming payment obligations
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              barCategoryGap="20%"
            >
              <XAxis 
                dataKey="range" 
                stroke="#9ca3af" 
                fontSize={11}
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                stroke="#9ca3af" 
                fontSize={11}
                tickLine={false} 
                axisLine={false}
                domain={[0, yAxisMax]}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                tick={{ fill: '#6b7280' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
              <Bar 
                dataKey="totalAmount" 
                fill="#312e81" 
                name="Amount" 
                radius={[8, 8, 0, 0]}
                maxBarSize={80}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.totalAmount > 0 ? "#312e81" : "#e5e7eb"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}