"use client";
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getBaseURL } from '@/lib/utils'; // <-- CHANGE 1: Import the helper function

interface TrendData { labels: string[]; invoiceCounts: number[]; totalSpends: number[]; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white p-4 rounded-lg border shadow-lg">
        <p className="font-bold">{label}</p>
        <p className="text-indigo-600">{`Invoice Count : ${payload[0].value}`}</p>
        <p className="text-indigo-400">{`Total Spend : €${payload[1].value.toLocaleString()}`}</p>
      </div>
    );
  }
  return null;
};

export function InvoiceTrendChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const baseURL = getBaseURL(); // <-- CHANGE 2: Call the function
    fetch(`${baseURL}/api/invoice-trends`).then(res => res.json()).then((d: TrendData) => {
      setData(d.labels.map((label, i) => ({
        name: new Date(label + '-02').toLocaleString('default', { month: 'short' }),
        "Invoice Count": d.invoiceCounts[i], "Total Spend": d.totalSpends[i],
      })));
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Volume + Value Trend</CardTitle>
        <CardDescription>Invoice count and total spend over the last 12 months.</CardDescription>
      </CardHeader>
      <CardContent className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="Invoice Count" stroke="#4338ca" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="Total Spend" stroke="#a5b4fc" strokeWidth={3} dot={false} activeDot={{ r: 6 }}/>
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
