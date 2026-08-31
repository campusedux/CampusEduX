import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { RootProvider } from "./RootProvider";
import { Navigation } from "./Navigation";

export default function App() {
  return (
    <RootProvider>
      <StatusBar style="dark" />
      <Navigation />
    </RootProvider>
  );
}
