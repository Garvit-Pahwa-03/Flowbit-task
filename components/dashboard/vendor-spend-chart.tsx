"use client";
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getBaseURL } from '@/lib/utils'; // <-- CHANGE 1: Import the helper function

interface VendorData {
  vendorName: string;
  totalSpend: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg border shadow-lg">
        <p className="font-semibold">{label}</p>
        <p>{`Vendor Spend: €${payload[0].value.toLocaleString()}`}</p>
      </div>
    );
  }
  return null;
};

export function VendorSpendChart() {
  const [data, setData] = useState<VendorData[]>([]);

  useEffect(() => {
    const baseURL = getBaseURL(); // <-- CHANGE 2: Call the function
    fetch(`${baseURL}/api/vendors/top10`)
      .then(res => res.json())
      .then(d => {
        setData(d.map((v: any) => ({
          ...v,
          totalSpend: parseFloat(v.totalSpend)
        })));
      })
      .catch(error => console.error('Error fetching vendor data:', error));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spend by Vendor (Top 10)</CardTitle>
        <CardDescription>Vendor spend with cumulative percentage distribution.</CardDescription>
      </CardHeader>
      <CardContent className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="vendorName"
              width={120}
              stroke="#888888"
              fontSize={8}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
            <Bar
              dataKey="totalSpend"
              fill="#c7d2fe"
              name="Total Spend (€)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
