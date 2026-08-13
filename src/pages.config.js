/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import MyEvents from './pages/MyEvents';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import AdminStats from './pages/AdminStats';
import Announcements from './pages/Announcements';
import Feed from './pages/Feed';
import Help from './pages/Help';
import ScanTicket from './pages/ScanTicket';
import Schedule from './pages/Schedule';
import Welcome from './pages/Welcome';
import Settings from './pages/Settings';
import Forecast from './pages/Forecast';
import Achievements from './pages/Achievements';
import DutyRoster from './pages/DutyRoster';
import Volunteering from './pages/Volunteering';
import __Layout from './Layout.jsx';


export const PAGES = {
    "MyEvents": MyEvents,
    "Notifications": Notifications,
    "Profile": Profile,
    "AdminStats": AdminStats,
    "Announcements": Announcements,
    "Feed": Feed,
    "Help": Help,
    "ScanTicket": ScanTicket,
    "Schedule": Schedule,
    "Welcome": Welcome,
    "Settings": Settings,
    "Forecast": Forecast,
    "Achievements": Achievements,
    "DutyRoster": DutyRoster,
    "Volunteering": Volunteering,
}

export const pagesConfig = {
    mainPage: "Welcome",
    Pages: PAGES,
    Layout: __Layout,
};