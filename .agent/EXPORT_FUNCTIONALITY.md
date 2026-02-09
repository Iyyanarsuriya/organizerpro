# Hotel Bookings - Export Functionality

## Overview
Added comprehensive export functionality to the Hotel Bookings module, allowing users to export filtered booking data in multiple formats: CSV, TXT, and PDF.

## Features Added

### 1. Export Button
- **Location**: Next to "New Booking" button in the header
- **Style**: Emerald green button with download icon
- **Dropdown Menu**: Shows 3 export options when clicked

### 2. Export Formats

#### CSV Export
- **Icon**: 📊 Green CSV icon
- **Format**: Comma-separated values (CSV)
- **Columns**:
  - Booking ID
  - Guest Name
  - Unit
  - Check-In & Check-Out
  - Amount, Advance, Balance
  - Status, Source, Notes

- **Filename**: `hotel_bookings_[STATUS]_[DATE_FILTER].csv`
  - Example: `hotel_bookings_all_2026.csv` (Year filter)
- **Use Case**: Excel, Google Sheets, analysis

#### TXT Export
- **Icon**: 📄 Blue text file icon
- **Format**: Plain text report with headers
- **Filename**: `hotel_bookings_[STATUS]_[DATE_FILTER].txt`
- **Use Case**: Quick text review, email body

#### PDF Export
- **Icon**: 📕 Red PDF icon
- **Format**: Print-ready HTML document
- **Filename**: Dynamic (via browser print dialog)
- **Use Case**: Formal reports, printing

### 3. Smart Filenames
Export filenames are automatically generated based on the active filters to help you organize your reports.

**Filename Format**:
`hotel_bookings_[STATUS]_[DATE_FILTER].[EXTENSION]`

**Examples**:
- **Day Filter**: `hotel_bookings_all_2026-02-05.csv`
- **Month Filter**: `hotel_bookings_confirmed_2026-02.pdf`
- **Year Filter**: `hotel_bookings_checked_in_2026.txt`
- **Range Filter**: `hotel_bookings_all_2026-02-01_to_2026-02-28.csv`

## 📊 Export Content

### Filters Included
The export functionality respects ALL active filters on the screen:
1. **Status**: (e.g., Pending, Confirmed, Checked In)
2. **Search Query**: (Guest Name or Unit Number)
3. **Date Filter**: (Day, Month, Year, Date Range)

### Report Headers
All exports (TXT and PDF) include a report header detailing the filters used:

```
Generated: 05/02/2026, 6:00:00 PM
Filters: STATUS: CONFIRMED | Year: 2026
Total Records: 154
```

### 4. User Experience Features

#### Click-Outside Handler
- Export menu automatically closes when clicking outside
- Smooth user experience without manual closing

#### Toast Notifications
- ✅ "Exported to CSV!" - CSV download success
- ✅ "Exported to TXT!" - TXT download success
- ✅ "PDF preview opened!" - PDF window opened

#### Visual Feedback
- Hover effects on each export option
- Color-coded icons (green for CSV, blue for TXT, red for PDF)
- Smooth transitions and animations

## Technical Implementation

### State Management
```javascript
const [showExportMenu, setShowExportMenu] = useState(false);
```

### Export Functions

#### exportToCSV()
- Creates CSV content from filtered bookings
- Uses Blob API for file download
- Properly escapes special characters in quotes

#### exportToTXT()
- Formats data as readable plain text
- Includes headers, separators, and metadata
- Uses template literals for clean formatting

#### exportToPDF()
- Opens new window with styled HTML
- Includes inline CSS for print optimization
- Triggers browser's native print dialog
- Users can save as PDF using browser's print-to-PDF feature

### Click-Outside Handler
```javascript
useEffect(() => {
    const handleClickOutside = (event) => {
        if (showExportMenu && !event.target.closest('.export-menu-container')) {
            setShowExportMenu(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
}, [showExportMenu]);
```

## Usage Instructions

### For Users

1. **Filter Your Data** (Optional)
   - Click on status filters (All, Pending, Confirmed, etc.)
   - Use search box to find specific bookings
   - Only filtered results will be exported

2. **Click Export Button**
   - Green "Export" button in the header
   - Dropdown menu appears with 3 options

3. **Choose Format**
   - **CSV**: For spreadsheet analysis
   - **TXT**: For simple text reports
   - **PDF**: For professional documents

4. **Download/Print**
   - CSV and TXT download automatically
   - PDF opens print dialog - choose "Save as PDF"

### Example Workflows

#### Monthly Report
1. Filter by "checked_out"
2. Export as PDF
3. Print or save for records

#### Data Analysis
1. Filter by date range (using search)
2. Export as CSV
3. Open in Excel for analysis

#### Quick Review
1. Filter by "confirmed"
2. Export as TXT
3. Email to team or save for reference

## File Naming Convention

All exports use consistent naming:
```
hotel_bookings_{filter}_{YYYY-MM-DD}.{ext}
```

Examples:
- `hotel_bookings_all_2026-02-05.csv`
- `hotel_bookings_confirmed_2026-02-05.txt`
- `hotel_bookings_checked_in_2026-02-05.pdf` (via print dialog)

## Browser Compatibility

### CSV & TXT Export
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ All modern browsers

### PDF Export
- ✅ Uses browser's native print dialog
- ✅ Works on all browsers with print support
- ✅ No external dependencies required

## Future Enhancements

### Priority 1
- [x] Date range picker for custom filtering
- [ ] Excel format (.xlsx) export
- [ ] Email export directly from UI

### Priority 2
- [ ] Scheduled exports (daily/weekly reports)
- [ ] Custom column selection
- [ ] Export templates

### Priority 3
- [ ] Cloud storage integration (Google Drive, Dropbox)
- [ ] Automated backups
- [ ] Export history log

## Dependencies

**None!** All export functionality uses native browser APIs:
- `Blob` API for file downloads
- `window.open()` for PDF preview
- `document.createElement()` for dynamic links

No external libraries required.

## Code Location

**File**: `client/src/pages/HotelSector/HotelBookings.jsx`

**Functions**:
- `exportToCSV()` - Lines 136-168
- `exportToTXT()` - Lines 170-194
- `exportToPDF()` - Lines 196-262

**UI Components**:
- Export button - Lines 296-328
- Export dropdown menu - Lines 306-327

## Testing Checklist

- [x] CSV export with all filters
- [x] TXT export with all filters
- [x] PDF export with all filters
- [x] Click-outside closes menu
- [x] Toast notifications appear
- [x] Filenames include filter and date
- [x] Special characters handled correctly
- [x] Empty bookings list handled
- [x] Large datasets (100+ bookings)
- [x] Mobile responsive design

## Support

For issues or feature requests related to export functionality, check:
1. Browser console for errors
2. Network tab for download issues
3. Pop-up blocker settings (for PDF)

---

**Status**: ✅ PRODUCTION READY

Export functionality is fully implemented, tested, and ready for production use.
