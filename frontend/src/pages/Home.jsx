
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home-container">
      <nav className="home-navbar">
        <h2>Smart Home Gateway</h2>
        <span>IoT Security System</span>
      </nav>

      <section className="home-hero">
        <div className="home-content">
          <p className="home-tag">SMART HOME SECURITY</p>

          <h1>
            Secure Your Smart Home.
            <br />
            Stay Connected.
          </h1>

          <p className="home-description">
            Monitor your connected devices, detect suspicious
            network activity and manage your smart home security
            from one platform.
          </p>

          <div className="home-buttons">
            <Link to="/login" className="home-login-btn">
              Login
            </Link>

            <Link to="/register" className="home-register-btn">
              Create Account
            </Link>
          </div>
        </div>

        <div className="home-visual">
          <div className="home-icon">⌂</div>
          <h2>Smart Home Protection</h2>
          <p>Monitor. Detect. Protect.</p>
        </div>
      </section>

      <footer className="home-footer">
        Secure Smart Home Gateway with Intrusion Detection
        and Automated Incident Response
      </footer>
    </div>
  );
}
