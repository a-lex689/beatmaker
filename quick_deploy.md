# 🚀 Quick Deploy Guide - BeatMaker App

## Step 1: Complete Google Drive Setup (Do This First!)

While your files are uploading to Google Drive, let's prepare for deployment:

### 1.1 Run the Google Drive Setup Script
```bash
cd backend
python setup_google_drive.py
```

**What this does:**
- Maps your Google Drive files to the app
- Creates the file ID mappings needed for the app to work
- You'll need the Google Drive share URLs for each audio file

### 1.2 Test Locally (After Google Drive setup)
```bash
# Backend (Terminal 1)
cd backend
python app.py

# Frontend (Terminal 2) 
cd web-app
npm run dev
```

Visit `http://localhost:5173` to test everything works!

## Step 2: Deploy Backend (5 minutes)

### Option A: Render.com (Recommended - Free)
1. Go to https://render.com and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Settings:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python app.py`
   - **Environment Variables:**
     - `FLASK_RUN_PORT`: `10000`

### Option B: Railway.app (Alternative - Free $5 credit)
1. Go to https://railway.app and sign up
2. Click "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects everything!

## Step 3: Deploy Frontend (2 minutes)

### Option A: Netlify (Recommended - Free)
1. Build your frontend first:
   ```bash
   npm run build
   ```
2. Go to https://netlify.com and sign up
3. Drag and drop your `dist/` folder to deploy
4. Update environment variables:
   - `REACT_APP_API_URL`: Your backend URL from Step 2

### Option B: Vercel (Alternative)
1. Go to https://vercel.com and sign up
2. Import your GitHub repository
3. Vercel auto-builds and deploys!

## Step 4: Configure CORS (Important!)

Update your backend's CORS settings with your frontend URL:

```python
# In backend/app.py, update this line:
CORS(app, origins=["https://your-frontend-url.netlify.app"])
```

## Step 5: Test Your Live App! 🎉

1. Visit your frontend URL
2. Try loading stems (should load from Google Drive)
3. Create a beat and export it
4. Share the URL with friends!

## Troubleshooting

### "Files not loading"
- Check Google Drive file permissions (must be "Anyone with link can view")
- Verify file mappings in `drive_file_mappings.py`

### "CORS errors"
- Update CORS origins in `app.py` with your frontend URL
- Redeploy backend

### "App is slow"
- First load from Google Drive takes 1-3 seconds (normal)
- Files are cached after first download

## What You Get

✅ **Professional web app** accessible from any device  
✅ **Google Drive integration** - no file size limits  
✅ **Free hosting** - $0/month to start  
✅ **Automatic fallbacks** - works even without external tools  
✅ **Mobile responsive** - works on phones and tablets  
✅ **Shareable** - send the link to anyone  

## Next Steps After Deployment

1. **Custom domain** (optional): Add your own domain name
2. **Analytics**: Track how many people use your app
3. **PWA features**: Make it installable like a native app
4. **User accounts**: Let people save their beats
5. **More features**: Add effects, collaboration, etc.

---

**Ready? Start with Step 1 - the Google Drive setup is the most important part!**

**Need help?** The full detailed guide is in `backend/deploy_guide.md`