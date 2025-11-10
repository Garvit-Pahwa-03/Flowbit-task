"use client";

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// A larger, more vibrant color palette to ensure each category gets a unique color
const COLORS = [
  '#4338ca', '#f97316', '#fbbf24', '#10b981', '#3b82f6', 
  '#ec4899', '#8b5cf6', '#f43f5e', '#6366f1', '#d946ef'
];

interface CategoryData {
  category: string;
  totalSpend: string;
}

export function CategorySpendChart() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/category-spend')
      .then(res => res.json())
      .then((apiData: CategoryData[]) => {
        // We no longer need to map names. We just parse the value.
        const formattedData = apiData.map(item => ({
          name: item.category, // Use the real category name from the API
          value: parseFloat(item.totalSpend),
        }));
        setData(formattedData);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Loading Categories...</CardTitle></CardHeader>
        <CardContent className="h-[260px] animate-pulse bg-gray-100 rounded-md" />
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spend by Category</CardTitle>
        <CardDescription className='text-[12px]'>Distribution of spending across different categories.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Chart Area */}
        <div className="h-[160px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                dataKey="value"
                nameKey="name" // Use the real name for tooltips
                innerRadius={60}
                outerRadius={75}
                paddingAngle={5}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `€${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Legend with Scrollbar */}
        <div className="mt-4 max-h-[80px] overflow-y-auto pr-2">
          <div className="space-y-2">
            {data.map((item, index) => (
              <div key={item.name} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-semibold">
                  €{item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}