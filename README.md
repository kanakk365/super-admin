# Super Admin Dashboard

A modern, responsive admin dashboard built with Next.js 15, TypeScript, Tailwind CSS, and Shadcn/ui components with external API integration.

## ✨ Features

### 🔐 **Authentication System**
- Secure login and registration with external API
- Session management with HTTP-only cookies
- Protected routes with middleware
- Real-time authentication status checking
- Demo credentials for testing

### 🌐 **External API Integration**
- **Base URL**: `https://apisimplylearn.selflearnai.in/api/v1`
- Centralized API client with TypeScript support
- Error handling and request/response logging
- Configurable timeouts and retry logic
- Real-time API status monitoring

### 🎨 **Modern UI with Shadcn/ui**
- Clean, professional design using Shadcn/ui component library
- Consistent design system with proper theming
- Responsive layout that works on all devices
- Dark theme with gradient backgrounds

### 📊 **Comprehensive Dashboard**
- **Overview Dashboard**: Key metrics, recent activity, and quick insights
- **Institutions Management**: Full CRUD operations for educational institutions
- **Student Management**: Student profiles, enrollment tracking, GPA monitoring
- **Blog Management**: Content creation, publishing, and analytics
- **Role & Permissions**: Advanced user role management system
- **Profile Management**: User settings and preferences

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/ui
- **Icons**: Lucide React + Heroicons
- **API Integration**: Custom API client with fetch
- **Authentication**: Session-based with external API
- **Package Manager**: npm

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd super.admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://apisimplylearn.selflearnai.in/api/v1
   NEXT_PUBLIC_API_TIMEOUT=10000
   NEXT_PUBLIC_API_DEBUG=true
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Authentication

### Demo Credentials
```json
{
  "email": "superadmin@gmail.com",
  "password": "stringabcd"
}
```

### API Endpoints
- **Login**: `POST /auth/login`
- **Register**: `POST /auth/register`
- **Logout**: `POST /auth/logout`
- **User Info**: `GET /auth/me`

### Request/Response Format

**Login Request**:
```json
{
  "email": "superadmin@gmail.com",
  "password": "stringabcd"
}
```

**Register Request**:
```json
{
  "name": "superadmin",
  "email": "superadmin@gmail.com",
  "password": "stringabcd"
}
```

**Response Format**:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "name": "superadmin",
    "email": "superadmin@gmail.com",
    "role": "super_admin"
  }
}
```

## 🌐 API Integration

### API Client Configuration
The application uses a centralized API client located in `lib/api.ts`:

```typescript
import { apiClient } from '@/lib/api';

// Authentication
await apiClient.login({ email, password });
await apiClient.register({ name, email, password });
await apiClient.logout();
await apiClient.getMe();

// Generic requests
await apiClient.get('/endpoint');
await apiClient.post('/endpoint', data);
await apiClient.put('/endpoint', data);
await apiClient.delete('/endpoint');
```

### Environment Configuration
- `NEXT_PUBLIC_API_BASE_URL`: External API base URL
- `NEXT_PUBLIC_API_TIMEOUT`: Request timeout in milliseconds
- `NEXT_PUBLIC_API_DEBUG`: Enable request/response logging

### API Status Monitoring
The application includes real-time API status monitoring:
- Connection status indicator
- Response time measurement
- Automatic health checks every 30 seconds
- Visual status indicators throughout the UI

## 📱 Pages & Features

### Authentication Pages
- **Login Page** (`/login`): Combined login and registration with toggle functionality
- **Auto-redirect**: Based on authentication status

### Dashboard Pages
- **Dashboard** (`/dashboard`): Main overview with statistics
- **Institutions** (`/dashboard/institutions`): Institution management
- **Students** (`/dashboard/students`): Student profile management
- **Blogs** (`/dashboard/blogs`): Content management system
- **Roles** (`/dashboard/roles`): Role-based access control
- **Profile** (`/dashboard/profile`): User profile settings

### Protected Routes
All dashboard routes are protected by middleware that:
- Checks authentication status with external API
- Redirects unauthenticated users to login
- Maintains session state across page refreshes

## 🔧 Project Structure

```
super.admin/
├── app/
│   ├── components/
│   │   └── Sidebar.tsx          # Navigation with user info & logout
│   ├── dashboard/               # Protected dashboard pages
│   ├── login/
│   │   └── page.tsx            # Combined login/register form
│   ├── api.backup/             # Backup of local API routes
│   ├── globals.css             # Global styles + Tailwind
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home (auth redirect)
├── components/
│   ├── ui/                     # Shadcn/ui components
│   └── ApiStatus.tsx           # API connection status component
├── lib/
│   ├── api.ts                  # External API client
│   └── utils.ts                # Utility functions
├── middleware.ts               # Route protection & auth checks
├── .env.local                  # Environment configuration
└── components.json             # Shadcn configuration
```

## 🔒 Security Features

- **HTTP-only cookies**: Secure session management
- **CORS configuration**: Proper cross-origin handling
- **Request timeouts**: Prevent hanging requests
- **Error handling**: Secure error messages
- **Route protection**: Middleware-based authentication
- **Session validation**: Real-time auth status checking

## 🎨 UI Components

### Custom Components
- **ApiStatus**: Real-time API connection indicator
- **LoginForm**: Combined login/register form with validation
- **Sidebar**: Navigation with user info and logout

### Design Features
- **Dark theme**: Professional gradient backgrounds
- **Responsive design**: Mobile-first approach
- **Loading states**: Smooth user experience
- **Error handling**: User-friendly error messages
- **Form validation**: Real-time input validation

## 🚀 Development

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build production application
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

### Environment Variables
```env
# Required
NEXT_PUBLIC_API_BASE_URL=https://apisimplylearn.selflearnai.in/api/v1

# Optional
NEXT_PUBLIC_API_TIMEOUT=10000
NEXT_PUBLIC_API_DEBUG=true
NEXT_PUBLIC_APP_NAME=Super Admin Dashboard
```

## 🔧 Customization

### API Configuration
Update `lib/api.ts` to modify:
- Base URL and endpoints
- Request/response interceptors
- Error handling logic
- Timeout and retry settings

### Theme Customization
Edit CSS variables in `app/globals.css`:
- Color scheme
- Typography
- Spacing
- Border radius

### Adding New Pages
1. Create page component in `app/dashboard/`
2. Add route to sidebar navigation
3. Update middleware if route needs protection

## 📊 Monitoring & Debugging

### API Debug Mode
When `NEXT_PUBLIC_API_DEBUG=true`:
- Request/response logging to console
- Network timing information
- Error details for debugging

### Status Indicators
- **Green**: API connected and responsive
- **Yellow**: Checking connection status
- **Red**: API unavailable or error

## 🚀 Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://apisimplylearn.selflearnai.in/api/v1
   ```

3. **Deploy to your platform**
   - Vercel, Netlify, or any Node.js hosting
   - Ensure environment variables are configured
   - Verify external API connectivity

## 🎯 Future Enhancements

- [ ] Real-time notifications
- [ ] Data visualization charts
- [ ] Export functionality
- [ ] Advanced search filters
- [ ] Bulk operations
- [ ] File upload support
- [ ] Multi-language support
- [ ] Advanced role permissions

## 📄 License

This project is for demonstration purposes and showcases modern React/Next.js development patterns with external API integration.

---

Built with ❤️ using Next.js 15, TypeScript, Tailwind CSS, and Shadcn/ui

**External API**: https://apisimplylearn.selflearnai.in/api/v1