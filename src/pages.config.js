import Welcome from './pages/Welcome';
import Schedule from './pages/Schedule';
import Forecast from './pages/Forecast';
import Notices from './pages/Notices';
import Profile from './pages/Profile';
import Info from './pages/Info';
import __Layout from './Layout.jsx';

export const PAGES = {
    "Welcome": Welcome,
    "Schedule": Schedule,
    "Forecast": Forecast,
    "Notices": Notices,
    "Profile": Profile,
    "Info": Info,
}

export const pagesConfig = {
    mainPage: "Welcome",
    Pages: PAGES,
    Layout: __Layout,
};