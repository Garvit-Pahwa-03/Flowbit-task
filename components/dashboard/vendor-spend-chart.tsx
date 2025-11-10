"use client";
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const CustomTooltip = ({ active, payload, label }: any) => {
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
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/vendors/top10').then(res => res.json()).then(d => {
      setData(d.map(v => ({...v, totalSpend: parseFloat(v.totalSpend)})));
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spend by Vendor (Top 10)</CardTitle>
        <CardDescription>Vendor spend with cumulative percentage distribution.</CardDescription>
      </CardHeader>
      <CardContent className="h-[280px] w-full"> {/* <-- REDUCED HEIGHT */}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="vendorName" width={120} stroke="#888888" fontSize={8} tickLine={false} axisLine={false} />
            <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
            <Bar dataKey="totalSpend" fill="#c7d2fe" name="Total Spend (€)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
