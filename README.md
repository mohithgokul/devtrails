🚀**SurakshaPay-AI-Powered Parametric Insurance for Gig Delivery Workers**

📌 **Table of Contents**

1.Problem Statement

2.Our Solution

3.Target Persona

4.User Scenarios

5.Key Features

6.System Workflow

7.Weekly Premium Model

8.Parametric Triggers

9.AI/ML Integration

10.Tech Stack

11.System Architecture

12.Conclusion

**1.Problem Statement:**

India’s gig economy relies heavily on delivery workers from platforms like Swiggy, Zomato, Zepto, and Amazon. However, these workers face income instability due to external disruptions such as:

Heavy rainfall

Extreme heat

Pollution

Curfews or strikes

These disruptions can reduce their earnings by 20–30%, and currently, no income protection exists for such uncontrollable events.

🚫 Constraints

Only income loss is covered

No health, accident, or vehicle insurance

Must follow a weekly pricing model

**2.💡Our Solution**

Introducing SurakshaPay

A smart, AI-driven parametric insurance platform that:

Predicts risks using AI

Charges affordable weekly premiums

Detects disruptions automatically

Initiates claims instantly

Pays workers without manual intervention

**3.👤 Target Persona:**

🎯 Primary Persona: Food Delivery Worker

Name: Ravi Kumar

Age: 26

Platform: Swiggy

City: Bangalore

📊 Profile:
Daily Earnings: ₹800 – ₹1200
Works 10–12 hours/day
Income depends on weather & demand

😟 Pain Points:

Rain → fewer deliveries

Pollution → reduced working hours

No fallback income

**4. User Scenarios**

Scenario 1: Heavy Rainfall 🌧️
Rainfall exceeds threshold
Deliveries drop drastically
System detects disruption
Ravi receives ₹700 instantly

Scenario 2: Extreme Heat 🔥
Temperature crosses 45°C
Worker reduces hours
System triggers partial payout

Scenario 3: Curfew 🚫
Area lockdown announced
Worker cannot operate
Full-day compensation credited

**5.Key Features**
# 🚀 Key Features

## 1. Optimized Onboarding
Quick and seamless mobile-based onboarding for delivery partners with minimal inputs.

## 2. Risk Assessment
AI-driven risk profiling based on location, environmental conditions, and activity patterns.

## 3. Weekly Premium Model
Personalized weekly pricing aligned with the earning cycle of gig workers.

## 4. Risk-Based Pricing with Volatility
Dynamic premium calculation incorporating risk variability and uncertainty.

## 5. Parametric Trigger Engine
Automated detection of disruptions using real-time environmental and social data.

## 6. Multi-Source Data Integration
Integration of weather APIs, news data, maps, and platform activity signals.

## 7. Activity Validation System
Validates actual work disruption before enabling payouts.

## 8. Automated Payout Processing
Instant payout execution via UPI without manual claim filing.

## 9. Fixed Coverage Insurance Model
Predefined payout percentage based on the selected coverage plan.

## 10. Fraud Detection System
Anomaly detection and rule-based validation to prevent misuse.

## 11. Predictive Analytics
Identification of high-risk zones and disruption trends.

## 12. Adaptive Learning System
Continuous improvement of model accuracy using historical data.

## 13. Analytics Dashboard
Visualization of key metrics such as premiums, payouts, risk ratio, and triggers.

## 14. Event-Driven Architecture
Real-time processing of triggers and payouts using event-based systems.

## 15. Scalable Cloud Infrastructure
Cloud-native architecture ensuring scalability, reliability, and high availability.

**6.⚙️ System Workflow:**

User Onboarding → Risk Profiling → Weekly Policy Creation  
→ Real-Time Monitoring → Trigger Detection → Auto Claim  
→ Instant Payout

Step-by-Step Flow:

1.User Onboarding

Register via mobile app

Select delivery platform

Enable GPS & activity tracking

2.Risk Profiling

AI analyzes:

Location risk

Historical weather

Work patterns

3.Policy Creation

Weekly premium calculated

Coverage plan generated

4.Monitoring Engine

Continuously tracks:

Weather APIs

Pollution levels

Zone restrictions

5.Trigger Activation

Parametric condition met

Claim auto-generated

6.Payout System

Instant transfer via UPI

**7.Weekly Premium Model – Working Method**

Our platform calculates a **personalized weekly premium** for each gig worker using a data-driven approach that combines expected income loss, disruption probability, and risk uncertainty.

📌 Core Formula

P_w = (L_w × p × α) + (σ × β) + M

Where:

- **P_w** → Weekly Premium  
- **L_w** → Expected Weekly Income Loss  
- **p** → Probability of Disruption  
- **α** → Coverage Factor  
- **σ** → Risk Volatility  
- **β** → Risk Sensitivity (Knob)  
- **M** → Platform Margin  

Step 1: Estimate Expected Weekly Income Loss (L_w)

This represents how much income a rider is likely to lose in a typical week due to disruptions.

### Formula:
L_w = Avg Hourly Income × Hours Lost per Event × Events per Week
 
Step 2: Calculate Probability of Disruption (p)

This represents the likelihood that a disruption will occur in a given week.

### How it is calculated:
- Weather forecasts (rainfall, temperature)
- Historical disruption data
- City-level risk patterns

Step 3: Apply Coverage Factor (α)

Coverage factor defines what percentage of income loss is covered under the plan.

Plan Options:

| Plan | Coverage (α) |
|------|-------------|
| Basic | 0.6 |
| Standard | 0.7 |
| Pro | 0.85 |

 Step 4: Calculate Risk Volatility (σ)

Risk volatility measures how unpredictable income loss is over time.

✅ Preferred Method: Standard Deviation

σ = sqrt( (1/n) × Σ(x_i − μ)^2 )

Where:
- x_i = historical weekly losses  
- μ = average loss  

Example:

Weekly losses:
100, 200, 300, 800  

- Average (μ) = 350  
- σ ≈ 269  

⚡ Alternative (if limited data):

σ ≈ Max Loss − Avg Loss  

Example:
σ ≈ 800 − 350 = 450  

 🎯 Purpose:
- Captures uncertainty in disruptions  
- Prevents underpricing during extreme events  

 Step 5: Determine Risk Sensitivity (β)

β controls how much importance is given to volatility in pricing.

✅ Preferred Method: Simulation-Based Calibration

Process:
1. Test multiple β values (0.1 to 0.3)
2. Simulate past scenarios
3. Evaluate:
   - Risk Ratio (payouts / premiums)
   - Profitability
   - Affordability

4. Select β where:
   - Risk Ratio ≈ 60–80%
   - Premium remains affordable

⚡ Practical Implementation (Phase 1):

β = 0.15 + (Risk Score × 0.1)

 Example:
- Risk Score = 0.5  
- β = 0.15 + (0.5 × 0.1) = 0.20  

🎯 Purpose:
- Controls pricing safety  
- Balances affordability and sustainability  

Step 6: Add Platform Margin (M)

A fixed margin is added to cover operational costs.

Typical Range:
M = ₹5 to ₹15  

Example:
M = ₹10  

 Step 7: Final Premium Calculation

 Given:
- L_w = 600  
- p = 0.3  
- α = 0.7  
- σ = 269  
- β = 0.2  
- M = 10  

 **Step 1: Core Risk Cost**
600 × 0.3 × 0.7 = 126  

 **Step 2: Volatility Adjustment**
269 × 0.2 = 53.8  

 **Step 3: Final Premium**
P_w = 126 + 53.8 + 10 = ₹189.8 ≈ ₹190/week  
Step 3: Apply Coverage Factor (α)

Coverage factor defines what percentage of income loss is covered under the plan.

Plan Options:

| Plan | Coverage (α) |
|------|-------------|
| Basic | 0.6 |
| Standard | 0.7 |
| Pro | 0.85 |

 **Step 4: Calculate Risk Volatility (σ)**

Risk volatility measures how unpredictable income loss is over time.

✅ Preferred Method: Standard Deviation

σ = sqrt( (1/n) × Σ(x_i − μ)^2 )

Where:
- x_i = historical weekly losses  
- μ = average loss  

Example:

Weekly losses:
100, 200, 300, 800  

- Average (μ) = 350  
- σ ≈ 269  

⚡ Alternative (if limited data):

σ ≈ Max Loss − Avg Loss  

Example:
σ ≈ 800 − 350 = 450  

 🎯 Purpose:
- Captures uncertainty in disruptions  
- Prevents underpricing during extreme events  

 **Step 5: Determine Risk Sensitivity (β**)

β controls how much importance is given to volatility in pricing.

✅ Preferred Method: Simulation-Based Calibration

Process:
1. Test multiple β values (0.1 to 0.3)
2. Simulate past scenarios
3. Evaluate:
   - Risk Ratio (payouts / premiums)
   - Profitability
   - Affordability

4. Select β where:
   - Risk Ratio ≈ 60–80%
   - Premium remains affordable

⚡Practical Implementation (Phase 1):

β = 0.15 + (Risk Score × 0.1)

 Example:
- Risk Score = 0.5  
- β = 0.15 + (0.5 × 0.1) = 0.20  

🎯 Purpose:
- Controls pricing safety  
- Balances affordability and sustainability  

 **Step 6: Add Platform Margin (M)**

A fixed margin is added to cover operational costs.

Typical Range:
M = ₹5 to ₹15  

Example:
M = ₹10  

 **Step 7: Final Premium Calculation**

 Given:
- L_w = 600  
- p = 0.3  
- α = 0.7  
- σ = 269  
- β = 0.2  
- M = 10  

Step 1: Core Risk Cost
600 × 0.3 × 0.7 = 126  

Step 2: Volatility Adjustment
269 × 0.2 = 53.8  

Step 3: Final Premium
P_w = 126 + 53.8 + 10 = ₹189.8 ≈ ₹190/week  


**Step 8: Risk Ratio Validation**

After computing premiums, we validate sustainability using:

Risk Ratio = Total Payouts / Total Premiums  

Ideal Range:

| Range | Interpretation |
|------|---------------|
| 60%–80% | Balanced |
| >100% | Loss |
| <50% | Overpriced |

🎯 Summary

The weekly premium model works by:

1. Estimating expected income loss  
2. Adjusting for disruption probability  
3. Applying user-selected coverage  
4. Adding a volatility buffer for uncertainty  
5. Calibrating sensitivity using β  
6. Including a small operational margin  

This ensures:
- Fair pricing for gig workers  
- Adaptability to real-world risks  
- Financial sustainability of the platform

**8.Parametric Triggers:**
## 📌 Overview

Our platform uses a **parametric insurance model**, where payouts are automatically triggered based on predefined real-world conditions.  

Unlike traditional insurance:
- ❌ No manual claims  
- ❌ No subjective verification  
- ✅ Fully automated triggers  
- ✅ Instant payout processing  

## 🧠 Core Principle

- **Triggers determine eligibility (YES/NO)**
- **Coverage plan determines payout amount (fixed percentage)**
- **Actual income loss determines payout base**

## 🧮 Payout Formula

Payout = Actual Loss × Coverage (α)

Where:
- **Actual Loss** = Verified income lost due to disruption  
- **α (Coverage Factor)** = Plan-based percentage (0.6 – 0.8)  

## 🌍 Trigger Categories

Parametric triggers are divided into two categories:

1. **Environmental Disruptions** (Natural conditions)
2. **Social Disruptions** (External/system-driven conditions)

# 🌍 1. Environmental Disruption Triggers

## 🌧️ 1.1 Extreme Rainfall

### Trigger Conditions:
- Rainfall > **60mm within 3 hours**
- Waterlogging or flooding detected

### Activity Validation:
- Orders drop ≥ **50%**
- Rider activity significantly reduced

### Eligibility:
- ✅ Payout triggered

### Payout Rules:
- Payout = Actual Loss × Coverage (α)
- Subject to weekly plan cap

## 🌡️ 1.2 Heatwave

### Trigger Conditions:
- Temperature ≥ **45°C**

### Activity Validation:
- Working hours drop ≥ **40%**

### Eligibility:
- ✅ Payout triggered

### Special Rule:
- Max payout limited to **80% of daily average income**

## 🌫️ 1.3 Hazardous Air Pollution

### Trigger Conditions:
- AQI ≥ **450**

### Activity Validation:
- Outdoor work unsafe or reduced significantly

### Eligibility:
- ✅ Payout triggered

### Special Rule:
- Max payout capped at **70% of daily income**

## 🌊 1.4 Flood / Waterlogging

### Trigger Conditions:
- Government flood alert OR
- Roads inaccessible due to waterlogging

### Activity Validation:
- Delivery routes blocked
- Orders drop ≥ **60%**

### Eligibility:
- ✅ Payout triggered

# 🏙️ 2. Social Disruption Triggers

## 🚫 2.1 Curfew / Government Restrictions

### Trigger Conditions:
- Official curfew or movement restriction

### Activity Validation:
- Orders drop ≥ **80%**
- Delivery operations halted

### Eligibility:
- ✅ Payout triggered

### Special Rule:
- Full-day loss considered

## 📉 2.2 Platform Demand Collapse

### Trigger Conditions:
- Orders drop ≥ **70%**
- No environmental trigger required

### Activity Validation:
- Low platform activity across region

### Eligibility:
- ✅ Payout triggered

### Special Rule:
- Only **60% of loss is considered** before applying coverage

## 🚧 2.3 Zone Access Restrictions

### Trigger Conditions:
- Road closures, barricades, or restricted areas

### Activity Validation:
- Delivery routes blocked or inaccessible

### Eligibility:
- ✅ Payout triggered

# 🛡️ Trigger Validation Rules

## 🔹 1. Activity Verification

Payout is only valid if:

IF (Trigger = TRUE) AND (Activity Drop ≥ Threshold)  
→ Eligible  
ELSE → No payout  

---

## 🔹 2. Minimum Duration Rule

- Trigger must persist for **at least 1–2 hours**
- Prevents false positives

---

## 🔹 3. Multiple Trigger Handling

IF multiple triggers occur  
→ Only highest impact trigger considered  

## 🔹 4. Weekly Cap Rule

- Total payout cannot exceed:
  - ₹1000 (Basic)
  - ₹2000 (Standard)
  - ₹3000 (Pro)

# 🔄 Payout Cycle

## Step 1: Real-Time Monitoring

System continuously tracks:
- Weather APIs  
- AQI data  
- Order volume  
- Location data  

## Step 2: Trigger Detection

IF any trigger condition is met  
→ Event flagged  

## Step 3: Activity Validation

- Check rider’s activity (orders, hours)
- Confirm actual disruption impact  

## Step 4: Loss Calculation

Actual Loss =  
Avg Hourly Income × Hours Lost  

## Step 5: Apply Coverage

Payout = Actual Loss × Coverage (α)  

## Step 6: Apply Caps

- Plan-based cap applied  
- Special trigger caps applied (if any)

## Step 7: Instant Payout

- Credited via UPI / wallet  
- No claim required  

# 📊 Example End-to-End Flow

### Scenario:
- Rainfall = 70mm  
- Orders drop = 60%  
- Rider loses 4 hours  
- Hourly income = ₹100  
- Plan = Standard (α = 0.7)  

### Calculation:

Actual Loss = 100 × 4 = ₹400  

Payout = 400 × 0.7 = ₹280  


# 🎯 Key Design Principles

- **Objectivity** → API-based triggers only  
- **Automation** → No manual claims  
- **Fairness** → Fixed coverage percentages  
- **Fraud Prevention** → Activity validation  
- **Sustainability** → Caps and thresholds  

# 🚀 Conclusion

This parametric trigger system ensures that:

- Gig workers are compensated only during **true disruptions**
- Payouts are **predictable and transparent**
- The platform remains **financially sustainable**

By combining **real-time data, strict thresholds, and fixed coverage**, the system delivers a reliable safety net for gig workers.

**9.🤖 AI/ML Integration**

## 📌 Overview

The platform integrates Artificial Intelligence and Machine Learning to enable **intelligent risk assessment, dynamic pricing, predictive insights, and fraud prevention**.

These components ensure:
- Fair and personalized premiums  
- Accurate disruption prediction  
- Financial sustainability  
- Secure and reliable payouts  

# 🧠 AI/ML Components

## 1. Risk Assessment Model

### 🎯 Objective
To evaluate the likelihood of income disruption for each gig worker.

### ⚙️ Functionality
- Analyzes environmental, geographic, and behavioral data  
- Predicts probability of disruption  
- Generates a normalized risk score for each user  

### 📥 Inputs
- Location and delivery zone  
- Historical environmental conditions  
- Platform activity data  
- Temporal patterns  

### 📤 Outputs
- Probability of disruption (p)  
- Risk score (0–1 scale)  

### 🧩 Role
- Forms the foundation of pricing  
- Enables personalized risk profiling  

## 2. Risk-Based Premium Calculation with Volatility Adjustment

### 🎯 Objective
To compute personalized weekly premiums by combining expected loss, disruption probability, and uncertainty (volatility).

### ⚙️ Functionality
- Calculates premiums using risk score and probability  
- Incorporates variability in income loss using volatility  
- Adjusts pricing dynamically based on uncertainty  
- Ensures balance between affordability and sustainability  

### 📥 Inputs
- Probability of disruption (p)  
- Expected income loss (L_w)  
- Coverage factor (α)  
- Historical income variability  
- Environmental variability
- 
### 📤 Outputs
- Weekly premium value  
- Volatility metric (σ)  

### 🧮 Core Logic
- Base premium derived from expected loss and probability  
- Volatility added as a buffer to handle uncertainty  
- Final premium adjusted to maintain system stability  

### 🧩 Role
- Prevents underpricing during unpredictable conditions  
- Ensures robustness of pricing model  
- Maintains financial balance of the system  

## 3. Predictive Analytics

### 🎯 Objective
To identify patterns and forecast future disruptions.

### ⚙️ Functionality
- Detects high-risk zones and time periods  
- Identifies trends in environmental and platform data  
- Provides insights for better decision-making  

### 📥 Inputs
- Historical disruption data  
- Geographic and environmental data  
- Platform activity trends  

### 📤 Outputs
- Risk classifications  
- Zone-based insights  
- Coverage recommendations  

### 🧩 Role
- Supports proactive planning  
- Enhances system efficiency and scalability  

## 4. Adaptive Learning

### 🎯 Objective
To continuously improve model accuracy over time.

### ⚙️ Functionality
- Learns from historical claims and payouts  
- Updates model parameters based on real outcomes  
- Refines predictions using feedback loops  

### 📥 Inputs
- Historical claims data  
- Prediction errors  
- User activity patterns  

### 📤 Outputs
- Updated model parameters  
- Improved prediction accuracy  

### 🧩 Role
- Ensures long-term system optimization  
- Adapts to changing real-world conditions  

## 5. Fraud Detection & Activity Validation

### 🎯 Objective
To ensure payouts are issued only for genuine disruptions.

### ⚙️ Functionality
- Validates user activity against trigger conditions  
- Detects anomalies in behavior and claim patterns  
- Identifies inconsistencies in location and activity data
  
### 📥 Inputs
- GPS/location data  
- User activity logs  
- Trigger event data  
- Historical behavior patterns  

### 📤 Outputs
- Fraud risk score  
- Validation status (approved / flagged / rejected)  

### 🧩 Role
- Prevents misuse and false claims  
- Protects financial integrity of the platform  

# 🔄 AI/ML Workflow

User Data → Risk Assessment Model → Risk Score & Probability
→ Premium + Volatility Engine → Weekly Premium

Trigger Event → Activity Validation → Fraud Detection
→ Loss Verification → Payout Processing
Feedback Loop → Adaptive Learning → Model Improvement

# AIML Algorithms or models that will be used for the above mentioned features are: 

1. Risk Assessment Model

Random Forest Classifier

Gradient Boosting (XGBoost / LightGBM)

Logistic Regression

2. Risk-Based Premium Calculation with Volatility

Linear Regression / Ridge Regression

Random Forest Regressor

Gradient Boosting Regressor

Standard Deviation / Rolling Variance

3. Predictive Analytics

K-Means Clustering

DBSCAN

ARIMA

Facebook Prophet

4. Adaptive Learning

Incremental Learning (Online Learning)

Model Retraining Pipelines

Reinforcement Learning (Optional)

5. Fraud Detection & Activity Validation

Isolation Forest

Local Outlier Factor (LOF)

Random Forest Classifier

Rule-Based Validation System

# 🎯 Key Benefits

- Personalized and adaptive pricing  
- Robust handling of uncertainty  
- Continuous system improvement  
- Strong fraud prevention  
- Scalable architecture  

---

# 🚀 Conclusion

The AI/ML system combines risk prediction, volatility handling, and adaptive learning to deliver a **stable, fair, and intelligent parametric insurance platform**.

# 10.Tech Stack & Architecture

## 📌 Overview

The platform uses a **cloud-native, microservices-based architecture** to support:

- AI-driven risk modeling  
- Real-time parametric triggers (environmental + social)  
- Automated payouts  
- Scalable analytics  

# 📱 Frontend

## Mobile App (Rider)
- Flutter  
- Google Maps SDK  
- Firebase Cloud Messaging  

## Admin Dashboard
- React.js (Next.js)  
- Tailwind CSS  
- Recharts / Chart.js  

# 🔐 Backend

- Node.js (NestJS) → Core APIs orchestration and business logic 
- Python (FastAPI) → AI/ML services  

## Microservices
- User Service  
- Policy & Pricing Service  
- Trigger Engine Service
- Payout Service  
- Fraud Detection  
- Analytics Service 

# 🤖 AI/ML Layer

- Python
- Scikit-learn  
- XGBoost / LightGBM  
- Pandas, NumPy  

### Capabilities:
- Risk assessment and scoring 
- Premium calculation with volatility   
- Predictive analytics
- Adaptive Learning 
- Fraud detection and anomaly detection

🚀 Model Serving

- FastAPI REST endpoints  
- Dockerized ML services
  
# 🗄️ Data Layer

- **MySQL** → Primary database  
- **Redis** → Caching & real-time processing  

# 🌐 External Integrations

## Environmental Data
- OpenWeather API
- WeatherStack  
- AQI API  

## Social Disruption Data
- NewsAPI  
- GNews API  
- Google Maps Platform  
- Mock delivery activity data  
- (Optional) Twitter API  

## 📦 Platform Activity Data (Simulated)

- Mock APIs for:
  - Order volume  
  - Rider activity  

Used for:
- Detecting demand collapse  
- Validating real disruption impact
  
# ⚡ Trigger Engine

- Node.js / Python  
- Apache Kafka / RabbitMQ  

### Role:
- Process real-time data  
- Detect disruption events  
- Trigger payouts  

# 💰 Payout System

- Razorpay Payout APIs  
- UPI-based transfers  
- Webhook-based confirmation  

# 🛡️ Fraud Detection

- Python ML models  
- Isolation Forest / LOF  
- Rule-based validation engine  

# 📊 Analytics & Monitoring

- React Dashboard  
- Prometheus + Grafana  
- ELK Stack  

# ☁️ Cloud & DevOps

- AWS (EC2, S3, RDS - MySQL)  
- Containerization - Docker  
- CI/CD - GitHub Actions
  
# 🔐 Security

- Firebase Auth / Auth0  
- JWT-based authentication  
- Role-Based Access Control (RBAC)  

# 🔄 System Flow
Mobile App → Backend APIs → AI Services → Premium Calculation
→ Trigger Engine (Weather + News + Maps + Activity Data)
→ Fraud Validation → Payout Processing
→ Analytics Dashboard

# 🎯 Deliverable Mapping

| Deliverable | Technology |
|------------|-----------|
Optimized Onboarding | Flutter + Firebase/Auth |
Risk Profiling | AI/ML (XGBoost, Random Forest) |
Weekly Pricing | FastAPI + Pricing Engine |
Parametric Triggers | Kafka + Multi-Source Trigger Engine |
Payout Processing | Razorpay + Backend APIs |
Analytics Dashboard | React + Chart Libraries |

# 🚀 Conclusion

The system leverages a **multi-source, AI-driven architecture** combining:

- Environmental data  
- Social disruption intelligence  
- Real-time event processing  

This ensures a **robust, scalable, and production-ready parametric insurance platform**, aligned with modern insurtech standards and Guidewire DevTrails expectations.
