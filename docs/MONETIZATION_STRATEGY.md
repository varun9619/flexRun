# FlexRun - Monetization Strategy

**Version**: 1.0  
**Last Updated**: February 6, 2026

---

## 1. Revenue Model Overview

FlexRun uses a **freemium subscription model** with three tiers designed to convert engaged users while maintaining a generous free experience.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   FREE              PREMIUM             PRO                     │
│   $0                $9.99/mo            $19.99/mo               │
│                     $79.99/yr           $159.99/yr              │
│                                                                 │
│   ✓ Basic tracking  ✓ All Free +        ✓ All Premium +         │
│   ✓ AI conversation ✓ Unlimited voice   ✓ Personal programs     │
│   ✓ 3 coached runs  ✓ Advanced AI       ✓ Live coaching (1/mo)  │
│   ✓ 30-day history  ✓ Full history      ✓ Advanced analytics    │
│                     ✓ Race prep tools   ✓ Early access          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Tier Details

### 2.1 Free Tier (Always Available)

**Purpose**: Acquire users, demonstrate value, build habit

| Feature | Limit | Notes |
|---------|-------|-------|
| GPS Run Tracking | Unlimited | Core feature, no limits |
| AI Conversation | Unlimited | Intent recognition, recommendations |
| Voice Coaching | 3 runs/week | Per calendar week, resets Monday |
| Run History | Last 30 days | Older runs deleted |
| Training Programs | Basic (5K Beginner) | Single program |
| Post-Run Summary | Basic | Metrics only, no AI insights |
| Settings | Full | All preferences available |

**Conversion Hooks**:
- After 3 coached runs: "Upgrade for unlimited coaching"
- Day 25: "Upgrade to keep your run history"
- Viewing advanced program: "This program is Premium"

---

### 2.2 Premium Tier ($9.99/month)

**Purpose**: Core revenue, serious runners, training goals

| Feature | Limit | Notes |
|---------|-------|-------|
| Voice Coaching | Unlimited | All runs, all frequencies |
| AI Recommendations | Advanced | Context-aware, personalized |
| Run History | Lifetime | Never expires |
| Training Programs | Full Library | 5K, 10K, Half, Marathon |
| Post-Run Insights | AI-powered | Detailed analysis |
| Race Prep Tools | Included | Race day planning, pacing |
| Export | Full | GPX, CSV export |
| Support | Priority | 24h response time |

**Pricing**:
- Monthly: $9.99
- Annual: $79.99 (Save 33%, $6.67/month)

---

### 2.3 Pro Tier ($19.99/month)

**Purpose**: Dedicated athletes, maximum value

| Feature | Limit | Notes |
|---------|-------|-------|
| Everything in Premium | ✓ | All Premium features |
| Personal Program Builder | Included | AI creates custom program |
| Live Coaching Sessions | 1 per month | 30-min video call with coach |
| Advanced Analytics | Full | Predictive insights, trends |
| Biomechanics (future) | Included | Phone sensor analysis |
| Nutrition Planning | Basic | Pre/post run recommendations |
| Early Access | ✓ | Beta features |

**Pricing**:
- Monthly: $19.99
- Annual: $159.99 (Save 33%, $13.33/month)

---

## 3. Subscription Implementation

### 3.1 Platform: Google Play Billing

**Tech Stack**:
- Google Play Billing Library v6+
- Server-side validation via RTDN (Real-Time Developer Notifications)
- Local caching with graceful degradation

**Product IDs**:
```kotlin
object SubscriptionProducts {
    const val PREMIUM_MONTHLY = "flexrun_premium_monthly"
    const val PREMIUM_ANNUAL = "flexrun_premium_annual"
    const val PRO_MONTHLY = "flexrun_pro_monthly"
    const val PRO_ANNUAL = "flexrun_pro_annual"
}
```

### 3.2 Purchase Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  1. User hits paywall                                           │
│            │                                                    │
│            ▼                                                    │
│  2. Show subscription options screen                            │
│            │                                                    │
│            ▼                                                    │
│  3. User selects plan                                           │
│            │                                                    │
│            ▼                                                    │
│  4. Launch Google Play purchase flow                            │
│            │                                                    │
│            ▼                                                    │
│  5. Google returns purchase token                               │
│            │                                                    │
│            ▼                                                    │
│  6. Validate token (server-side optional for v1)                │
│            │                                                    │
│            ▼                                                    │
│  7. Acknowledge purchase                                        │
│            │                                                    │
│            ▼                                                    │
│  8. Update local subscription state                             │
│            │                                                    │
│            ▼                                                    │
│  9. Unlock features                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Subscription State Management

```kotlin
data class SubscriptionState(
    val tier: SubscriptionTier,
    val expiresAt: Instant?,
    val isActive: Boolean,
    val isTrialActive: Boolean,
    val purchaseToken: String?
)

enum class SubscriptionTier {
    FREE,
    PREMIUM,
    PRO
}

class SubscriptionManager @Inject constructor(
    private val billingClient: BillingClient,
    private val dataStore: DataStore<Preferences>
) {
    val subscriptionState: Flow<SubscriptionState>
    
    suspend fun refreshSubscriptionState()
    suspend fun processPurchase(purchase: Purchase)
    fun hasFeature(feature: Feature): Boolean
}
```

### 3.4 Feature Gating

```kotlin
enum class Feature {
    VOICE_COACHING,
    ADVANCED_AI,
    FULL_HISTORY,
    TRAINING_PROGRAMS,
    RACE_PREP,
    EXPORT,
    PERSONAL_PROGRAMS,
    LIVE_COACHING,
    ADVANCED_ANALYTICS
}

val featureTiers = mapOf(
    Feature.VOICE_COACHING to SubscriptionTier.PREMIUM,
    Feature.ADVANCED_AI to SubscriptionTier.PREMIUM,
    Feature.FULL_HISTORY to SubscriptionTier.PREMIUM,
    Feature.TRAINING_PROGRAMS to SubscriptionTier.PREMIUM,
    Feature.RACE_PREP to SubscriptionTier.PREMIUM,
    Feature.EXPORT to SubscriptionTier.PREMIUM,
    Feature.PERSONAL_PROGRAMS to SubscriptionTier.PRO,
    Feature.LIVE_COACHING to SubscriptionTier.PRO,
    Feature.ADVANCED_ANALYTICS to SubscriptionTier.PRO
)
```

---

## 4. Free Trial Strategy

### 4.1 Trial Offer

**Premium Trial**:
- Duration: 7 days
- Full Premium access
- Credit card required (via Google Play)
- Auto-converts to paid unless cancelled

**When Offered**:
- First paywall hit
- After completing first run
- After 3rd run (if not already converted)

### 4.2 Trial Copy

```
"Try Premium Free for 7 Days"

Get unlimited voice coaching, advanced AI recommendations, 
and keep your entire run history. 

Cancel anytime before your trial ends, and you won't be charged.

[Start Free Trial]
```

---

## 5. Paywall Design

### 5.1 Trigger Points

| Trigger | Priority | Context |
|---------|----------|---------|
| 4th coached run of week | High | "Upgrade for more coached runs" |
| Viewing full history | High | "Keep all your run data" |
| Advanced program | Medium | "Unlock this training plan" |
| AI insights on post-run | Medium | "Get detailed analysis" |
| Settings (export) | Low | "Export available for Premium" |

### 5.2 Paywall Screen

```
┌────────────────────────────────────────┐
│  ←                                     │
│                                        │
│              🏃‍♂️ ✨                     │
│                                        │
│      Unlock Your Full Potential        │
│                                        │
│  ─────────────────────────────────     │
│                                        │
│  ┌────────────────────────────────┐    │
│  │ PREMIUM              $9.99/mo │    │
│  │ ✓ Unlimited voice coaching    │    │
│  │ ✓ Advanced AI recommendations │    │
│  │ ✓ Full training library       │    │
│  │ ✓ Lifetime history            │    │
│  └────────────────────────────────┘    │
│                                        │
│  ┌────────────────────────────────┐    │
│  │ PRO                  $19.99/mo│    │
│  │ ✓ Everything in Premium       │    │
│  │ ✓ Personal program builder    │    │
│  │ ✓ Monthly live coaching       │    │
│  └────────────────────────────────┘    │
│                                        │
│  ─────────────────────────────────     │
│                                        │
│    Save 33% with annual billing        │
│                                        │
│  ┌────────────────────────────────┐    │
│  │   Try Premium Free for 7 Days │    │
│  └────────────────────────────────┘    │
│                                        │
│       Restore Purchases                │
│                                        │
└────────────────────────────────────────┘
```

---

## 6. Revenue Projections

### 6.1 Assumptions (Year 1)

| Metric | Value |
|--------|-------|
| Total Downloads | 50,000 |
| Free-to-Trial Conversion | 10% (5,000) |
| Trial-to-Paid Conversion | 40% (2,000) |
| Monthly → Annual | 60% |
| Premium:Pro Split | 80:20 |
| Monthly Churn | 5% |

### 6.2 Year 1 Monthly Revenue (Steady State)

```
Premium Monthly: 800 users × 0.4 × $9.99 = $3,196.80
Premium Annual:  800 users × 0.6 × $6.67 = $3,201.60
Pro Monthly:     200 users × 0.4 × $19.99 = $1,599.20
Pro Annual:      200 users × 0.6 × $13.33 = $1,599.60

Total Monthly Revenue: ~$9,597
Annual Revenue: ~$115,000
```

### 6.3 Cost Structure

| Cost | Monthly | Notes |
|------|---------|-------|
| OpenAI API | ~$500 | ~$0.25/active user |
| Google Play Fee | ~$2,875 | 30% of revenue |
| Server Costs | $0 | Local-first, no server v1 |
| **Net Revenue** | **~$6,222** | After costs |

---

## 7. Metrics & Analytics

### 7.1 Key Metrics to Track

| Metric | Description | Target |
|--------|-------------|--------|
| Free-to-Trial CVR | % of free users starting trial | 10%+ |
| Trial-to-Paid CVR | % of trial users converting | 40%+ |
| MRR | Monthly recurring revenue | Growth |
| ARPU | Avg revenue per user | $2+ |
| LTV | Customer lifetime value | $50+ (3yr) |
| Churn | Monthly subscription cancellation | <5% |
| DAU/MAU | Daily/Monthly active users | 30%+ |

### 7.2 Cohort Analysis

Track by:
- Acquisition channel
- Onboarding completion
- First run completion
- Subscription start date

---

## 8. Promotional Strategies

### 8.1 Launch Offers

| Offer | Details | Duration |
|-------|---------|----------|
| Early Bird | 50% off first year | First month |
| Referral | 1 month free per referral | Ongoing |
| Race Discount | 20% off before major races | Seasonal |

### 8.2 Retention Offers

| Trigger | Offer | Goal |
|---------|-------|------|
| Cancel intent | 30% off next month | Save |
| 11 months active | 20% off annual renewal | Loyalty |
| Lapsed 30 days | Come back for 50% off | Win back |

---

## 9. Implementation Phases

### Phase 1: MVP (Sprint 8)
- Google Play Billing integration
- Premium tier only
- Basic paywall at key triggers
- Local subscription state

### Phase 2: Optimization (Q2)
- Pro tier launch
- A/B test paywall copy
- Trial optimization
- Analytics integration

### Phase 3: Growth (Q3)
- Referral program
- Promotional campaigns
- Win-back automation
- Advanced analytics

---

## 10. Legal & Compliance

### 10.1 Required Documents
- Terms of Service
- Privacy Policy
- Subscription Terms
- Refund Policy

### 10.2 Google Play Requirements
- Clear pricing display
- Trial terms visible
- Easy cancellation info
- Renewal reminders (handled by Google)

### 10.3 Regional Considerations
- Local pricing for key markets
- VAT handling (via Google)
- GDPR compliance for EU users

---

**Document End**
