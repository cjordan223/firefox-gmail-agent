# Gmail Email Tracker

A complete Firefox browser extension system for capturing Gmail emails with a FastAPI backend and React dashboard for management and annotation.

## Project Overview

This project creates a **local email management system** that works with Gmail. Here's how it works:

1. **Firefox Extension** adds a "Capture" button to Gmail emails
2. **Backend API** stores captured emails in a local SQLite database  
3. **React Dashboard** provides a beautiful interface to view, search, and annotate emails

**No cloud services or external APIs required** - everything runs locally on your machine!

## Features

- **Firefox Extension**: Discreet "Capture to Tracker" button injected into Gmail
- **Email Data Capture**: Extracts subject, sender, timestamp, body, and URL
- **FastAPI Backend**: RESTful API with SQLite database storage
- **React Dashboard**: Modern, responsive interface for email management
- **Search & Sort**: Full-text search and multiple sorting options
- **Annotations**: Add personal notes and tags to captured emails
- **Real-time Updates**: Instant feedback and notifications

## Project Structure

```
firefox-agent/
├── extension/                 # Firefox browser extension
│   ├── manifest.json         # Extension manifest (v2)
│   ├── content.js            # Content script for Gmail injection
│   ├── background.js         # Service worker
│   ├── styles.css            # Extension styles
│   └── icons/                # Extension icons
├── backend/                  # FastAPI backend
│   ├── main.py              # Main API application
│   ├── requirements.txt     # Python dependencies
│   └── emails.db            # SQLite database (created automatically)
├── dashboard/                # React dashboard
│   ├── package.json         # Node.js dependencies
│   ├── public/              # Static files
│   └── src/                 # React source code
├── start.sh                 # Quick start script
└── README.md                # This file
```

## Quick Start

### Prerequisites

- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Firefox browser**

### Option 1: Automated Setup (Recommended)

```bash
# Clone and start everything automatically
git clone <your-repo-url>
cd firefox-agent
chmod +x start.sh
./start.sh
```

### Option 2: Manual Setup

#### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
python main.py
```

The backend will start on `http://localhost:8000`

#### 2. Dashboard Setup

```bash
# Open new terminal and navigate to dashboard
cd dashboard

# Install Node.js dependencies
npm install

# Start the React development server
npm start
```

The dashboard will start on `http://localhost:3000`

#### 3. Firefox Extension Setup

1. **Open Firefox** and navigate to `about:debugging`
2. **Click "This Firefox"** in the left sidebar
3. **Click "Load Temporary Add-on"**
4. **Select the `manifest.json` file** from the `extension/` directory
5. **Navigate to Gmail** (`https://mail.google.com`)
6. **Open any email** - you should see a "📧 Capture to Tracker" button

## Usage

### Capturing Emails

1. **Open Gmail** in Firefox with the extension loaded
2. **Click on any email** to view it
3. **Click the "📧 Capture to Tracker" button** that appears in the email interface
4. **Check the notification** - you should see "Email captured successfully!"

### Managing Emails

1. **Open the dashboard** at `http://localhost:3000`
2. **View captured emails** in the main list
3. **Search emails** using the search bar
4. **Sort emails** by date, subject, sender, etc.
5. **Click "Edit"** to add annotations or notes
6. **Click "Open in Gmail"** to view the original email
7. **Click "Delete"** to remove emails from the tracker

## API Endpoints

- `POST /capture` - Capture new email
- `GET /emails` - Get all emails
- `GET /emails/{id}` - Get specific email
- `PUT /emails/{id}` - Update email annotations
- `DELETE /emails/{id}` - Delete email

## Troubleshooting

### Extension Not Working
- **Check Firefox console** for errors (F12)
- **Verify extension is loaded** in `about:debugging`
- **Refresh Gmail page** after loading extension
- **Use debug mode**: Press Ctrl+Shift+D while clicking capture button

### Dashboard Not Showing Emails
- **Verify backend is running** on port 8000
- **Check browser console** for API errors
- **Hard refresh** the dashboard page (Ctrl+Shift+R)
- **Verify CORS settings** in backend

### Performance Issues
- **Extension optimized** with throttling and efficient DOM queries
- **Debug mode available** for troubleshooting
- **Single-pass data extraction** for better performance

## Security Notes

- **Local Development Only**: This setup is for local development
- **No Authentication**: Add authentication for production use
- **CORS Configured**: Properly configured for localhost development
- **SQLite Database**: Local file-based storage

## Production Deployment

For production deployment:

1. **Add authentication** to the FastAPI backend
2. **Use a production database** (PostgreSQL, MySQL)
3. **Configure proper CORS** settings
4. **Add HTTPS** for secure communication
5. **Package the extension** for Firefox Add-ons store
6. **Deploy dashboard** to a web server
7. **Add environment variables** for configuration

## Development

### Adding New Features

1. **Backend**: Add new endpoints in `main.py`
2. **Extension**: Modify `content.js` for new functionality
3. **Dashboard**: Update React components in `src/`

### Testing

- **Backend**: Use FastAPI's automatic docs at `http://localhost:8000/docs`
- **Extension**: Test in Firefox with `about:debugging`
- **Dashboard**: Use React's development tools

## License

This project is for educational and personal use. Modify as needed for your requirements.

---

**Happy Tracking!* 
