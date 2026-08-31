/* Test double for `@expo/vector-icons`.
 *
 * The real package eagerly loads `expo-font`'s native module, which throws
 * "__fbBatchedBridgeConfig is not set" under plain react-test-renderer. Wired in
 * via jest.config.js -> moduleNameMapper so UI components render in tests.
 */
import React from "react";
import { Text } from "react-native";

type IconProps = { name?: string; testID?: string };

const Icon = ({ name, ...rest }: IconProps) =>
  React.createElement(Text, rest, name ?? "");
Icon.displayName = "MockIcon";

export const Ionicons = Icon;
export const MaterialIcons = Icon;
export const MaterialCommunityIcons = Icon;
export const FontAwesome = Icon;
export const FontAwesome5 = Icon;
export const AntDesign = Icon;
export const Entypo = Icon;
export const Feather = Icon;
export const EvilIcons = Icon;
export const Foundation = Icon;
export const Octicons = Icon;
export const SimpleLineIcons = Icon;
export const Zocial = Icon;
export const createIconSet = () => Icon;
export const createIconSetFromFontello = () => Icon;
export const createIconSetFromIcoMoon = () => Icon;

export default {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome,
  FontAwesome5,
  AntDesign,
  Entypo,
  Feather,
  createIconSet,
};
