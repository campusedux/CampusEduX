# Navigation

React Navigation v7. Native-stack everywhere except the drawer and the bottom
tabs. Types live in [`src/types/navigation.types.ts`](../src/types/navigation.types.ts);
route-name constants in [`src/constants/routes.ts`](../src/constants/routes.ts).
All navigators set `headerShown: false` (screens draw their own headers).

```
NavigationContainer
└─ RootNavigator (native-stack)            src/navigation/RootNavigator.tsx
   ├─ AuthNavigator                        (unauthenticated flow)
   └─ MainNavigator → DrawerNavigator      (authenticated app)
```

`AuthNavigator` resets into `MainNavigator` from `WelcomeScreen` once sign-in +
profile setup are done; both stacks stay mounted under `RootNavigator`.

## AuthNavigator — `src/navigation/AuthNavigator.tsx` (Module 1)

`initialRouteName="Splash"`

`Splash → Onboarding1 → Onboarding2 → Onboarding3 → Login → Register →
ForgotPassword → OTPVerification → ResetPassword → SelectCourse → SelectBranch →
SelectYear → Welcome`

## DrawerNavigator — `src/navigation/DrawerNavigator.tsx`

Custom `DrawerContent`. Siblings:

| Route | Component |
|-------|-----------|
| `MainTabs` | `MainNavigator` → `BottomTabNavigator` |
| `ResumeBuilder` | `ResumeNavigator` |
| `MyProjects` | `MyProjectsNavigator` |
| `Referral` | `ReferralNavigator` |
| `Premium` | `PremiumNavigator` |
| `SettingsModule` | `SettingsNavigator` |

### BottomTabNavigator — `src/navigation/BottomTabNavigator.tsx`

Tabs (Ionicons, active `#4F39F6`): `Home` · `Projects` · `Jobs` · `Prep` ·
`Profile` — each a native-stack.

| Tab stack | File | Routes |
|-----------|------|--------|
| **Home** (Module 2) | `HomeNavigator.tsx` | `HomeDashboard`, `SearchResult`, `Notifications`, `AllCategories`, `TrendingProjects`, `PremiumProjects`, `BestSellers`, `NewArrivals`, `PlacementBanner`, `LatestJobs`, `ReferralBanner`, `OfferBanner` |
| **Projects** (Module 3) | `ProjectNavigator.tsx` | `AllProjects`, `CategoryProjects`, `SearchProjects`, `FilterProjects` *(modal)*, `ProjectDetails`, `ImageGallery` *(fullScreenModal)*, `VideoPreview`, `LiveDemo`, `Reviews`, `SimilarProjects`, `BuyNow`, `Payment`, `PaymentSuccess`, `PaymentFailed`, `Wishlist`, `DownloadProject`, `MyPurchasedProjects`, `DownloadHistory` |
| **Jobs** (Module 4) | `JobNavigator.tsx` | `JobsDashboard`, `SearchJobs`, `FilterJobs` *(modal)*, `CompanyList`, `CompanyDetails`, `JobDetails`, `ApplyJob`, `ResumeUpload`, `SavedJobs`, `AppliedJobs`, `ApplicationStatus`, `RecommendedJobs`, `JobAlerts`, `RecruiterDetails` |
| **Prep** (Module 5) | `PlacementNavigator.tsx` | `PlacementHome`, `AptitudeDashboard`, `Quantitative`, `LogicalReasoning`, `VerbalAbility`, `PracticeTestList`, `TestInstruction`, `LiveTest` *(gesture-locked)*, `TestResult` *(gesture-locked)*, `PerformanceAnalysis`, `DSADashboard`, `TopicList`, `ProblemDetails`, `CodeEditor`, `SolutionExplanation`, `HRDashboard`, `HRQuestion`, `FavoriteQuestion`, `CompanyList`, `CompanyDashboard`, `CompanyQuestion`, `CompanyMockTest`, `CompanyResult`, `CompanyAnalytic` |
| **Profile** (Module 8) | `ProfileNavigator.tsx` | `Profile`, `EditProfile`, `ChangeCourse`, `ChangeBranch`, `ChangeYear`, `Wallet`, `ReferralEarn`, `PurchaseHistory`, `Settings`, `HelpSupport`, `About`, `Logout` |

## Drawer sibling stacks

| Stack | File | Routes |
|-------|------|--------|
| **Resume Builder** (Module 6) | `ResumeNavigator.tsx` | `ResumeDashboard`, `Templates`, `ResumeEditor`, `PersonalDetails`, `Education`, `Skills`, `PreviewResume`, `ATSScore`, `DownloadPDF`, `ResumeHistory` |
| **My Projects** (Module 7) | `MyProjectsNavigator.tsx` | `PurchasedProjects`, `MyProjectDetails`, `DownloadFiles`, `UpdateAvailable`, `Documentation`, `SourceCode`, `VersionHistory`, `Support` |
| **Referral** (Module 9) | `ReferralNavigator.tsx` | `ReferralDashboard`, `ShareReferral`, `Earnings`, `Wallet`, `ReferralHistory`, `Leaderboard` |
| **Premium** (Module 10) | `PremiumNavigator.tsx` | `PremiumPlans`, `PremiumFeatures`, `PremiumPayment`, `PremiumSuccess`, `MembershipDetails` |
| **Settings** (Module 11) | `SettingsNavigator.tsx` | `Settings`, `Theme`, `Language`, `Notification`, `Privacy`, `Terms`, `ContactSupport`, `About` |

## Shared / re-used screens

- `Referral/Wallet` re-exports `profile/WalletScreen` (one wallet per user).
- `placement` `CompanyList` reuses the same component name as `jobs` `CompanyList`
  (different stacks).
- `MyProjects/MyProjectDetails` reuses `project/ProjectDetailsScreen`.
- Cross-stack jumps use `navigation.getParent()` + `navigate("SettingsModule",
  { screen: "..." })` / `navigate("MainTabs", { screen: "Profile" })`.

## Helpers

- `src/navigation/safeNavigation.ts` — guarded `navigate` that no-ops on an
  unknown route instead of throwing.
- `src/navigation/DrawerContent.tsx` — profile header + module links + logout.
