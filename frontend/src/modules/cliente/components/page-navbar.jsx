import BrandLogo from "./brand-logo";
import "../styles/page-navbar.css";

export default function PageNavbar() {
  return (
    <nav className="page-navbar">
      <BrandLogo
        className="page-nav-logo-btn"
        imgClassName="page-nav-logo-img"
      />
    </nav>
  );
}