# Unstructured.io Setup Guide

Universal document processing for 50+ file formats including PDF, Images (OCR), Office docs, and more.

## Step 1: Sign Up for Unstructured.io

1. Go to: https://unstructured.io/
2. Click "Get Started" or "Sign Up"
3. Create a free account
4. Verify your email

## Step 2: Get Your API Key

1. Log in to your Unstructured.io dashboard
2. Navigate to "API Keys" section
3. Click "Create New API Key"
4. Copy the API key (starts with `unstructured_...`)

## Step 3: Add API Key to Environment Variables

### For Local Development:
Add to your `.env.local` file:
```bash
UNSTRUCTURED_API_KEY=your_api_key_here
```

### For Vercel Deployment:
1. Go to Vercel Dashboard → Your Project
2. Click "Settings" → "Environment Variables"
3. Add new variable:
   - **Name:** `UNSTRUCTURED_API_KEY`
   - **Value:** Your API key
   - **Environment:** Production, Preview, Development (select all)
4. Click "Save"
5. Redeploy your app

## Step 4: Test the Integration

1. Go to your admin portal: `/admin/sbir-database`
2. Upload a test document (PDF, image, etc.)
3. Should extract text and keywords automatically

## Pricing (as of 2024)

**Free Tier:**
- 1,000 pages per month
- All file formats supported
- OCR included
- Perfect for testing and small projects

**Paid Plans:**
- $0.01 per page after free tier
- Volume discounts available
- Enterprise options for high-volume

## Supported File Types (50+)

### Documents
- PDF (including scanned/image-based)
- Microsoft Word (.doc, .docx)
- Microsoft PowerPoint (.ppt, .pptx)
- Microsoft Excel (.xls, .xlsx)
- OpenDocument (.odt, .odp, .ods)
- Rich Text Format (.rtf)
- Plain Text (.txt, .md)

### Images (with OCR)
- PNG, JPG, JPEG
- GIF, TIFF, BMP, WebP
- Scanned documents

### Web
- HTML, HTM

### Email
- MSG, EML

### Other
- CSV (data extraction)
- EPUB (e-books)

## Troubleshooting

### Error: "UNSTRUCTURED_API_KEY not configured"
- Make sure you added the API key to environment variables
- For Vercel: Redeploy after adding the variable
- For local: Restart your dev server

### Error: "API error (401)"
- API key is invalid or expired
- Check your API key in Unstructured.io dashboard
- Make sure there are no extra spaces in the key

### Error: "API error (429)"
- You've exceeded the free tier limit (1,000 pages/month)
- Upgrade to a paid plan or wait until next month
- Check your usage in the Unstructured.io dashboard

## Alternative: Self-Hosted Option

If you want to avoid API limits or costs, Unstructured.io offers a self-hosted Docker container:

```bash
docker run -p 8000:8000 downloads.unstructured.io/unstructured-io/unstructured-api:latest
```

Then set:
```bash
UNSTRUCTURED_API_URL=http://localhost:8000/general/v0/general
UNSTRUCTURED_API_KEY=your_local_key
```

See: https://github.com/Unstructured-IO/unstructured-api

## Support

- Documentation: https://unstructured-io.github.io/unstructured/
- GitHub: https://github.com/Unstructured-IO/unstructured
- Support: support@unstructured.io

