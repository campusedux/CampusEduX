import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface CircularProgressProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
}

/**
 * Circular progress ring used across Placement Prep dashboards (Aptitude
 * mastery ring, Test Result score, Performance Analysis, DSA/HR/Company
 * dashboards) so the visual language stays consistent everywhere.
 */
export function CircularProgress({
  percent,
  size = 96,
  strokeWidth = 9,
  color = "#4F39F6",
  trackColor = "#E5E7EB",
  label,
  sublabel,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </Svg>
      <Text className="font-bold text-gray-900" style={{ fontSize: size * 0.22 }}>
        {label ?? `${Math.round(clamped)}%`}
      </Text>
      {sublabel && <Text className="text-gray-400" style={{ fontSize: size * 0.09 }}>{sublabel}</Text>}
    </View>
  );
}
