# Iterative Schema Update Approach

## 📝 Current Status

**We are currently populating dummy data in Supabase and will keep adding or altering fields in the schema according to the data so that no data points are missing and all is stored.**

---

## 🔄 Iterative Process

### Phase 1: Initial Schema Deployment ✅
- Deployed `COMPLETE_SCHEMA.sql` to Supabase
- Created all 51 tables across 3 layers
- Basic structure in place

### Phase 2: Data Population (Current) 🔄
- Populating dummy/test data in Supabase
- Testing data ingestion flow
- Identifying missing fields
- Identifying data points not being stored

### Phase 3: Schema Refinement (Ongoing) 🔄
- Adding missing fields as data comes in
- Altering field types if needed
- Adding new tables if required
- Ensuring all data points are captured

### Phase 4: Final Schema (Future) 📋
- Complete schema with all fields
- All data points properly stored
- Production-ready structure

---

## 📊 Update Strategy

### When Adding New Fields:
1. **Identify missing data point** from API response
2. **Add field to appropriate table** (Layer A, B, or C)
3. **Update ingestion code** to populate new field
4. **Test with real data**
5. **Document the change**

### When Altering Fields:
1. **Identify data type mismatch** (e.g., string vs numeric)
2. **Alter column type** in Supabase
3. **Update parsing logic** in code
4. **Test data conversion**
5. **Document the change**

### When Adding New Tables:
1. **Identify new data structure** not fitting existing tables
2. **Create new table** in appropriate layer
3. **Add foreign keys** and indexes
4. **Update ingestion code**
5. **Test and document**

---

## ✅ Current Approach

**We are:**
- ✅ Populating dummy data in Supabase
- ✅ Monitoring which fields are being used
- ✅ Identifying missing data points
- ✅ Adding/altering fields as needed
- ✅ Ensuring no data is lost

**We will:**
- ✅ Keep updating schema iteratively
- ✅ Add fields as we discover missing data points
- ✅ Alter field types if data doesn't fit
- ✅ Ensure all API response data is stored
- ✅ Document all changes

---

## 📋 Schema Update Log

### Updates Made:
1. ✅ Removed `mfc_consent_requests` table (not required)
2. ✅ Removed `pan` from `app_users` (PII compliance)
3. ✅ Removed subscription fields from `app_users` (use `user_subscriptions`)
4. ✅ Made `consent_id` nullable in `aa_data_fetch_runs`
5. ✅ Added `fip_id_str` to `fi_accounts` (for string FIP ID)
6. ✅ Added `transaction_timestamp` to `fi_transactions` (code compatibility)
7. ✅ Added `current_balance` to `fi_transactions` (code compatibility)
8. ✅ Added `available_balance` to `fi_deposit_summaries`
9. ✅ Added missing fields to `user_financial_snapshots`

### Future Updates (As Needed):
- Will add fields as data comes in
- Will alter types if needed
- Will add tables if new structures needed

---

## 🎯 Goal

**Ensure 100% data coverage:**
- ✅ All API response fields stored
- ✅ No data points missing
- ✅ All layers properly filled
- ✅ Schema matches actual data structure

**We will keep updating until all data points are captured!** ✅

