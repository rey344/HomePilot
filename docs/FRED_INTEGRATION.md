# FRED API Integration - Setup Complete 

## What Was Set Up

The **backend** can return **real-time mortgage rates** from the Federal Reserve (FRED API) via `GET /api/v1/real-estate/current-rate`. The real-estate search flow uses this rate when set. The calculator on the frontend uses a **user-entered rate** (it does not auto-fill from FRED unless you wire it to this endpoint).

---

## Where to Add Your API Key

Copy [infrastructure/.env.example](../infrastructure/.env.example) to `infrastructure/.env` if you haven’t already, then add your FRED API key:

```bash
FRED_API_KEY=your_fred_api_key_here
```

After restarting the backend, the current-rate endpoint and any backend logic that calls it (e.g. real-estate search) will use real rates.

---

## 🔍 How It Works

### **Before (Hardcoded):**
```python
interest_rate = 6.5  # Wrong if actual rate is 7.2%!
```

### **After (Real-Time):**
```python
interest_rate = await get_current_mortgage_rate()  # Fetches 7.12% from FRED
```

---

## 🚀 Testing the Integration

### **1. Start your backend:**
```bash
cd backend
uvicorn app.main:app --reload --port 9001
```

### **2. Test the rate endpoint:**
```bash
curl http://localhost:9001/api/v1/real-estate/current-rate
```

**Expected Response:**
```json
{
  "rate": 7.12,
  "date": "2026-03-03",
  "source": "FRED (Federal Reserve)",
  "series": "MORTGAGE30US",
  "cached": false
}
```

### **3. Without API Key (Fallback):**
If you don't set `FRED_API_KEY`, the app uses 6.5% default:
```json
{
  "rate": 6.5,
  "source": "Default"
}
```

---

##  What Changed

| File | Change |
|------|--------|
| [infrastructure/.env.example](../infrastructure/.env.example) | `FRED_API_KEY=` documented (copy to `.env` and set) |
| [backend/app/config.py](../backend/app/config.py) | Added `fred_api_key` setting |
| [backend/app/real_estate_services/fred_rates.py](../backend/app/real_estate_services/fred_rates.py) | **NEW FILE** - FRED API client |
| [backend/app/api/real_estate.py](../backend/app/api/real_estate.py) | Uses `get_current_mortgage_rate()` |
| [backend/app/schemas/profile.py](../backend/app/schemas/profile.py) | Updated description |

---

##  Benefits

 **Accurate calculations** - Always uses current market rates  
 **User trust** - Show "Based on today's 7.1% rate"  
 **Automatic updates** - Cached for 24 hours, then refreshes  
 **Fail-safe** - Falls back to 6.5% if API unavailable  
 **FREE** - No cost, unlimited calls  

---

##  Your API Key is Safe

-  `.env` file is gitignored (never committed)
-  Only accessible from backend server
-  Not exposed to frontend/users

---

##  Next Steps

1. **Add your FRED_API_KEY to** [infrastructure/.env](../infrastructure/.env) (copy from `.env.example` first if needed)
2. **Restart your backend** to load the new config
3. **Test the endpoint** (see above)
4. Done! The backend current-rate endpoint (and flows that use it) now use real rates.

---

##  Troubleshooting

**Issue:** Getting 6.5% rate even with API key set  
**Solution:** 
1. Check `.env` file has `FRED_API_KEY=your_key` (not empty)
2. Restart backend to reload config
3. Check logs for FRED API errors

**Issue:** "FRED_API_KEY not set" warning  
**Solution:** Make sure backend loads from `infrastructure/.env`:
```bash
cd backend
export $(grep -v '^#' ../infrastructure/.env | xargs)
uvicorn app.main:app --reload
```

---

##  FRED API Resources

- **Get API Key:** https://fred.stlouisfed.org/docs/api/api_key.html
- **Documentation:** https://fred.stlouisfed.org/docs/api/fred/
- **MORTGAGE30US Series:** https://fred.stlouisfed.org/series/MORTGAGE30US
