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

// Add type definition for vendor data
interface VendorData {
  vendorName: string;
  totalSpend: number | string;
}

export function VendorSpendChart() {
  const [data, setData] = useState<VendorData[]>([]);

  useEffect(() => {
    fetch('/api/vendors/top10')
      .then(res => res.json())
      .then((vendorData: VendorData[]) => {
        // Reverse data so the highest value is at the top of the chart
        const reversedData = vendorData.reverse();
        setData(reversedData.map((v: VendorData) => ({ ...v, totalSpend: parseFloat(v.totalSpend as string) })));
      });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spend by Vendor (Top 10)</CardTitle>
        <CardDescription>Vendor spend with cumulative percentage distribution.</CardDescription>
      </CardHeader>
      <CardContent className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="vertical" 
            // 1. INCREASE LEFT MARGIN: Make space for the wider labels
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="vendorName" 
              // 2. INCREASE Y-AXIS WIDTH: Give the text more room to render
              width={150} 
              stroke="#888888" 
              // 3. INCREASE FONT SIZE: Make text more readable like in Figma
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              // The default 'textAnchor="end"' property right-aligns the text for us.
            />
            <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
            <Bar dataKey="totalSpend" fill="#c7d2fe" name="Total Spend (€)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
