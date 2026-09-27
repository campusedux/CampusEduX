import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { RootProvider } from "./RootProvider";
import { Navigation } from "./Navigation";
import { ForceUpdateGate } from "@/components/ForceUpdateGate";

export default function App() {
  return (
    <RootProvider>
      <StatusBar style="dark" />
      <ForceUpdateGate>
        <Navigation />
      </ForceUpdateGate>
    </RootProvider>
  );
}
