import Welcome from './pages/Welcome';
import Schedule from './pages/Schedule';
import Forecast from './pages/Forecast';
import Notices from './pages/Notices';
import Profile from './pages/Profile';
import __Layout from './Layout.jsx';

export const PAGES = {
    "Welcome": Welcome,
    "Schedule": Schedule,
    "Forecast": Forecast,
    "Notices": Notices,
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "Welcome",
    Pages: PAGES,
    Layout: __Layout,
};