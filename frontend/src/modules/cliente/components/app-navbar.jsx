import BrandLogo from "./brand-logo";
import "../styles/app-navbar.css";

export default function AppNavbar() {
  return (
    <nav className="app-navbar">
      <BrandLogo
        className="app-nav-logo-btn"
        imgClassName="app-nav-logo-img"
        interactive={false}
      />
    </nav>
  );
}
