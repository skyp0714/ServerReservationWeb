# Server Reservation Web Application

A comprehensive web application for managing server and device reservations with calendar integration, user authentication, and dark mode support.

## 📚 Documentation

- **[Security Policy](SECURITY.md)** - Security guidelines and best practices
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to this project

## Features

- **Server Management**: Add, edit, and track servers with detailed specifications
- **Device Management**: Manage various device types (GPU, NIC, SSD, Memory, etc.)
- **Reservation Calendar**: Visual calendar for booking servers with time-based reservations
- **User Authentication**: Google OAuth integration via Firebase
- **Dark Mode**: Full dark mode support across all pages
- **Announcements**: Pin important announcements and manage bug tracking
- **User Permissions**: Role-based access (Admin, Normal User, Guest)
- **Favorites**: Mark frequently used servers as favorites
- **Search & Filter**: Advanced filtering by name, CPU type, device serial numbers, etc.

## Tech Stack

- **Frontend**: Vue 3 (Composition API)
- **Backend**: Firebase (Firestore, Authentication)
- **Calendar**: FullCalendar
- **Hosting**: GitHub Pages
- **CI/CD**: GitHub Actions

## Prerequisites

Before you begin, ensure you have:
- Node.js (v18 or higher)
- npm or yarn
- A Firebase account
- A GitHub account

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ServerReservationWeb.git
cd ServerReservationWeb/server-reservation
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

#### 3.1 Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Enable Google Analytics (optional)

#### 3.2 Enable Authentication

1. In your Firebase project, go to **Authentication** → **Sign-in method**
2. Enable **Google** provider
3. Add your domain to authorized domains (for GitHub Pages: `YOUR_USERNAME.github.io`)

#### 3.3 Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Start in **production mode** or **test mode** (you can change rules later)
3. Choose a location close to your users

#### 3.4 Set Up Firestore Collections

Create the following collections (they will be created automatically when you add the first document):

- `servers` - Server information
- `devices` - Device information
- `reservations` - Reservation records
- `authorizedUsers` - User roles and permissions
- `announcements` - Announcements and notices
- `bugs` - Bug tracking
- `userFavorites` - User favorite servers

#### 3.5 Set Up Firestore Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/) and select your project
2. Click **Firestore Database** in the left menu
3. Click the **Rules** tab at the top
4. Delete all existing content and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read and write if the user is authenticated
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. Click **Publish** button

#### 3.6 Set Up Firestore Indexes

⚠️ **Important**: Required for reservation queries to work.

1. In **Firestore Database**, click the **Indexes** tab
2. In the **Composite** section, click **Add Index** button
3. Create these 3 indexes:

**Index 1:**
- Collection ID: `reservations`
- Fields to index:
  1. `start` - Ascending
  2. `start` - Ascending
  3. `__name__` - Ascending
- Click **Create**

**Index 2:**
- Click **Add Index** again
- Collection ID: `reservations`
- Fields to index:
  1. `server` - Ascending
  2. `start` - Ascending
  3. `__name__` - Ascending
- Click **Create**

**Index 3:**
- Click **Add Index** again
- Collection ID: `reservations`
- Fields to index:
  1. `username` - Ascending
  2. `start` - Ascending
  3. `__name__` - Descending
- Click **Create**

4. Wait 1-5 minutes for all indexes to show "Enabled" status

#### 3.7 Get Firebase Configuration

1. Go to **Project Settings** (gear icon) → **General**
2. Scroll down to "Your apps" and click the **Web** icon (`</>`)
3. Register your app with a nickname
4. Copy the Firebase configuration object

### 4. Environment Configuration

> 🔒 **Security Note**: Never commit `.env` files to version control. See **[SECURITY.md](SECURITY.md)** for security best practices.

#### 4.1 Create Local Environment File

Copy the example file and fill in your Firebase credentials:

```bash
cp .env.example .env
```

Edit `.env` with your Firebase configuration:

```env
VUE_APP_FIREBASE_API_KEY=your_api_key_here
VUE_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VUE_APP_FIREBASE_PROJECT_ID=your_project_id
VUE_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VUE_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VUE_APP_FIREBASE_APP_ID=your_app_id
VUE_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

#### 4.2 Configure GitHub Secrets (for deployment)

If you want to deploy to GitHub Pages:

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each of the following secrets:
   - `VUE_APP_FIREBASE_API_KEY`
   - `VUE_APP_FIREBASE_AUTH_DOMAIN`
   - `VUE_APP_FIREBASE_PROJECT_ID`
   - `VUE_APP_FIREBASE_STORAGE_BUCKET`
   - `VUE_APP_FIREBASE_MESSAGING_SENDER_ID`
   - `VUE_APP_FIREBASE_APP_ID`
   - `VUE_APP_FIREBASE_MEASUREMENT_ID`

### 5. Configure vue.config.js

Create `vue.config.js` in the project root if deploying to GitHub Pages:

```javascript
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production'
    ? '/YOUR_REPOSITORY_NAME/'  // Change this to your repo name
    : '/'
})
```

**Important**: Replace `YOUR_REPOSITORY_NAME` with your actual GitHub repository name.

### 6. Initial Admin User Setup

⚠️ **Important**: You need to configure the default admin email before deploying the application.

#### 6.1 Configure Default Admin Email in Code

The application has a placeholder admin email (`admin@example.com`) that needs to be replaced with your actual email address.

1. Open `src/views/AdminView.vue`
2. Find and replace **all 4 occurrences** of `admin@example.com` with your actual admin email address:
   - Line ~341: `if (this.currentUserEmail === 'admin@example.com')`
   - Line ~377: `if (this.currentUserEmail === 'admin@example.com')`
   - Line ~551: `if (member.email === 'admin@example.com')`
   - Line ~635: `email: 'admin@example.com',`

**Example**: If your admin email is `john.doe@gmail.com`, replace all instances:
```javascript
// Before
if (this.currentUserEmail === 'admin@example.com') return true;

// After
if (this.currentUserEmail === 'john.doe@gmail.com') return true;
```

#### 6.2 Alternative: Manual Setup via Firestore

If you prefer to set up the admin user after deployment:

1. **Deploy the application first** (complete steps 7-10)
2. Sign in to the application with your Google account
3. Go to Firebase Console → **Firestore Database**
4. Navigate to the `authorizedUsers` collection
5. Find or create a document for your user:
   - If a document with your email exists, edit it
   - If not, click **Add document**
   - Document ID: (Auto-generate)
   - Fields:
     ```
     email: "your-admin-email@gmail.com"
     name: "Your Name"
     userType: "admin"
     addedDate: "2025-01-01T00:00:00.000Z"
     ```
6. **Sign out and sign back in** for changes to take effect

**Note**: The first method (6.1) is recommended as it ensures admin access from the first login.

### 7. Run Locally

```bash
npm run serve
```

The application will be available at `http://localhost:8080`

### 8. Build for Production

```bash
npm run build
```

This creates a `dist` folder with production-ready files.

### 9. Deploy to GitHub Pages

#### Option 1: Automatic Deployment (GitHub Actions)

The repository includes a GitHub Actions workflow that automatically deploys on push to `main`:

1. Make sure GitHub Secrets are configured (step 4.2)
2. Push to the `main` branch
3. GitHub Actions will automatically build and deploy

#### Option 2: Manual Deployment

```bash
npm run deploy
```

This builds and pushes to the `gh-pages` branch.

### 10. Enable GitHub Pages

1. Go to repository **Settings** → **Pages**
2. Under "Source", select the `gh-pages` branch
3. Click **Save**
4. Your site will be available at `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME/`

## Project Structure

```
server-reservation/
├── public/               # Static assets
├── src/
│   ├── assets/          # Images, styles
│   │   └── styles/      # CSS files organized by component
│   ├── components/      # Reusable Vue components
│   ├── router/          # Vue Router configuration
│   ├── utils/           # Utility functions (darkMode, dailyCache)
│   ├── views/           # Page components
│   │   ├── HomePage.vue
│   │   ├── ServerList.vue
│   │   ├── DeviceList.vue
│   │   ├── ReservationCalendar.vue
│   │   └── NoticePage.vue
│   ├── App.vue          # Root component
│   ├── main.js          # Application entry point
│   └── firebase.js      # Firebase configuration
├── .github/
│   └── workflows/       # GitHub Actions workflows
├── .env                 # Local environment variables (not in git)
├── .env.example         # Example environment file
├── .gitignore
├── package.json
├── vue.config.js        # Vue CLI configuration
└── README.md
```

## User Roles

- **Guest**: Can only view login page
- **Normal User**: Can view and create servers, devices, and reservations
- **Admin**: Full access including user management and pinning announcements

## Features Guide

### Dark Mode
Toggle dark mode using the button in the top-left corner of any page.

### Server Management
- Add servers with detailed specs (CPU, RAM, location, BMC IP, etc.)
- Attach devices to servers
- Mark servers as favorites
- Filter by name, CPU type, or attached device serial numbers

### Device Management
- Support for multiple device types (GPU, NIC, SSD, Memory, CXL, FPGA, Switch)
- Track device serial numbers
- Attach devices to servers
- Filter by name, type, serial number, or attached server

### Reservations
- Visual calendar interface
- Create time-based reservations
- Set urgency levels (High, Normal, Low)
- Email notifications on reservation changes
- Filter by server or date

### Announcements
- Create and pin important announcements
- Rich text editor support
- Auto-linking URLs in content
- Category-based organization

## Troubleshooting

### Build fails with "Cannot read property of undefined"
- Make sure all environment variables are set correctly
- Check that Firebase configuration is valid
- See **[SECURITY.md](SECURITY.md)** for credential management

### Authentication not working
- Verify Google OAuth is enabled in Firebase Console
- Check that your domain is in the authorized domains list
- For GitHub Pages: add `YOUR_USERNAME.github.io`

### Deployment fails
- Ensure GitHub Secrets are configured
- Check that `vue.config.js` has the correct `publicPath`
- Verify the workflow file has correct branch names

### Firestore permission errors
- Update Firestore security rules (see Setup step 3.5)
- Make sure your user exists in `authorizedUsers` collection with proper role

### Query errors: "The query requires an index"
- Make sure you created all 3 indexes in Setup step 3.6
- Check Firebase Console → Firestore Database → Indexes tab
- All 3 indexes must show "Enabled" status (not "Building...")
- If you see "Building...", wait a few more minutes

## Contributing

We welcome contributions! Please see **[CONTRIBUTING.md](CONTRIBUTING.md)** for detailed guidelines.

**Quick Start**:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Security**: If you discover a security vulnerability, please follow the reporting process outlined in **[SECURITY.md](SECURITY.md)**.

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues, questions, or contributions, please open an issue on GitHub.

