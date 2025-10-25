# Product Library Implementation

## ✅ Implementation Complete

The Product Library page has been built from scratch following the complete architecture specification. This page allows users to import, manage, and store products from Amazon and any product URL (Shopify, WooCommerce, custom stores) in Airtable for use in Topics-based content generation.

---

## 🎯 What Was Implemented

### 1. Topics Onboarding Gate ✅
- **Purpose**: Ensure users complete Topics onboarding before accessing Product Library
- **Implementation**:
  ```javascript
  const hasCompletedTopics = user.topics && Array.isArray(user.topics) && user.topics.length > 0;
  
  if (!hasCompletedTopics) {
    setAccessBlocked(true);
    toast.error("Please complete the Topics onboarding first");
    return;
  }
  ```
- **Blocked State UI**: Shows a centered card with "Product Library Locked" message and a "Go to Topics Onboarding" button

### 2. Load Products from Airtable ✅
- **Table**: `Company Products`
- **Filtering**: By `client_username` (workspace scoping)
- **Fields Retrieved**:
  - `Page Name` (product name)
  - `Page Content` (description)
  - `URL` (canonical product page)
  - `Image` (product image URL)
  - `Price` (price string)
  - `SKU` (Amazon ASIN or product identifier)
  - `client_username` (brand scoping)
  - `createdTime` (Airtable record creation timestamp)

**Implementation**:
```javascript
const response = await airtableListRecords({
  tableId: "Company Products",
  filterByFormula: `{client_username} = '${username}'`,
  maxRecords: 100
});
```

### 3. Amazon Import Flow ✅
- **Button**: "Import from Amazon" (orange, ShoppingCart icon)
- **Conditional Rendering**: Only visible if `enable_amazon_import` feature flag is enabled
- **URL Input**: Text field for Amazon product URL
- **Scraping**: Calls `amazonProduct` function (via RapidAPI)
- **Data Extracted**:
  - `product_title` → `name`
  - `product_description` + `about_product` → `description`
  - `product_photos[0]` → `image_url`
  - `product_url` → `product_url`
  - `product_price` → `price`
  - `asin` → `sku`

**Error Handling**:
- **429 Rate Limit**: Shows specific toast: "Amazon Import Quota Reached. You've used all your free Amazon data requests for the month. To continue, please upgrade your plan on RapidAPI."

### 4. General URL Import Flow ✅
- **Button**: "Import from Product URL" (dark slate, Package icon)
- **URL Input**: Text field for any product page URL
- **Scraping**: Calls `extractProductMeta` function
- **Data Extracted**:
  - Open Graph tags (`og:title`, `og:description`, `og:image`)
  - JSON-LD structured data (Product schema)
  - Fallback HTML parsing
  - Image validation (HEAD request for content-type/size)

**Supported Platforms**:
- ✅ Shopify
- ✅ WooCommerce
- ✅ BigCommerce
- ✅ Custom stores with Open Graph tags
- ✅ Any site with structured Product schema

### 5. AI Rewrite Functionality ✅
- **Wand Buttons**: Two AI rewrite buttons (Wand2 icon)
  1. **Product Name**: Rewrites title to be concise and SEO-friendly (~8 words)
  2. **Description**: Rewrites description to be engaging and conversion-focused (~70 words)

**Implementation**:
```javascript
const handleRewrite = async (field) => {
  // 1. Token consumption check
  const tokenResult = await app.functions.checkAndConsumeTokens({
    userId: currentUser.id,
    featureName: field === 'name' ? 'ai_title_rewrite' : 'ai_product_description_rewrite'
  });
  
  if (!tokenResult.ok) {
    toast.error("Insufficient tokens.");
    return;
  }
  
  // 2. Construct prompt
  const prompt = field === 'name'
    ? `Rewrite the following product title to be a concise, compelling, and SEO-friendly headline of around 8 words...`
    : `Rewrite the following product description to be engaging and conversion-focused, under 70 words...`;
  
  // 3. Call LLM
  const response = await app.functions.invoke('llmRouter', { prompt });
  const rewrittenText = response.data.trim();
  
  // 4. Update state
  setAmazonProductData((prev) => ({ ...prev, [field]: rewrittenText }));
  toast.success(`${field} rewritten with AI.`);
};
```

**Token Costs**:
- `ai_title_rewrite`: 1 token (default)
- `ai_product_description_rewrite`: 1 token (default)

### 6. Save to Airtable ✅
- **Trigger**: "Save Product" button (blue)
- **Validation**: Requires `name.trim()` to be non-empty
- **Fields Written**:
  ```javascript
  {
    "Page Name": name.trim(),
    "Page Content": description || "",
    "URL": product_url.trim(),
    "client_username": globalUsername,
    "Status": "Add to Pinecone",  // Triggers RAG ingestion
    "Image": image_url || "",
    "Price": price || "",
    "SKU": sku || ""
  }
  ```

**Critical Field**: `Status: "Add to Pinecone"`
- This signals downstream automation (N8N/Zapier/custom worker) to:
  1. Chunk the product content
  2. Generate embeddings via OpenAI
  3. Store vectors in Pinecone
  4. Update Status to "Completed"

### 7. Product Grid Display ✅
- **Layout**: Responsive grid (1 column mobile, 2 columns tablet, 3 columns desktop)
- **Card Contents**:
  - Product image (with fallback if load fails)
  - Product name
  - Price (if available)
  - Created date
  - "View Product" link (external, opens in new tab)
  - Delete button (top-right, red)

**Empty State**: Shows centered empty state with "No products yet" message and "Import Your First Product" button

### 8. Delete Product ✅
- **Trigger**: Trash2 icon button (top-right of product card)
- **Confirmation Dialog**: AlertDialog with "Delete Product" title
- **Implementation**:
  ```javascript
  await airtableDeleteRecord({
    tableId: "Company Products",
    recordId: product.id
  });
  
  toast.success("Product deleted successfully!");
  await loadProducts(currentUser); // Reload grid
  ```

### 9. Workspace Scoping ✅
- **Context**: Uses `WorkspaceProvider` and `useWorkspace` hook
- **Scoping Variable**: `selectedUsername` from workspace context
- **Filtering**: All Airtable queries filter by `{client_username} = '${selectedUsername}'`
- **Validation**: Import buttons disabled if `!globalUsername`

---

## 📁 Files Created/Modified

### Created
1. **`src/pages/ProductLibrary.jsx`** (641 lines)
   - Main Product Library component
   - Topics onboarding gate
   - Amazon & general URL import flows
   - AI rewrite handlers
   - Airtable CRUD operations
   - Product grid UI
   - Delete confirmation dialog

### Modified
2. **`src/api/appClient.js`**
   - Added `airtableListRecords` function
   - Added `airtableUpdateRecord` function
   - Added `airtableDeleteRecord` function
   - Added `extractProductMeta` function

### Already Existed (No Changes)
3. **`src/pages/index.jsx`**
   - ProductLibrary import already present (line 139)
   - Route already in PAGES object

4. **`src/pages/Layout.jsx`**
   - "Topic Products" menu item already present (line 52)
   - Location: Content → Topic Products

5. **`src/api/functions.js`**
   - All required function exports already present

---

## 🔧 Backend Function Contracts

### 1. `amazonProduct`
**Endpoint**: `/api/products/amazon-product`

**Input**:
```javascript
{
  url: "https://www.amazon.com/dp/B08N5WRWNW"
}
```

**Output**:
```javascript
{
  data: {
    success: true,
    data: {
      product_title: "Apple AirPods Pro (2nd Gen)",
      product_description: "Active Noise Cancellation...",
      product_photos: ["https://m.media-amazon.com/images/..."],
      product_url: "https://www.amazon.com/dp/B08N5WRWNW",
      product_price: "$249.00",
      asin: "B08N5WRWNW",
      about_product: ["Feature 1", "Feature 2"]
    }
  }
}
```

**Error Cases**:
- 429: Monthly quota exceeded → Show upgrade message

### 2. `extractProductMeta`
**Endpoint**: `/api/products/extract-product-meta`

**Input**:
```javascript
{
  url: "https://example.com/product/amazing-blender"
}
```

**Output**:
```javascript
{
  data: {
    success: true,
    title: "Amazing Blender Pro 3000",
    description: "This high-performance blender features...",
    price: "$149.99",
    images: [
      "https://example.com/images/blender-main.jpg",
      "https://example.com/images/blender-side.jpg"
    ],
    url: "https://example.com/products/amazing-blender"
  }
}
```

**Extraction Logic**:
1. Fetch HTML page with browser headers
2. Parse Open Graph tags (`og:title`, `og:description`, `og:image`)
3. Parse JSON-LD structured data (Product schema)
4. Extract meta tags (`description`, `twitter:title`)
5. Validate images (HEAD request for content-type)
6. Return first valid image

### 3. `airtableCreateRecord`
**Endpoint**: `/api/airtable/create-record`

**Input**:
```javascript
{
  tableId: "Company Products",
  fields: {
    "Page Name": "Apple AirPods Pro",
    "Page Content": "Active Noise Cancellation...",
    "URL": "https://www.amazon.com/dp/B08N5WRWNW",
    "client_username": "mybrand",
    "Status": "Add to Pinecone",
    "Image": "https://m.media-amazon.com/images/...",
    "Price": "$249.00",
    "SKU": "B08N5WRWNW"
  }
}
```

**Output**:
```javascript
{
  data: {
    success: true,
    record: {
      id: "recXXXXXXXXXXXXXX",
      fields: { ... },
      createdTime: "2025-01-25T15:30:00.000Z"
    }
  }
}
```

### 4. `airtableListRecords`
**Endpoint**: `/api/airtable/list-records`

**Input**:
```javascript
{
  tableId: "Company Products",
  filterByFormula: "{client_username} = 'mybrand'",
  maxRecords: 100
}
```

**Output**:
```javascript
{
  data: {
    success: true,
    records: [
      {
        id: "recXXXXXXXXXXXXXX",
        fields: {
          "Page Name": "Apple AirPods Pro",
          "Page Content": "Active Noise Cancellation...",
          "URL": "https://www.amazon.com/dp/B08N5WRWNW",
          "client_username": "mybrand",
          "Status": "Add to Pinecone",
          "Image": "https://m.media-amazon.com/images/...",
          "Price": "$249.00",
          "SKU": "B08N5WRWNW"
        },
        createdTime: "2025-01-25T15:30:00.000Z"
      }
    ]
  }
}
```

### 5. `airtableDeleteRecord`
**Endpoint**: `/api/airtable/delete-record`

**Input**:
```javascript
{
  tableId: "Company Products",
  recordId: "recXXXXXXXXXXXXXX"
}
```

**Output**:
```javascript
{
  data: {
    success: true,
    recordId: "recXXXXXXXXXXXXXX"
  }
}
```

### 6. `llmRouter`
**Endpoint**: `/api/llm-router`

**Input**:
```javascript
{
  prompt: "Rewrite the following product title to be a concise, compelling, and SEO-friendly headline of around 8 words. Output only the new title.\n\nOriginal Title: \"Apple AirPods Pro (2nd Generation) with MagSafe Charging Case\"\n\nProduct Description (for context): \"Active Noise Cancellation blocks outside noise...\""
}
```

**Output**:
```javascript
{
  data: "Apple AirPods Pro 2nd Gen with MagSafe"
}
```

---

## 🔄 Complete User Flow

### Flow 1: Amazon Import
```
1. User clicks "Import from Amazon"
   ↓
2. Amazon URL input appears
   ↓
3. User pastes: https://www.amazon.com/dp/B08N5WRWNW
   ↓
4. Clicks "Fetch Product"
   ↓
5. Frontend calls amazonProduct({ url })
   ↓
6. Backend extracts ASIN: B08N5WRWNW
   ↓
7. Backend queries RapidAPI: GET /product-details?asin=B08N5WRWNW
   ↓
8. RapidAPI returns structured data
   ↓
9. Frontend displays edit form with pre-filled data
   ↓
10. User clicks "Rewrite title with AI" (optional)
    ↓
11. Token check → Consume 1 token
    ↓
12. Call llmRouter with prompt
    ↓
13. LLM returns optimized title
    ↓
14. Update product name field
    ↓
15. User clicks "Save Product"
    ↓
16. Frontend calls airtableCreateRecord()
    ↓
17. Airtable creates record with Status="Add to Pinecone"
    ↓
18. Frontend reloads product grid
    ↓
19. Toast: "Product added to library!"
```

### Flow 2: General URL Import
```
1. User clicks "Import from Product URL"
   ↓
2. URL input appears
   ↓
3. User pastes: https://example.com/products/amazing-blender
   ↓
4. Clicks "Fetch"
   ↓
5. Frontend calls extractProductMeta({ url })
   ↓
6. Backend fetches HTML page
   ↓
7. Backend parses Open Graph tags, JSON-LD
   ↓
8. Backend validates images
   ↓
9. Backend returns structured data
   ↓
10. Frontend displays edit form (same as Amazon)
   ↓
11-19. Same as Amazon import (steps 10-19)
```

### Flow 3: Product → Topics Integration (External)
```
[Product Library]
  ↓ (saves to Airtable)
[Airtable: Company Products]
  Status="Add to Pinecone"
  ↓
[N8N/Zapier Automation] (EXTERNAL - not implemented in this feature)
  - Watches Airtable for Status="Add to Pinecone"
  - Chunks Page Content (500-1000 chars)
  - Generates embeddings via OpenAI API
  - Stores vectors in Pinecone with metadata:
    {
      page_name: "Apple AirPods Pro",
      url: "https://amazon.com/...",
      client_username: "mybrand"
    }
  - Updates Airtable Status → "Completed"
  ↓
[Pinecone Vector DB]
  ↓ (similarity search)
[Topics Page - Create Article]
  - User clicks "Create Article" on keyword
  - Backend queries Pinecone for relevant products
  - LLM receives product context
  - Generates article mentioning products naturally
```

---

## 🎨 UI/UX Details

### Color Scheme
- **Primary Actions**: Slate 800 (Import from URL), Orange 500 (Import from Amazon), Blue 600 (Save)
- **Danger Actions**: Red 500 (Delete)
- **AI Actions**: Outline with Wand2 icon
- **Backgrounds**: Slate 50 (page), White (cards), Slate 100 (hover states)

### Icons
- **Package**: Product Library icon, empty state
- **ShoppingCart**: Amazon import button
- **LinkIcon**: URL input prefix
- **Wand2**: AI rewrite buttons
- **Loader2**: Loading states (spinning)
- **Trash2**: Delete button
- **ExternalLink**: View Product link
- **ArrowLeft**: Back button
- **X**: Close/cancel buttons

### Responsive Breakpoints
- **Mobile** (default): 1 column grid
- **Tablet** (md): 2 column grid
- **Desktop** (lg): 3 column grid

### Loading States
- **Initial Load**: Centered Loader2 spinner
- **Fetching Product**: Button shows "Fetching" with spinner
- **Saving**: Button shows "Saving..." with spinner
- **AI Rewrite**: Wand2 icon replaced with spinner

---

## 🚨 Error Handling

### 1. Topics Onboarding Not Complete
**Error**: `user.topics.length === 0`
**UI**: "Product Library Locked" card with link to Topics
**Action**: Redirect user to Topics page

### 2. No Workspace Selected
**Error**: `!globalUsername`
**UI**: Import buttons disabled, red text below input
**Action**: User must select workspace from global dropdown

### 3. Amazon Quota Exceeded
**Error**: RapidAPI returns 429 with "exceeded the MONTHLY quota"
**UI**: Toast with 10s duration
**Message**: "Amazon Import Quota Reached. You've used all your free Amazon data requests for the month. To continue, please upgrade your plan on RapidAPI."
**Action**: User must upgrade RapidAPI plan

### 4. Product URL Fetch Failed
**Error**: `extractProductMeta` returns `success: false`
**UI**: Toast error
**Message**: "Failed to fetch product metadata from the URL. Please ensure it's a valid product page."
**Action**: User tries different URL or checks URL validity

### 5. Insufficient Tokens
**Error**: `checkAndConsumeTokens` returns `ok: false`
**UI**: Toast error
**Message**: "Insufficient tokens."
**Action**: User must purchase more tokens

### 6. Airtable Save Failed
**Error**: `airtableCreateRecord` throws exception
**UI**: Toast error
**Message**: "Failed to save the imported product."
**Action**: Check console logs, retry

### 7. Product Delete Failed
**Error**: `airtableDeleteRecord` throws exception
**UI**: Toast error
**Message**: "Failed to delete product: [error message]"
**Action**: Check console logs, retry

---

## 🧪 Testing Checklist

### Onboarding Gate
- [ ] User with `topics: []` sees "Product Library Locked" message
- [ ] User with `topics: ["mybrand"]` can access page
- [ ] "Go to Topics Onboarding" button navigates to Topics page

### Amazon Import
- [ ] "Import from Amazon" button only visible if feature flag enabled
- [ ] Amazon URL input accepts valid ASIN URLs
- [ ] Fetch button disabled without URL
- [ ] Fetch button disabled without workspace selected
- [ ] Product data populates edit form correctly
- [ ] Quota exceeded shows upgrade message

### General URL Import
- [ ] "Import from Product URL" button always visible
- [ ] URL input accepts Shopify/WooCommerce/custom URLs
- [ ] Fetch button disabled without URL
- [ ] Fetch button disabled without workspace selected
- [ ] Product data populates edit form correctly
- [ ] Invalid URLs show error message

### AI Rewrite
- [ ] Wand buttons show spinner when rewriting
- [ ] Title rewrite produces ~8 word headline
- [ ] Description rewrite produces ~70 word content
- [ ] Token consumption works correctly
- [ ] Insufficient tokens shows error

### Save Product
- [ ] Save button disabled without product name
- [ ] Save creates Airtable record with all fields
- [ ] Status field set to "Add to Pinecone"
- [ ] Product appears in grid after save
- [ ] Toast confirmation shows

### Product Grid
- [ ] Products load on page mount
- [ ] Grid responsive (1/2/3 columns)
- [ ] Product images display correctly
- [ ] Broken images hide gracefully
- [ ] Prices display when available
- [ ] Created dates format correctly
- [ ] "View Product" link opens in new tab

### Delete Product
- [ ] Delete button shows confirmation dialog
- [ ] Cancel closes dialog without deleting
- [ ] Confirm deletes product from Airtable
- [ ] Product removes from grid after delete
- [ ] Toast confirmation shows

### Workspace Scoping
- [ ] Products filtered by `client_username`
- [ ] Switching workspaces reloads products
- [ ] Import buttons disabled without workspace
- [ ] Saved products use correct `client_username`

---

## 🔮 Future Enhancements (Not Implemented)

These features were **NOT** implemented but could be considered:

1. **Edit Product**: Currently no edit functionality (only delete)
2. **Bulk Import**: Import multiple products from CSV/spreadsheet
3. **Product Categories**: Tag products with categories for better organization
4. **Product Search**: Search/filter products by name, price, SKU
5. **Price Tracking**: Monitor price changes from original URL
6. **Product Analytics**: Track which products are most used in articles
7. **Duplicate Detection**: Warn if product URL already exists
8. **Image Gallery**: Support multiple images per product
9. **Product Variants**: Handle product variations (size, color, etc.)
10. **Export Products**: Download product library as CSV

---

## 📚 Dependencies

### Frontend
- `react`, `react-router-dom`: Core React dependencies
- `@/components/ui/*`: Shadcn/ui components (Button, Input, Textarea, Label, AlertDialog)
- `lucide-react`: Icons (Package, ShoppingCart, LinkIcon, etc.)
- `sonner`: Toast notifications
- `@/api/entities`: User entity
- `@/api/functions`: Airtable and product scraping functions
- `@/api/appClient`: Token consumption function
- `@/components/hooks/useWorkspace`: Workspace context hook
- `@/components/hooks/useFeatureFlag`: Feature flag hook

### Backend (Not Implemented in This PR)
These backend functions must exist for the Product Library to work:

- **`/api/products/amazon-product`**: Amazon scraping via RapidAPI
- **`/api/products/extract-product-meta`**: General URL scraping
- **`/api/airtable/create-record`**: Create Airtable record
- **`/api/airtable/list-records`**: List Airtable records with filtering
- **`/api/airtable/delete-record`**: Delete Airtable record
- **`/api/llm-router`**: AI rewrite endpoint
- **`/api/tokens/check-and-consume`**: Token consumption

### Environment Variables
- `RAPIDAPI_AMAZON_KEY`: RapidAPI key for Amazon product data
- `AIRTABLE_API_KEY`: Airtable API key
- `AIRTABLE_BASE_ID`: Airtable base ID
- `OPENAI_API_KEY`: OpenAI API key (for embeddings/LLM)

---

## ✅ Implementation Status

**Status**: ✅ **COMPLETE**

All requested features have been implemented:
1. ✅ Topics onboarding gate
2. ✅ Load products from Airtable
3. ✅ Amazon import (via RapidAPI)
4. ✅ General URL import (Open Graph + JSON-LD scraping)
5. ✅ AI rewrite for name & description
6. ✅ Save to Airtable with `Status="Add to Pinecone"`
7. ✅ Product grid display
8. ✅ Delete products
9. ✅ Workspace scoping

**NOT Implemented** (As Requested):
- ❌ Flash features on Product Library
- ❌ RAG/Pinecone integration (handled externally)
- ❌ N8N/Zapier automation setup
- ❌ Topics page product flow (already handled elsewhere)

**Deployment**: Changes committed and pushed to GitHub (commit: `81b7070`)

**Next Steps**:
1. Test Product Library page in production
2. Verify Amazon import (check RapidAPI quota)
3. Test general URL import on Shopify/WooCommerce
4. Confirm AI rewrite token consumption
5. Ensure Airtable records are created correctly
6. Verify Topics page can access products via RAG (external)

