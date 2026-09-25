import React, { useState } from "react";
import { notify } from "@/lib/notify";
import {
  Linking,
  Platform,
  Pressable,
  Text as RNText,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type TextProps,
  type TextStyle,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { FONT_FAMILY, type FontKey } from "@/theme/typography";
import { useLearningFonts } from "@/theme/fonts";
import { whatsappUrl } from "@/constants/contact";
import { Image, type ImageSource } from "expo-image";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const C = {
  heading: "#0F172A",
  body: "#475569",
  purple: "#6D28D9",
  indigo: "#4F46E5",
  border: "#E2E8F0",
  pill: "#EDE9FE",
  green: "#16A34A",
} as const;

const MAX_FONT_MULTIPLIER = 1.3;

/** Drop the file at assets/images/banner-illustration.png and swap in:
 *  require("../../assets/images/banner-illustration.png") */
const ILLUSTRATION: ImageSource | null = null;

type Mode = "row" | "phone";
const modeFor = (w: number): Mode => (w >= 768 ? "row" : "phone");

const WEIGHT: Record<"medium" | "semibold" | "bold" | "extrabold", TextStyle["fontWeight"]> = {
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
};

/** Text that always uses Inter (system font until it loads), never below 12pt, with a capped font-scale. */
function T({
  weight = "medium",
  loaded,
  style,
  ...rest
}: TextProps & { weight?: keyof typeof WEIGHT; loaded: boolean }) {
  const family: FontKey = weight;
  return (
    <RNText
      allowFontScaling
      maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}
      {...rest}
      style={[{ fontFamily: loaded ? FONT_FAMILY[family] : undefined, fontWeight: WEIGHT[weight] }, style]}
    />
  );
}

const CHIPS = ["Student Friendly", "Affordable Pricing", "On-Time Delivery", "Complete Support"];

const SERVICES: { title: string; sub: string; icon: IconName; color: string; bg: string }[] = [
  { title: "Website Development", sub: "Business, Portfolio, E-commerce & more", icon: "globe-outline", color: "#2563EB", bg: "#DBEAFE" },
  { title: "Mobile App Development", sub: "Android & iOS Apps", icon: "phone-portrait-outline", color: "#DB2777", bg: "#FCE7F3" },
  { title: "Web Application", sub: "Custom Web Apps and Platforms", icon: "code-slash-outline", color: "#7C3AED", bg: "#EDE9FE" },
  { title: "Final Year Projects", sub: "Academic & Research Projects", icon: "school-outline", color: "#0D9488", bg: "#CCFBF1" },
  { title: "Custom Software", sub: "Any kind of software solution", icon: "settings-outline", color: "#059669", bg: "#D1FAE5" },
  { title: "Have a Unique Idea?", sub: "We'll help you plan and build it", icon: "bulb-outline", color: "#D97706", bg: "#FEF3C7" },
];

const STATS: { title: string; sub: string; icon: IconName; color: string; bg: string }[] = [
  { title: "Trusted by Students", sub: "Across India", icon: "people", color: "#4F46E5", bg: "#E0E7FF" },
  { title: "100+ Projects", sub: "Delivered Successfully", icon: "document-text", color: "#7C3AED", bg: "#EDE9FE" },
  { title: "High Quality", sub: "Clean & Well Documented", icon: "star", color: "#4F46E5", bg: "#E0E7FF" },
  { title: "Ongoing Support", sub: "Even After Delivery", icon: "headset", color: "#7C3AED", bg: "#EDE9FE" },
];

const STEPS = ["Share Idea", "Discuss Requirements", "We Build It", "You Launch It"];

const GRADIENT: [string, string] = ["#2563EB", "#7C3AED"];
const CARD_SHADOW = { shadowColor: "#0F172A", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 } as const;

/** Blue→purple gradient text. Web: CSS background-clip. Native: MaskedView with an explicit measured size. */
function GradientText({ loaded, style, children }: { loaded: boolean; style: TextStyle; children: string }) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((p) => (p && p.w === width && p.h === height ? p : { w: width, h: height }));
  };

  if (Platform.OS === "web") {
    const clip =
      typeof CSS !== "undefined" && CSS.supports?.("-webkit-background-clip", "text")
        ? ({
            backgroundImage: `linear-gradient(90deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          } as unknown as TextStyle)
        : { color: C.indigo };
    return (
      <T loaded={loaded} weight="extrabold" style={[style, clip]}>
        {children}
      </T>
    );
  }

  return (
    <View>
      {/* in-flow sizing text; solid indigo until the mask is measured (and if it ever fails) */}
      <T loaded={loaded} weight="extrabold" onLayout={onLayout} style={[style, { color: C.indigo, opacity: size ? 0 : 1 }]}>
        {children}
      </T>
      {size && (
        <MaskedView
          pointerEvents="none"
          style={{ position: "absolute", left: 0, top: 0, width: size.w, height: size.h }}
          maskElement={
            <T loaded={loaded} weight="extrabold" style={[style, { color: "#000", width: size.w }]}>
              {children}
            </T>
          }
        >
          <LinearGradient colors={GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: size.w, height: size.h }} />
        </MaskedView>
      )}
    </View>
  );
}

/** Big CTA: min-height 52, never shrinks/truncates, pressed feedback. */
function CtaButton({
  label,
  icon,
  onPress,
  loaded,
  variant,
  full,
  height,
  fontSize,
  padX,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
  loaded: boolean;
  variant: "solid" | "outline";
  full: boolean;
  height: number;
  fontSize: number;
  padX: number;
}) {
  const inner = { minHeight: height, borderRadius: 14, paddingHorizontal: padX, flexDirection: "row", alignItems: "center", justifyContent: "center" } as const;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => ({
        minHeight: height,
        borderRadius: 14,
        flexShrink: 0,
        width: full ? "100%" : undefined,
        transform: [{ scale: pressed ? 0.97 : 1 }],
        shadowColor: variant === "solid" ? C.indigo : C.purple,
        shadowOpacity: variant === "solid" ? 0.35 : 0.14,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: variant === "solid" ? 5 : 2,
      })}
    >
      {({ pressed }) =>
        variant === "solid" ? (
          <LinearGradient
            colors={pressed ? ["#4338CA", "#5B21B6"] : ["#4F46E5", "#6D28D9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={inner}
          >
            <Ionicons name={icon} size={16} color="#FFFFFF" />
            <T loaded={loaded} weight="bold" numberOfLines={1} style={{ color: "#FFFFFF", fontSize, marginHorizontal: 8, flexShrink: 0 }}>
              {label}
            </T>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </LinearGradient>
        ) : (
          <View style={[inner, { backgroundColor: pressed ? "#F5F3FF" : "#FFFFFF", borderWidth: 1.5, borderColor: "#7C3AED" }]}>
            <Ionicons name={icon} size={16} color="#7C3AED" />
            <T loaded={loaded} weight="bold" numberOfLines={1} style={{ color: "#1E1B4B", fontSize, marginLeft: 8, flexShrink: 0 }}>
              {label}
            </T>
          </View>
        )
      }
    </Pressable>
  );
}

function ServiceCard({ s, loaded, onPress, fs }: { s: (typeof SERVICES)[number]; loaded: boolean; onPress: () => void; fs: number }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={s.title}
      style={(state) => {
        const { pressed } = state;
        const hovered = (state as { hovered?: boolean }).hovered;
        return {
          flex: 1,
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: pressed ? "#C7D2FE" : "#EEF0F6",
          padding: 10,
          minHeight: 92,
          transform: [{ scale: pressed ? 0.98 : 1 }, { translateY: hovered && !pressed ? -2 : 0 }],
          ...CARD_SHADOW,
        };
      }}
    >
      <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: s.bg, alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        <Ionicons name={s.icon} size={18} color={s.color} />
      </View>
      <T loaded={loaded} weight="bold" numberOfLines={2} style={{ color: "#0F172A", fontSize: 13 * fs, lineHeight: 17 * fs }}>
        {s.title}
      </T>
      <T loaded={loaded} numberOfLines={2} style={{ color: "#64748B", fontSize: 11, lineHeight: 15, marginTop: 2 }}>
        {s.sub}
      </T>
    </Pressable>
  );
}

/**
 * "Custom Project Development" promo — shared by Home and All Projects.
 * Layout is driven by the banner's OWN measured width (not the screen):
 * ≥768 one 3-column row + a stats/quote row · <768 one stack.
 */
export function CustomProjectBanner() {
  const navigation = useNavigation();
  const { width: windowWidth } = useWindowDimensions();
  const [measured, setMeasured] = useState<number | null>(null);
  const loaded = useLearningFonts();
  const cw = measured ?? windowWidth;
  const mode = modeFor(cw);
  const phone = mode === "phone";
  const small = !phone && cw < 900; // 768–899: same one-row layout, slightly smaller
  const fs = small ? 0.95 : 1;
  const gap = phone ? 12 : 20;

  const startProject = () =>
    (navigation.getParent() as any)?.navigate("CustomProjects", { screen: "BuilderStart" });

  const openWhatsApp = async () => {
    try {
      await Linking.openURL(whatsappUrl());
    } catch {
      notify("Unable to open WhatsApp", "Please make sure WhatsApp is installed, or try again later.");
    }
  };

  const headingSize = phone ? 28 : small ? 30 : 34;
  const headingStyle: TextStyle = { fontSize: headingSize, lineHeight: Math.round(headingSize * (40 / 34)), letterSpacing: -0.5 };

  const heading = (
    <View>
      <T loaded={loaded} weight="extrabold" style={[headingStyle, { color: C.heading }]}>
        Have a Project Idea?
      </T>
      <View style={{ alignSelf: "flex-start", maxWidth: "100%" }}>
        <GradientText loaded={loaded} style={headingStyle}>
          {"We'll Build It for You."}
        </GradientText>
        <Svg
          width={100}
          height={7}
          viewBox="0 0 110 8"
          style={{ alignSelf: "flex-end", marginTop: 2 }}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        >
          <Path d="M2 6 C30 1 70 1 108 5" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </Svg>
      </View>
    </View>
  );

  const copy = (
    <View>
      <View
        style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", backgroundColor: C.pill, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, marginBottom: 10 }}
      >
        <T loaded={loaded} style={{ fontSize: 11, marginRight: 5 }}>🚀</T>
        <T loaded={loaded} weight="bold" style={{ color: C.purple, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase" }}>
          Custom Project Development
        </T>
      </View>
      {heading}
      <T loaded={loaded} style={{ color: C.body, fontSize: 14, lineHeight: 21, marginTop: 10 }} numberOfLines={phone ? undefined : 3}>
        Share your idea for a website, mobile app, or any software project. Our team will turn your idea into a complete, working solution.
      </T>
      <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 12, rowGap: 6, marginTop: 12 }}>
        {CHIPS.map((c) => (
          <View key={c} style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="checkmark-circle" size={16} color={C.green} />
            <T loaded={loaded} weight="semibold" style={{ color: C.heading, fontSize: 12, marginLeft: 4 }}>{c}</T>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
        <CtaButton loaded={loaded} variant="solid" full={phone} height={46} fontSize={15} padX={20} icon="paper-plane" label="Start Your Project" onPress={startProject} />
        <CtaButton loaded={loaded} variant="outline" full={phone} height={46} fontSize={15} padX={20} icon="calendar-outline" label="Get a Free Consultation" onPress={openWhatsApp} />
      </View>
    </View>
  );

  const stepsCard = (
    <View style={{ backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#EEF0F6", padding: 10, gap: 6, ...CARD_SHADOW }}>
      {STEPS.map((s) => (
        <View key={s} style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="checkmark-circle" size={16} color="#2563EB" />
          <T loaded={loaded} weight="semibold" numberOfLines={1} style={{ color: C.heading, fontSize: 12, marginLeft: 6 }}>{s}</T>
        </View>
      ))}
    </View>
  );

  // Steps overlap the art's top-right corner on wide/tablet only when the art exists; otherwise they sit below.
  const overlap = ILLUSTRATION !== null && !phone;
  const illustration = (
    <View>
      <T loaded={loaded} weight="semibold" style={{ color: C.purple, fontSize: 14, fontStyle: "italic", lineHeight: 19, marginBottom: 6 }}>
        Turn Your Ideas Into Reality
      </T>
      {ILLUSTRATION && (
        <Image source={ILLUSTRATION} contentFit="contain" style={{ width: "100%", aspectRatio: 1.25, maxHeight: 260 }} accessibilityIgnoresInvertColors />
      )}
      {overlap ? (
        <View style={{ position: "absolute", top: 0, right: 0, maxWidth: "60%" }}>{stepsCard}</View>
      ) : (
        <View style={{ marginTop: ILLUSTRATION ? 10 : 2, alignSelf: phone ? "stretch" : "flex-start" }}>{stepsCard}</View>
      )}
    </View>
  );

  const cols = 2;
  const rows: (typeof SERVICES)[] = [];
  for (let i = 0; i < SERVICES.length; i += cols) rows.push(SERVICES.slice(i, i + cols));
  const services = (
    <View style={{ gap: 10 }}>
      {rows.map((row, i) => (
        <View key={i} style={{ flexDirection: "row", gap: 10, alignItems: "stretch" }}>
          {row.map((s) => (
            <ServiceCard key={s.title} s={s} loaded={loaded} onPress={startProject} fs={fs} />
          ))}
        </View>
      ))}
    </View>
  );

  const statCols = phone ? 2 : 4;
  const stats = (
    <View style={{ flexDirection: "row", flexWrap: "wrap", backgroundColor: "#FFFFFF", borderRadius: 14, borderWidth: 1, borderColor: "#EEF0F6", ...(phone ? { paddingVertical: 4 } : { minHeight: 56 }), ...CARD_SHADOW }}>
      {STATS.map((s, i) => (
        <View
          key={s.title}
          style={{
            width: statCols === 4 ? "25%" : "50%",
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: phone ? 8 : 0,
            paddingHorizontal: phone ? 12 : small ? 8 : 12,
            borderLeftWidth: (statCols === 4 && i > 0) || (statCols === 2 && i % 2 === 1) ? 1 : 0,
            borderLeftColor: "#EEF0F6",
          }}
        >
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: s.bg, alignItems: "center", justifyContent: "center", marginRight: 8 }}>
            <Ionicons name={s.icon} size={16} color={s.color} />
          </View>
          <View style={{ flex: 1 }}>
            <T loaded={loaded} weight="bold" style={{ color: C.heading, fontSize: 12, lineHeight: 16 }}>{s.title}</T>
            <T loaded={loaded} style={{ color: C.body, fontSize: 11, lineHeight: 15 }}>{s.sub}</T>
          </View>
        </View>
      ))}
    </View>
  );

  const quote = (
    <View style={{ flexDirection: phone ? "column" : "row", alignItems: phone ? "flex-start" : "center", justifyContent: "space-between", gap: 12 }}>
      <View style={{ flex: phone ? 0 : 1 }}>
        <T loaded={loaded} weight="semibold" style={{ color: C.heading, fontSize: 13, lineHeight: 18, fontStyle: "italic" }}>
          “Your idea + Our development = A better tomorrow.”
        </T>
        <T loaded={loaded} weight="semibold" style={{ color: C.body, fontSize: 12, marginTop: 2 }}>— CampusEduX</T>
      </View>
      <LinearGradient
        colors={["#7C3AED", "#5B21B6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14, marginRight: phone ? 0 : 6, transform: [{ rotate: "-6deg" }] }}
      >
        <T loaded={loaded} weight="bold" style={{ color: "#FFFFFF", fontSize: 13, lineHeight: 16, textAlign: "center" }}>
          {"Let's Build\nTogether"}
        </T>
      </LinearGradient>
    </View>
  );

  const main = phone ? (
    <View style={{ gap }}>
      {copy}
      {illustration}
      {services}
    </View>
  ) : (
    <View style={{ flexDirection: "row", alignItems: "center", gap }}>
      <View style={{ flex: 40 }}>{copy}</View>
      <View style={{ flex: 32 }}>{services}</View>
      <View style={{ flex: 28 }}>{illustration}</View>
    </View>
  );

  const bottom = phone ? (
    <View style={{ gap }}>
      {stats}
      {quote}
    </View>
  ) : (
    <View style={{ flexDirection: "row", alignItems: "center", gap }}>
      <View style={{ flex: 65 }}>{stats}</View>
      <View style={{ flex: 35 }}>{quote}</View>
    </View>
  );

  return (
    <LinearGradient
      colors={["#F5F3FF", "#EEF2FF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      onLayout={(e: LayoutChangeEvent) => {
        const w = Math.round(e.nativeEvent.layout.width);
        setMeasured((p) => (p === w ? p : w));
      }}
      style={{
        width: "100%",
        marginBottom: 16,
        borderRadius: 20,
        paddingHorizontal: phone ? 16 : 24,
        paddingVertical: phone ? 16 : 20,
        borderWidth: 1,
        borderColor: "#E0E7FF",
        overflow: "hidden",
      }}
    >
      <View style={{ gap: phone ? 12 : 16 }}>
        {main}
        {bottom}
      </View>
    </LinearGradient>
  );
}

export default CustomProjectBanner;
