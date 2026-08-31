import type { NavigationProp } from "@react-navigation/native";
import { CommonActions, StackActions } from "@react-navigation/native";

/**
 * Navigation helpers that tolerate an empty history stack.
 *
 * On Expo Web a screen is frequently the *first* entry in the stack (the user
 * deep-linked straight to /Login, or refreshed the page), so `goBack()` has
 * nothing to pop and either no-ops or throws. These helpers check
 * `canGoBack()` first and fall back to an explicit route.
 */

type AnyNavigation = Pick<
  NavigationProp<Record<string, object | undefined>>,
  "canGoBack" | "goBack" | "dispatch"
>;

/**
 * Pops the current screen when there is history, otherwise resets to
 * `fallbackRoute` (when given) so the user is never stranded.
 */
export function goBackSafely(
  navigation: AnyNavigation,
  fallbackRoute?: string,
  fallbackParams?: object
): void {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }

  if (!fallbackRoute) return;

  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: fallbackRoute, params: fallbackParams }],
    })
  );
}

/** True when the current screen has somewhere to go back to. */
export function canGoBackSafely(navigation: AnyNavigation): boolean {
  try {
    return navigation.canGoBack();
  } catch {
    return false;
  }
}

/**
 * Replaces the current screen, falling back to a reset when the navigator has
 * no stack to replace within (e.g. first route on web).
 */
export function replaceSafely(
  navigation: AnyNavigation,
  routeName: string,
  params?: object
): void {
  try {
    navigation.dispatch(StackActions.replace(routeName, params));
  } catch {
    resetTo(navigation, routeName, params);
  }
}

/** Clears the history stack and lands on a single route. */
export function resetTo(
  navigation: AnyNavigation,
  routeName: string,
  params?: object
): void {
  navigation.dispatch(
    CommonActions.reset({ index: 0, routes: [{ name: routeName, params }] })
  );
}
