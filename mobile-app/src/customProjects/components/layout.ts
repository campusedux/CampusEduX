import { useWindowDimensions } from "react-native";

/** At/above this width the builder shows the sticky summary column and the full step list. */
export const WIDE_BREAKPOINT = 900;

export function useIsWide(): boolean {
  return useWindowDimensions().width >= WIDE_BREAKPOINT;
}
