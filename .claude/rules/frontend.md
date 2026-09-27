# Frontend Rules

- Follow the existing platform, component, navigation, state, styling, accessibility, and localization conventions for the surface being changed.
- Reuse existing components and utilities; inspect the closest screen and its service/action contract before editing.
- Preserve loading, empty, error, permission, and responsive behavior. Do not rely on UI hiding as authorization.
- Keep privileged decisions and secrets out of client code; validate untrusted input at the trusted server or database boundary.
- Add focused tests for changed user-visible behavior and relevant failure states.