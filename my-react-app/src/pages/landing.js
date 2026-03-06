import React, { useState, useEffect } from 'react';
import './landing.css';

export default function Landing({ onLoginClick, onRegisterClick }) {
  const [animateStats, setAnimateStats] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimateStats(true);
        }
      },
      { threshold: 0.3 }
    );

    const statsSection = document.getElementById('stats-section');
    if (statsSection) {
      observer.observe(statsSection);
    }

    return () => observer.disconnect();
  }, []);

  const StatCounter = ({ end, label, suffix = '' }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!animateStats) return;

      let current = 0;
      const increment = end / 30;
      const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, 50);

      return () => clearInterval(timer);
    }, [animateStats, end]);

    return (
      <div className="stat-item">
        <div className="stat-number">
          {count}{suffix}
        </div>
        <div className="stat-label">{label}</div>
      </div>
    );
  };

  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
          <img src={require('../assets/ila_bull.svg').default} alt="iLa Logo" style={{ height: '150px', marginRight: '8px' }} />
          <span className="logo-text">iLa learn</span>
        </div>
          <div className="nav-links">
            <a href="#features" className="nav-link nav-box">Features</a>
            <a href="#roles" className="nav-link nav-box">For Everyone</a>
            <a href="#stats" className="nav-link nav-box">Impact</a>
            <button className="nav-cta" onClick={onLoginClick}>Login</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>

        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Learn to Invest.
              <span className="gradient-text"> Win Real Rewards.</span>
            </h1>
            <p className="hero-subtitle">
              Trade simulated stocks with real market data in the ultimate educational experience. 
              Build your portfolio, compete with classmates, and master financial literacy—all risk-free.
            </p>
            <div className="hero-buttons">
              <button className="btn btn-primary" onClick={onRegisterClick}>Get Started</button>
              <button className="btn btn-secondary" onClick={onLoginClick}>Sign In</button>
            </div>
          </div>

          <div className="hero-graphic">
            <div className="trading-card">
              <div className="card-header">
                <span className="card-badge">Portfolio</span>
                <span className="card-value">+12.5%</span>
              </div>
              <div className="chart-placeholder">
                <svg viewBox="0 0 200 100" className="mini-chart">
                  <path d="M 0 80 Q 25 60, 50 50 T 100 40 T 150 45 T 200 35" fill="none" stroke="url(#gradient)" strokeWidth="3"/>
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#1a7a7a" />
                      <stop offset="100%" stopColor="#20a090" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="card-stocks">
                <div className="stock-item">
                  <span className="stock-name">AAPL</span>
                  <span className="stock-change green">+8.2%</span>
                </div>
                <div className="stock-item">
                  <span className="stock-name">TSLA</span>
                  <span className="stock-change red">-2.1%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="scroll-indicator">
          <div className="scroll-dot"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="section-header">
          <h2>Why iLa learn?</h2>
          <p>Everything you need to master investing</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Real Market Data</h3>
            <p>Trade with live stock prices and authentic market conditions. Learn from real-world scenarios.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎮</div>
            <h3>Gamified Learning</h3>
            <p>Climb leaderboards, complete challenges, and earn achievements while mastering financial concepts.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Classroom Competitions</h3>
            <p>Compete with classmates in seasonal challenges and class-wide tournaments for bragging rights.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Advanced Analytics</h3>
            <p>Track your performance with detailed graphs, metrics, and insights into your trading behavior.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>100% Safe Learning</h3>
            <p>Use simulated currency and risk-free trading. No real money involved—just pure education.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Smart Constraints</h3>
            <p>Teachers set rules and limits to prevent reckless behavior and encourage thoughtful investing.</p>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="roles">
        <div className="section-header">
          <h2>Built for Everyone</h2>
          <p>Tailored experiences for students, teachers, and administrators</p>
        </div>

        <div className="roles-container">
          <div className="role-card student-card">
            <div className="role-icon">👨‍🎓</div>
            <h3>Students</h3>
            <ul className="role-list">
              <li>Create and manage portfolios</li>
              <li>Buy and sell simulated stocks</li>
              <li>Track portfolio performance</li>
              <li>Compete on leaderboards</li>
              <li>Earn achievement badges</li>
            </ul>
            <button className="role-cta" onClick={onRegisterClick}>Join as Student</button>
          </div>

          <div className="role-card teacher-card">
            <div className="role-icon">👩‍🏫</div>
            <h3>Teachers</h3>
            <ul className="role-list">
              <li>Create classroom groups</li>
              <li>Define trading rules</li>
              <li>Monitor student activity</li>
              <li>View analytics dashboards</li>
              <li>Launch competitions</li>
            </ul>
            <button className="role-cta" onClick={onRegisterClick}>Join as Teacher</button>
          </div>

          <div className="role-card admin-card">
            <div className="role-icon">👔</div>
            <h3>Administrators</h3>
            <ul className="role-list">
              <li>School-wide analytics</li>
              <li>Monitor usage trends</li>
              <li>Compare classrooms</li>
              <li>Track engagement</li>
              <li>Generate reports</li>
            </ul>
            <button className="role-cta" onClick={onRegisterClick}>Join as Admin</button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="stats">
        <div className="stats-background">
          <div className="stats-gradient"></div>
        </div>
        
        <div className="stats-content">
          <h2>The Impact So Far</h2>
          <div className="stats-grid">
            <StatCounter end={500} label="Students Trading" />
            <StatCounter end={50} label="Classrooms Active" />
            <StatCounter end={100000} label="Trades Executed" suffix="+" />
            <StatCounter end={2} label="Million in Simulated Value" suffix="M+" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta">
        <h2>Ready to Start Your Investment Journey?</h2>
        <p>Join thousands of students learning to invest today.</p>
        <button className="btn btn-primary btn-large" onClick={onRegisterClick}>Get Started Now</button>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>iLa learn</h4>
            <p>Educational financial literacy for the next generation.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <a href="#features">Features</a>
            <a href="#roles">For Everyone</a>
            <a href="#stats">Impact</a>
          </div>
          <div className="footer-section">
            <h4>Resources</h4>
            <a href="#about">About Us</a>
            <a href="#contact">Contact</a>
            <a href="#privacy">Privacy Policy</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 iLa learn. Built with 💡 by Group 8.</p>
        </div>
      </footer>
    </div>
  );
}