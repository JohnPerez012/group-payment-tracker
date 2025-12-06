# QR Code Feature - Testing Guide

## ✅ Yes, it's runnable now!

When you scan the QR code containing:
```
https://group-payment-tracker.web.app/LandingPage.html?searchuid=1u4p2y5m3w2v3y71%40GPT
```

The browser will automatically decode `%40` to `@`, resulting in:
```
https://group-payment-tracker.web.app/LandingPage.html?searchuid=1u4p2y5m3w2v3y71@GPT
```

## What Happens Automatically:

1. **Page Loads** - Landing page opens
2. **URL Detection** - Script detects `searchuid` parameter
3. **Scroll Animation** - Smoothly scrolls to search section (1.5s delay)
4. **Auto-Fill** - Fills the UID into the search input
5. **Auto-Search** - Clicks the search button (0.8s after scroll)
6. **Modal Opens** - Search results modal appears with payment data
7. **URL Cleanup** - Removes the parameter from URL (1s after search)

## Testing Steps:

### Test 1: Generate QR Code
1. Open the app: `https://group-payment-tracker.web.app/`
2. Sign in with Google
3. Select or create a tab
4. Click the blue QR icon next to "Whole Progress Overview"
5. ✅ Modal should appear centered on screen
6. ✅ QR code should be visible
7. ✅ UID should be displayed

### Test 2: Download QR Code
1. In the QR modal, click "Download QR"
2. ✅ PNG file should download with name like `GPTracker-QR-1u4p2y5m3w2v3y71_GPT.png`
3. ✅ Button should turn green and show "✓ Downloaded!"
4. ✅ Button should return to normal after 2 seconds

### Test 3: Copy Link
1. In the QR modal, click "Copy Link"
2. ✅ Link should be copied to clipboard
3. ✅ Button should turn green and show "✓ Copied!"
4. ✅ Paste the link - it should be: `https://group-payment-tracker.web.app/LandingPage.html?searchuid=<YOUR_UID>`

### Test 4: Scan QR Code (Mobile)
1. Use your phone's camera or QR scanner app
2. Scan the downloaded QR code
3. ✅ Browser should open the link
4. ✅ Page should load and scroll to search section
5. ✅ Search input should be filled with the UID
6. ✅ Search should trigger automatically
7. ✅ Results modal should open showing payment data
8. ✅ URL should clean up to just `https://group-payment-tracker.web.app/`

### Test 5: Direct Link (Desktop)
1. Copy the link from the QR modal
2. Open a new browser tab/window
3. Paste and navigate to the link
4. ✅ Same behavior as scanning QR code

### Test 6: Modal Behavior
1. Open QR modal
2. ✅ Background should be dark with blur
3. ✅ Page scrolling should be disabled
4. ✅ Click outside modal - should close
5. ✅ Press Escape key - should close
6. ✅ Click X button - should close

## Console Logs to Watch For:

When auto-search is triggered, you should see:
```
🔍 Auto-search triggered for UID: 1u4p2y5m3w2v3y71@GPT
✅ Search form found, initiating auto-search...
📜 Scrolled to search section
📝 Filled search input with UID: 1u4p2y5m3w2v3y71@GPT
🚀 Triggering search...
🧹 Cleaned up URL
```

## Troubleshooting:

### QR Code doesn't generate
- **Check**: Is a tab selected?
- **Check**: Does the tab have a UID?
- **Check**: Console for errors

### Download fails
- **Check**: Browser allows downloads
- **Check**: Pop-up blocker settings
- **Check**: Console for errors

### Copy fails
- **Check**: Browser supports clipboard API
- **Check**: Page is served over HTTPS
- **Fallback**: Manual copy prompt should appear

### Auto-search doesn't work
- **Check**: Are you on the landing page?
- **Check**: Console logs for debugging info
- **Check**: Search form exists on page
- **Wait**: Give it 1.5-2 seconds to trigger

## Browser Compatibility:

✅ **Chrome/Edge**: Full support
✅ **Firefox**: Full support  
✅ **Safari**: Full support (iOS 13.1+)
✅ **Mobile browsers**: Full support

## Known Limitations:

1. **QR Code Size**: Fixed at 256x256px
2. **Tab Limit**: Only works with saved tabs (must have UID)
3. **Network Required**: Auto-search requires internet connection
4. **Landing Page Only**: Auto-search only works on landing page

## Success Criteria:

✅ QR code generates correctly
✅ QR code downloads as PNG
✅ Link copies to clipboard
✅ Scanning QR opens correct URL
✅ Auto-search triggers on landing page
✅ Search results display correctly
✅ Modal appears centered and above everything
✅ All close methods work (X, overlay, Escape)
✅ No console errors
✅ URL cleans up after search

## Next Steps:

If everything works:
1. Test with multiple different UIDs
2. Test on different devices (phone, tablet, desktop)
3. Test on different browsers
4. Share QR codes with team members
5. Gather user feedback

If something doesn't work:
1. Check browser console for errors
2. Verify all files are loaded correctly
3. Check network tab for failed requests
4. Review console logs for debugging info
