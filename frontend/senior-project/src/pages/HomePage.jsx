import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: '📈',
      title: 'Paper Trading',
      description: 'Practice trading with real market data without risking real money',
      color: '#22c55e',
    },
    {
      icon: '🤖',
      title: 'AI Tutor Assistant',
      description: 'Get personalized financial guidance powered by advanced AI',
      color: '#3b82f6',
    },
    {
      icon: '💼',
      title: 'Career Insights',
      description: 'Compare lifetime earnings across education levels and career paths',
      color: '#f59e0b',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Active Students' },
    { value: '$500M+', label: 'Paper Traded' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'AI Support' },
  ];

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="gradient-orb orb-1" style={{ transform: `translateY(${scrollY * 0.3}px)` }} />
          <div className="gradient-orb orb-2" style={{ transform: `translateY(${scrollY * 0.2}px)` }} />
          <div className="gradient-orb orb-3" style={{ transform: `translateY(${scrollY * 0.15}px)` }} />
        </div>

        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Financial Literacy Platform
            </div>
            
            <h1 className="hero-title">
              Master Investing,
              <br />
              <span className="gradient-text">Build Your Future</span>
            </h1>
            
            <p className="hero-description">
              Learn to invest with confidence using real market data, AI-powered guidance, 
              and risk-free paper trading. Join thousands of students building their financial future.
            </p>

            <div className="hero-buttons">
              <button className="btn-primary" onClick={() => navigate('/signup')}>
                Get Started Free
                <span className="btn-arrow">→</span>
              </button>
              <button className="btn-secondary" onClick={() => navigate('/stocks')}>
                <span className="play-icon">▶</span>
                Explore Markets
              </button>
            </div>

            <div className="hero-stats">
              {stats.map((stat, index) => (
                <div key={index} className="stat-item">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            {/* Placeholder for your video/gif - replace src with your media */}
            <div className="visual-container">
              <div className="floating-card card-1">
                <div className="card-icon">📊</div>
                <div className="card-text">
                  <div className="card-title">Live Market Data</div>
                  <div className="card-value positive">+12.5%</div>
                </div>
              </div>
              
              <div className="floating-card card-2">
                <div className="card-icon">💰</div>
                <div className="card-text">
                  <div className="card-title">Portfolio Value</div>
                  <div className="card-value">$10,247</div>
                </div>
              </div>

              <div className="main-visual">
                {/* Replace this div with: <img src="/path/to/your/gif-or-video.gif" alt="Dashboard Preview" /> */}
                <div className="placeholder-visual">
                  <div className="chart-line"></div>
                  <div className="chart-bars">
                    <div className="bar" style={{ height: '60%' }}></div>
                    <div className="bar" style={{ height: '80%' }}></div>
                    <div className="bar" style={{ height: '45%' }}></div>
                    <div className="bar" style={{ height: '90%' }}></div>
                    <div className="bar" style={{ height: '70%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Everything You Need to Learn Investing</h2>
          <p className="section-subtitle">
            Comprehensive tools designed specifically for student investors
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`feature-card ${activeFeature === index ? 'active' : ''}`}
              onMouseEnter={() => setActiveFeature(index)}
            >
              <div className="feature-icon" style={{ backgroundColor: `${feature.color}15` }}>
                <span style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))' }}>
                  {feature.icon}
                </span>
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <button className="feature-link" style={{ color: feature.color }}>
                Learn More →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Paper Trading Section */}
      <section className="demo-section paper-trading">
        <div className="demo-content">
          <div className="demo-text">
            <div className="demo-badge">Risk-Free Practice</div>
            <h2 className="demo-title">
              Trade Like a Pro
              <br />
              <span className="gradient-text">Without the Risk</span>
            </h2>
            <p className="demo-description">
              Practice with $100,000 in virtual cash. Real market data, real-time prices, 
              zero risk. Learn candlestick patterns, technical analysis, and trading strategies 
              in a safe environment.
            </p>
            
            <div className="demo-features">
              <div className="demo-feature">
                <span className="check-icon">✓</span>
                <span>Real-time market data</span>
              </div>
              <div className="demo-feature">
                <span className="check-icon">✓</span>
                <span>Advanced charting tools</span>
              </div>
              <div className="demo-feature">
                <span className="check-icon">✓</span>
                <span>Portfolio tracking</span>
              </div>
              <div className="demo-feature">
                <span className="check-icon">✓</span>
                <span>Performance analytics</span>
              </div>
            </div>

            <button className="btn-primary" onClick={() => navigate('/stocks')}>
              Start Paper Trading
              <span className="btn-arrow">→</span>
            </button>
          </div>

          <div className="demo-visual">
            {/* Replace with your trading dashboard gif/video */}
            <div className="demo-placeholder">
              <div className="mock-chart">
                <div className="chart-header">
                  <span className="chart-symbol">AAPL</span>
                  <span className="chart-price positive">$175.43 <small>+2.3%</small></span>
                </div>
                <div className="candlestick-preview">
                  <div className="candle green" style={{ height: '60%' }}></div>
                  <div className="candle red" style={{ height: '40%' }}></div>
                  <div className="candle green" style={{ height: '80%' }}></div>
                  <div className="candle green" style={{ height: '90%' }}></div>
                  <div className="candle red" style={{ height: '50%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Assistant Section */}
      <section className="demo-section ai-section">
        <div className="demo-content reverse">
          <div className="demo-visual">
            {/* Replace with your AI assistant gif/video */}
            <div className="demo-placeholder ai-placeholder">
              <div className="chat-bubble bot">
                <div className="bubble-header">
                  <span className="ai-icon">🤖</span>
                  <span>AI Tutor</span>
                </div>
                <p>Based on your portfolio, I recommend diversifying into tech ETFs. Would you like me to explain why?</p>
              </div>
              <div className="chat-bubble user">
                <p>Yes, please explain!</p>
              </div>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>

          <div className="demo-text">
            <div className="demo-badge">AI-Powered Learning</div>
            <h2 className="demo-title">
              Your Personal
              <br />
              <span className="gradient-text">Finance Mentor</span>
            </h2>
            <p className="demo-description">
              Get instant answers to your investing questions. Our AI tutor provides 
              personalized guidance, explains complex concepts in simple terms, and 
              helps you make informed decisions.
            </p>
            
            <div className="demo-features">
              <div className="demo-feature">
                <span className="check-icon">✓</span>
                <span>24/7 availability</span>
              </div>
              <div className="demo-feature">
                <span className="check-icon">✓</span>
                <span>Personalized insights</span>
              </div>
              <div className="demo-feature">
                <span className="check-icon">✓</span>
                <span>Market news analysis</span>
              </div>
              <div className="demo-feature">
                <span className="check-icon">✓</span>
                <span>Educational resources</span>
              </div>
            </div>

            <button className="btn-primary">
              Try AI Assistant
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Career Dashboard Section */}
      <section className="demo-section career-section">
        <div className="demo-content">
          <div className="demo-text">
            <div className="demo-badge">Data-Driven Insights</div>
            <h2 className="demo-title">
              Visualize Your
              <br />
              <span className="gradient-text">Career Potential</span>
            </h2>
            <p className="demo-description">
              Compare lifetime earnings across different education levels and career paths. 
              Make informed decisions about your future with real salary data and projections.
            </p>
            
            <div className="career-stats">
              <div className="career-stat">
                <div className="stat-icon">🎓</div>
                <div className="stat-info">
                  <div className="stat-num">$2.8M</div>
                  <div className="stat-desc">Bachelor's Degree Average</div>
                </div>
              </div>
              <div className="career-stat">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <div className="stat-num">$3.7M</div>
                  <div className="stat-desc">Master's Degree Average</div>
                </div>
              </div>
            </div>

            <button className="btn-primary">
              Explore Career Data
              <span className="btn-arrow">→</span>
            </button>
          </div>

          <div className="demo-visual">
            {/* Replace with your career dashboard gif/video */}
            <div className="demo-placeholder career-placeholder">
              <div className="career-chart">
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="dot" style={{ background: '#ef4444' }}></span>
                    <span>No Degree</span>
                  </div>
                  <div className="legend-item">
                    <span className="dot" style={{ background: '#f59e0b' }}></span>
                    <span>Bachelor's</span>
                  </div>
                  <div className="legend-item">
                    <span className="dot" style={{ background: '#22c55e' }}></span>
                    <span>Master's</span>
                  </div>
                  <div className="legend-item">
                    <span className="dot" style={{ background: '#3b82f6' }}></span>
                    <span>PhD</span>
                  </div>
                </div>
                <div className="career-lines">
                  <svg viewBox="0 0 300 150" className="career-svg">
                    <path d="M 0 140 Q 75 130 150 120 T 300 100" stroke="#ef4444" fill="none" strokeWidth="2"/>
                    <path d="M 0 120 Q 75 100 150 80 T 300 60" stroke="#f59e0b" fill="none" strokeWidth="2"/>
                    <path d="M 0 110 Q 75 85 150 60 T 300 40" stroke="#22c55e" fill="none" strokeWidth="2"/>
                    <path d="M 0 100 Q 75 70 150 50 T 300 30" stroke="#3b82f6" fill="none" strokeWidth="2"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Start Your Financial Journey?</h2>
          <p className="cta-description">
            Join thousands of students already building their financial future with UpScale
          </p>
          <div className="cta-buttons">
            <button className="btn-primary large" onClick={() => navigate('/signup')}>
              Create Free Account
              <span className="btn-arrow">→</span>
            </button>
            <button className="btn-secondary large" onClick={() => navigate('/learning-center')}>
              Browse Learning Center
            </button>
          </div>
        </div>

        <div className="cta-background">
          <div className="cta-orb cta-orb-1"></div>
          <div className="cta-orb cta-orb-2"></div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
