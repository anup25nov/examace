# Exam Logos

This directory contains the official logos for various competitive exams.

## Required Logo Files:

- `ssc-cgl-logo.png` - SSC CGL logo
- `ssc-mts-logo.png` - SSC MTS logo  
- `railway-logo.png` - Railway logo
- `bank-po-logo.png` - Bank PO logo
- `airforce-logo.png` - Air Force logo

## Logo Specifications:

- **Format**: PNG with transparent background
- **Size**: 64x64 pixels (will be scaled to 32x32 in UI)
- **Style**: Official logos or clean, professional representations
- **Background**: Transparent or white

## Usage:

The logos are automatically displayed on the exam selection page. If a logo is not available, the system will fall back to the default icon for that exam.

## Adding New Logos:

1. Add the logo file to this directory
2. Update the `logo` field in `src/config/examConfig.ts`
3. The logo will automatically appear in the UI
