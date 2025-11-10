"use client";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  subtitle?: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  showGraph?: boolean; // optional prop
}

// Base dummy data
const BASE_DATA = [
  { v: 15 },
  { v: 10 },
  { v: 50 },
  { v: 30 },
  { v: 80 },
  { v: 65 },
  { v: 90 },
];

export function StatCard({
  title,
  subtitle,
  value,
  change,
  isPositive,
  showGraph = true,
}: StatCardProps) {
  const changeColor = isPositive ? "text-green-600" : "text-red-600";
  const chartColor = isPositive ? "#10b981" : "#f43f5e";

  // ✅ Make the red (negative) graph decreasing
  const DUMMY_DATA = isPositive
    ? BASE_DATA
    : [...BASE_DATA].reverse(); // reverse data for downward trend

  return (
    <Card>
      <CardContent className="px-4">
        <div className="flex items-start justify-between">
          {/* Left side */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1">
              <p className="text-xs font-small text-gray-500">{title}</p>
            </div>
            <p className="text-lg font-bold">{value}</p>
            <p className={`text-xs ${changeColor}`}>{change}</p>
          </div>

          {/* Right side */}
          <div className="w-1/4 h-18 flex flex-col">
            <div className="h-[10px] flex items-center justify-center">
              {subtitle && (
                <p className="text-[8px] text-center text-gray-400">{subtitle}</p>
              )}
            </div>

            {/* Graph container */}
            <div className="flex-1">
              {showGraph ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={DUMMY_DATA}>
                    <defs>
                      <linearGradient
                        id={`color-${isPositive}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={chartColor}
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor={chartColor}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={chartColor}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill={`url(#color-${isPositive})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
