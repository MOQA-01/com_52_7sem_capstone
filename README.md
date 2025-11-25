# Jal Jeevan Mission - Water Supply Network Management Platform

## 🌊 Project Overview

A fully functional prototype of an Integrated Geospatial, IoT, and Grievance Redressal Platform for Water Supply Network Management. This platform demonstrates the capabilities of the Jal Jeevan Mission initiative using only **HTML, CSS, and vanilla JavaScript** with no backend required.

![Uploading Jal Jeevan Mission - Water Supply Network Management.png…]()


## ✨ Key Features

### 1. **Landing & Authentication Page** ([index.html](index.html))
- Professional landing page with project overview
- Role-based login system (Admin, Engineer, Citizen, Official)
- Animated statistics counter
- Water drop background animation
- Fully responsive design

### 2. **Main Dashboard** ([dashboard.html](dashboard.html))
- Real-time statistics and metrics
- Activity feed with recent events
- Quick action buttons
- System status monitoring
- Interactive data visualization
- Live clock and notifications

### 3. **Interactive Geospatial Map** ([map.html](map.html))
- **Leaflet.js** powered interactive maps
- Multiple asset layers (Pipelines, Tanks, Pumps, Sources, Complaints)
- Click-to-view asset details with popups
- Layer toggle controls
- Search functionality for assets
- Distance measurement tool
- Mock asset addition feature

### 4. **IoT Monitoring Dashboard** ([iot-monitoring.html](iot-monitoring.html))
- **35+ simulated IoT sensors** with live data
- Real-time sensor readings (every 3 seconds)
- Sensor types: Flow, Pressure, pH, Turbidity, Chlorine, Level
- Sparkline charts for quick trends
- Anomaly detection with alerts
- Detailed sensor modal with historical charts
- Filter by type, status, and search
- Export sensor data to CSV

### 5. **Grievance Management System** ([grievances.html](grievances.html))
- Comprehensive complaint tracking system
- **30+ mock grievances** with realistic data
- Status workflow: Registered → Assigned → In Progress → Resolved
- Priority management (High, Medium, Low)
- Interactive timeline visualization
- Engineer assignment
- Comments and notes
- Advanced filters and search
- Pagination (10 items per page)
- Export to CSV

### 6. **Citizen Portal** ([citizen-portal.html](citizen-portal.html))
- Public-facing complaint submission interface
- Simple form with photo upload
- Geolocation support ("Use My Location")
- Track complaint by ID with visual timeline
- FAQ accordion section
- Contact information
- No login required
- Mobile-first responsive design

### 7. **Analytics & Reports** ([analytics.html](analytics.html))
- **8 interactive charts** using Chart.js
- Complaints trend (Line chart)
- Category distribution (Doughnut chart)
- Status overview (Bar chart)
- Average resolution time (Horizontal bar)
- Water consumption tracking (Area chart)
- Sensor anomalies timeline
- Asset type distribution (Pie chart)
- Geographic distribution
- Date range selector (7 days, 30 days, 3 months, 1 year)
- Key insights with trends
- Print and PDF export options

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server or installation required!

### Installation

1. **Download/Clone the project:**
   ```bash
   git clone <repository-url>
   cd jal-jeevan-platform
   ```

2. **Open in browser:**
   Simply open `index.html` in your web browser.

   Or use a local server (optional):
   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js
   npx serve

   # VS Code Live Server extension
   Right-click index.html > Open with Live Server
   ```

3. **Login with demo credentials:**
   - **Admin**: `admin / admin123`
   - **Engineer**: `engineer / eng123`
   - **Citizen**: `citizen / citizen123`
   - **Official**: `official / off123`

## 📁 Project Structure

```
jal-jeevan-platform/
├── index.html                 # Landing/Login page
├── dashboard.html             # Main admin dashboard
├── map.html                   # Interactive geospatial map
├── iot-monitoring.html        # IoT sensor monitoring
├── grievances.html            # Grievance management
├── analytics.html             # Analytics and reports
├── citizen-portal.html        # Public complaint portal
│
├── css/
│   ├── style.css             # Global styles & components
│   ├── dashboard.css         # Dashboard layout styles
│   └── responsive.css        # Mobile responsive styles
│
├── js/
│   ├── auth.js               # Authentication logic
│   ├── data.js               # Mock data & localStorage manager
│   ├── dashboard.js          # Dashboard functionality
│   ├── map.js                # Leaflet map integration
│   ├── iot-simulator.js      # IoT sensor simulation
│   ├── grievances.js         # Grievance management
│   └── analytics.js          # Charts and analytics
│
├── assets/
│   ├── images/               # Image assets
│   └── icons/                # Icon assets
│
└── README.md                 # This file
```

## 🎯 Features Breakdown

### Mock Data
All data is stored in **browser localStorage** for persistence:
- **50+ infrastructure assets** (pipelines, tanks, pumps, sources)
- **35+ IoT sensors** with real-time simulated readings
- **30+ grievances** in various states
- **15+ recent activities**
- **Multiple mock alerts**

### User Roles
- **Admin**: Full access to all features
- **Engineer**: Field operations focus
- **Official**: Monitoring and reporting
- **Citizen**: Public complaint submission

### Key Technologies
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Maps**: Leaflet.js 1.9.4 with OpenStreetMap
- **Charts**: Chart.js 4.4.0
- **Icons**: Font Awesome 6.4.0
- **Fonts**: Google Fonts (Poppins)
- **Storage**: Browser localStorage API

## 📊 Data Persistence

The platform uses **localStorage** to store all data:
- Mock assets and infrastructure
- Sensor readings and history
- Grievances and comments
- User sessions
- Activities and alerts

**Note**: Data persists across sessions but is browser-specific. Clear browser data to reset.

## 🎨 Design Features

- **Glassmorphism** UI effects
- **Smooth animations** and transitions
- **Color-coded status** indicators
- **Responsive grid** layouts
- **Mobile-first** approach
- **Touch-friendly** controls (44px minimum)
- **Print-friendly** styles
- **Accessibility** compliant (WCAG 2.1)

## 📱 Responsive Breakpoints

- **Desktop**: > 1024px
- **Tablet**: 768px - 1024px
- **Mobile**: < 768px
- **Small Mobile**: < 480px

## 🔧 Customization

### Changing Colors
Edit CSS variables in `css/style.css`:
```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #0ea5e9;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --danger-color: #ef4444;
}
```

### Adding New Mock Data
Edit `js/data.js` and modify the mock data generators:
```javascript
DataManager.getMockAssets()
DataManager.getMockSensors()
DataManager.getMockGrievances()
```

### Adjusting IoT Simulation
Modify sensor update interval in `js/iot-simulator.js`:
```javascript
simulationInterval = setInterval(() => {
    // Update logic
}, 3000); // Change from 3000ms (3 seconds)
```

## 🎬 Demo Workflow

1. **Login** as Admin (`admin / admin123`)
2. **View Dashboard** - See real-time statistics
3. **Explore Map** - Click on assets to view details
4. **Monitor IoT Sensors** - Watch live sensor updates
5. **Manage Grievances** - Click a complaint to see details
6. **Track as Citizen** - Visit citizen portal, submit complaint
7. **View Analytics** - Explore charts and trends

## 🔐 Security Note

⚠️ **This is a DEMO prototype** with mock authentication. Not suitable for production use.

- Passwords are stored in plain text (client-side only)
- No actual backend validation
- All data is client-side (localStorage)
- No encryption or security measures
- Use for demonstration and learning purposes only

## 📈 Performance

- **Fast Loading**: No server requests, all client-side
- **Lightweight**: ~500KB total (excluding external libraries)
- **Offline Capable**: Works without internet (after first load)
- **60 FPS Animations**: Smooth transitions and effects

## 🌐 Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+

## 🐛 Known Limitations

1. **No Backend**: All data is stored in browser localStorage
2. **Single User**: No multi-user collaboration
3. **Mock IoT**: Sensor data is randomly generated
4. **Limited Map Data**: Only Bangalore region with mock assets
5. **No Real-time Sync**: Changes don't sync across devices
6. **Browser Storage Limit**: ~10MB localStorage limit

## 🚧 Future Enhancements (If Backend Added)

- Real-time WebSocket connections for IoT data
- User authentication with JWT
- Database integration (PostgreSQL/MongoDB)
- File upload for complaint photos
- Email/SMS notifications
- Advanced analytics with ML predictions
- Multi-language support
- PWA capabilities for offline use
- GIS integration with real geographic data

## 📚 Learning Resources

- [Leaflet.js Documentation](https://leafletjs.com/)
- [Chart.js Documentation](https://www.chartjs.org/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [CSS Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

## 🤝 Contributing

This is a demo project for educational purposes. Feel free to:
- Fork and modify
- Use as a template
- Learn from the code
- Suggest improvements

## 📄 License

This project is created for demonstration purposes. Free to use for learning and non-commercial purposes.

## 👨‍💻 Author

Created as a fully functional dummy prototype for the Jal Jeevan Mission - Water Supply Network Management Platform.

## 🙏 Acknowledgments

- **Jal Jeevan Mission** - Ministry of Jal Shakti, Government of India
- **OpenStreetMap** contributors
- **Leaflet.js** team
- **Chart.js** team
- **Font Awesome** team

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Check the FAQ in citizen portal
- Review the code documentation

---
**Har Ghar Jal - Water for All**
