# Test Single Recipe Import

To test the image download, temporarily set in `.env.migration`:

```bash
MIGRATION_BATCH_SIZE=1
```

Then run:
```bash
npm run migration:import
```

This will import just 1 recipe and show detailed logging of the image download process.

Look for:
- `[BatchImporter] Image download config:` - Shows the output directory
- `📸 Downloading images for:` - Shows scraping attempt
- `[saveImageToLocal] Saved X bytes to:` - Shows actual file save
- Any error messages

If you see the save messages but files don't exist, there's a path issue.
If you don't see save messages, the download is failing.
