import React, { useEffect, useRef, useState } from "react";
import "./LearningcenterPage.css";

const LearningCenter = () => {
  const [expandedUnit, setExpandedUnit] = useState(null);
  const [showCourseDetails, setShowCourseDetails] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const unitsSectionRef = useRef(null);
  const quizSectionRef = useRef(null);
  
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowCourseDetails(false);
        setShowLeaderboard(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Track completed lessons
  const [completedLessons, setCompletedLessons] = useState([]);
  
  // Track active lesson (for video/content display)
  const [activeLesson, setActiveLesson] = useState(null);
  
  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const courseUnits = [
    {
      id: 1,
      title: "Stock Market Fundamentals",
      description: "Foundation of investing knowledge starts with understanding the market basics.",
      locked: false,
      lessons: [
        { 
          id: 'intro-stock-market', 
          title: 'What is the Stock Market?', 
          duration: '5 min', 
          type: 'video',
          videoUrl: 'https://www.youtube.com/embed/p7HKvqRI_Bo',
          content: 'Learn the basics of how the stock market works and why it exists.'
        },
        { 
          id: 'how-stocks-work', 
          title: 'How Stocks Work', 
          duration: '8 min', 
          type: 'article',
          content: `
            <h4>Understanding Stock Ownership</h4>
            <p>When you buy a stock, you're purchasing a small piece of ownership in a company. This makes you a shareholder, giving you a claim on the company's assets and earnings.</p>
            
            <h4>How Stock Prices Change</h4>
            <p>Stock prices fluctuate based on supply and demand. When more people want to buy a stock (demand) than sell it (supply), the price goes up. Conversely, if more people want to sell than buy, the price falls.</p>
            
            <h4>Making Money from Stocks</h4>
            <p>There are two main ways to profit from stocks:</p>
            <ul>
              <li><strong>Capital Gains:</strong> Selling your stock for more than you paid for it</li>
              <li><strong>Dividends:</strong> Regular payments companies make to shareholders from their profits</li>
            </ul>
            
            <h4>Stock Classes</h4>
            <p>Companies may offer different classes of stock, most commonly:</p>
            <ul>
              <li><strong>Common Stock:</strong> Includes voting rights and potential dividends</li>
              <li><strong>Preferred Stock:</strong> Priority for dividends but typically no voting rights</li>
            </ul>
          `
        },
        { 
          id: 'stock-exchanges', 
          title: 'Stock Exchanges Explained', 
          duration: '6 min', 
          type: 'article',
          content: `
            <h4>What is a Stock Exchange?</h4>
            <p>A stock exchange is a regulated marketplace where stocks and other securities are bought and sold. It provides a transparent, organized environment for trading.</p>
            
            <h4>Major Stock Exchanges</h4>
            <ul>
              <li><strong>New York Stock Exchange (NYSE):</strong> The world's largest stock exchange, home to many blue-chip companies</li>
              <li><strong>NASDAQ:</strong> Known for technology and growth companies, fully electronic trading platform</li>
              <li><strong>London Stock Exchange (LSE):</strong> One of the oldest exchanges, serving international markets</li>
            </ul>
            
            <h4>How Exchanges Work</h4>
            <p>Stock exchanges match buyers and sellers through electronic systems. They ensure fair pricing through continuous bidding and asking, creating market transparency.</p>
            
            <h4>Trading Hours</h4>
            <p>Most exchanges operate during regular business hours in their time zones. The NYSE and NASDAQ trade from 9:30 AM to 4:00 PM Eastern Time on weekdays.</p>
          `
        },
        { 
          id: 'market-participants', 
          title: 'Market Participants', 
          duration: '7 min', 
          type: 'article',
          content: `
            <h4>Who Trades in the Stock Market?</h4>
            <p>The stock market includes various types of participants, each with different roles and strategies:</p>
            
            <h4>Retail Investors</h4>
            <p>Individual investors like you and me who buy and sell stocks through brokerage accounts. Retail investors typically trade smaller amounts and invest for long-term goals.</p>
            
            <h4>Institutional Investors</h4>
            <ul>
              <li><strong>Mutual Funds:</strong> Pool money from many investors to buy diversified portfolios</li>
              <li><strong>Pension Funds:</strong> Manage retirement savings for millions of workers</li>
              <li><strong>Hedge Funds:</strong> Use sophisticated strategies for high-net-worth clients</li>
              <li><strong>Insurance Companies:</strong> Invest premiums to meet future obligations</li>
            </ul>
            
            <h4>Market Makers</h4>
            <p>Firms that provide liquidity by always being ready to buy or sell specific stocks, ensuring smooth market operations.</p>
            
            <h4>Brokers</h4>
            <p>Licensed professionals or firms that execute trades on behalf of investors, connecting buyers and sellers.</p>
          `
        },
        { 
          id: 'bull-bear', 
          title: 'Bull vs Bear Markets', 
          duration: '9 min', 
          type: 'video',
          videoUrl: 'https://www.youtube.com/embed/4S3AkR22lSE',
          content: 'Understanding market trends and cycles.'
        }
      ]
    },
    {
      id: 2,
      title: "Investment Terminology",
      description: "Master the essential terms every investor needs to know.",
      locked: false,
      lessons: [
        { 
          id: 'portfolio-diversification', 
          title: 'Portfolio & Diversification', 
          duration: '12 min', 
          type: 'video',
          videoUrl: 'https://www.youtube.com/embed/gF_uTM_B5qk',
          content: 'Learn about portfolio diversification strategies.'
        },
        { 
          id: 'dividends-yields', 
          title: 'Dividends & Yields', 
          duration: '10 min', 
          type: 'article',
          content: `
            <h4>What are Dividends?</h4>
            <p>Dividends are payments companies make to shareholders from their profits. They're typically paid quarterly and represent a share of the company's earnings.</p>
            
            <h4>Understanding Dividend Yield</h4>
            <p>Dividend yield is a financial ratio that shows how much a company pays in dividends relative to its stock price:</p>
            <p><strong>Dividend Yield = (Annual Dividends Per Share / Stock Price) × 100</strong></p>
            
            <h4>Example Calculation</h4>
            <p>If a stock costs $100 and pays $4 in annual dividends, the dividend yield is 4%.</p>
            
            <h4>Types of Dividend Stocks</h4>
            <ul>
              <li><strong>High-Yield Stocks:</strong> Offer higher dividend payments, often mature companies</li>
              <li><strong>Dividend Growth Stocks:</strong> Consistently increase dividends over time</li>
              <li><strong>Dividend Aristocrats:</strong> Companies that have increased dividends for 25+ consecutive years</li>
            </ul>
            
            <h4>Why Companies Pay Dividends</h4>
            <p>Mature, profitable companies often pay dividends to reward shareholders and demonstrate financial health. Growth companies typically reinvest profits instead.</p>
          `
        },
        { 
          id: 'market-cap', 
          title: 'Market Cap & Valuation', 
          duration: '15 min', 
          type: 'article',
          content: `
            <h4>What is Market Capitalization?</h4>
            <p>Market capitalization (market cap) is the total value of all a company's outstanding shares. It's calculated by multiplying the stock price by the number of shares.</p>
            <p><strong>Market Cap = Stock Price × Total Outstanding Shares</strong></p>
            
            <h4>Market Cap Categories</h4>
            <ul>
              <li><strong>Large-Cap:</strong> $10 billion+ (e.g., Apple, Microsoft) - Established, stable companies</li>
              <li><strong>Mid-Cap:</strong> $2-10 billion - Growing companies with expansion potential</li>
              <li><strong>Small-Cap:</strong> $300 million-$2 billion - Smaller companies with higher growth potential and risk</li>
              <li><strong>Micro-Cap:</strong> Under $300 million - Very small, highly volatile companies</li>
            </ul>
            
            <h4>Why Market Cap Matters</h4>
            <p>Market cap helps investors understand a company's size, risk profile, and growth potential. Larger companies tend to be more stable, while smaller companies may offer higher growth potential with increased risk.</p>
            
            <h4>Market Cap vs. Company Value</h4>
            <p>Market cap represents what investors think the company is worth, not necessarily its book value or intrinsic value. It fluctuates with stock price changes.</p>
          `
        },
        { 
          id: 'pe-ratio', 
          title: 'P/E Ratio Explained', 
          duration: '8 min', 
          type: 'article',
          content: `
            <h4>Understanding P/E Ratio</h4>
            <p>The Price-to-Earnings (P/E) ratio is one of the most widely used valuation metrics in investing. It compares a company's stock price to its earnings per share (EPS).</p>
            <p><strong>P/E Ratio = Stock Price / Earnings Per Share</strong></p>
            
            <h4>Interpreting P/E Ratios</h4>
            <ul>
              <li><strong>High P/E (20+):</strong> Investors expect high growth, stock may be overvalued</li>
              <li><strong>Low P/E (Under 15):</strong> May be undervalued, or company faces challenges</li>
              <li><strong>Average P/E (15-20):</strong> Fairly valued relative to earnings</li>
            </ul>
            
            <h4>Example</h4>
            <p>If a stock trades at $50 and the company earned $5 per share last year, the P/E ratio is 10 ($50 / $5 = 10). This means investors are willing to pay $10 for every $1 of earnings.</p>
            
            <h4>Limitations</h4>
            <p>P/E ratios should be compared within the same industry, as different sectors have different typical ranges. Also, one-time events can distort earnings and the P/E ratio.</p>
            
            <h4>Forward P/E vs. Trailing P/E</h4>
            <p>Trailing P/E uses past earnings, while forward P/E uses estimated future earnings, giving insight into growth expectations.</p>
          `
        }
      ]
    },
    {
      id: 3,
      title: "Investment Strategies",
      description: "Learn proven strategies for building long-term wealth through smart investing.",
      locked: false,
      lessons: [
        { 
          id: 'value-investing', 
          title: 'Value Investing', 
          duration: '15 min', 
          type: 'video',
          videoUrl: 'https://www.youtube.com/embed/gF_uTM_B5qk',
          content: 'Value investing principles and strategies.'
        },
        { 
          id: 'growth-investing', 
          title: 'Growth Investing', 
          duration: '12 min', 
          type: 'article',
          content: `
            <h4>What is Growth Investing?</h4>
            <p>Growth investing focuses on companies expected to grow at an above-average rate compared to other companies. These companies typically reinvest earnings rather than paying dividends.</p>
            
            <h4>Characteristics of Growth Stocks</h4>
            <ul>
              <li><strong>High Revenue Growth:</strong> Rapidly increasing sales year over year</li>
              <li><strong>Innovative Products:</strong> Leading-edge technology or unique offerings</li>
              <li><strong>Market Expansion:</strong> Entering new markets or disrupting existing ones</li>
              <li><strong>High P/E Ratios:</strong> Investors willing to pay premium prices for future growth</li>
            </ul>
            
            <h4>Growth vs. Value Investing</h4>
            <p>While value investors look for underpriced stocks, growth investors focus on companies with strong future potential, even if currently expensive.</p>
            
            <h4>Risks of Growth Investing</h4>
            <p>Growth stocks can be volatile. If growth expectations aren't met, prices can fall dramatically. They're also more sensitive to interest rate changes and economic conditions.</p>
            
            <h4>Examples of Growth Sectors</h4>
            <p>Technology, biotechnology, renewable energy, and e-commerce are common growth sectors with high expansion potential.</p>
          `
        },
        { 
          id: 'index-funds', 
          title: 'Index Fund Investing', 
          duration: '18 min', 
          type: 'article',
          content: `
            <h4>What are Index Funds?</h4>
            <p>Index funds are investment funds that track a specific market index, such as the S&P 500. They provide instant diversification by holding all (or a representative sample) of the securities in an index.</p>
            
            <h4>Benefits of Index Funds</h4>
            <ul>
              <li><strong>Low Costs:</strong> Minimal management fees compared to actively managed funds</li>
              <li><strong>Diversification:</strong> Instant exposure to hundreds or thousands of stocks</li>
              <li><strong>Consistent Returns:</strong> Match market performance over time</li>
              <li><strong>Simplicity:</strong> Easy to understand and manage</li>
              <li><strong>Tax Efficiency:</strong> Lower turnover means fewer taxable events</li>
            </ul>
            
            <h4>Popular Index Funds</h4>
            <ul>
              <li><strong>S&P 500 Index:</strong> Tracks 500 largest U.S. companies</li>
              <li><strong>Total Stock Market Index:</strong> Covers entire U.S. stock market</li>
              <li><strong>International Index:</strong> Provides global diversification</li>
              <li><strong>Bond Index:</strong> Tracks fixed-income securities</li>
            </ul>
            
            <h4>Why Index Funds Work</h4>
            <p>Studies show that most actively managed funds fail to beat index funds over long periods after accounting for fees. Index funds offer a reliable path to market returns.</p>
            
            <h4>Getting Started</h4>
            <p>Most brokerages offer low-cost index funds. Start with broad market funds like S&P 500 or total market indexes for core holdings.</p>
          `
        },
        { 
          id: 'dollar-cost-avg', 
          title: 'Dollar-Cost Averaging', 
          duration: '10 min', 
          type: 'video',
          videoUrl: 'https://www.youtube.com/embed/gF_uTM_B5qk',
          content: 'Dollar-cost averaging strategy explained.'
        }
      ]
    },
    {
      id: 4,
      title: "Risk Management",
      description: "Protect your investments and manage portfolio risk effectively.",
      locked: false,
      lessons: [
        { 
          id: 'risk-basics', 
          title: 'Understanding Investment Risk', 
          duration: '20 min', 
          type: 'video',
          videoUrl: 'https://www.youtube.com/embed/gF_uTM_B5qk',
          content: 'Understanding different types of investment risk.'
        },
        { 
          id: 'asset-allocation', 
          title: 'Asset Allocation Strategies', 
          duration: '15 min', 
          type: 'article',
          content: `
            <h4>What is Asset Allocation?</h4>
            <p>Asset allocation is the process of dividing your investment portfolio among different asset categories such as stocks, bonds, cash, and real estate. It's one of the most important investment decisions you'll make.</p>
            
            <h4>Main Asset Classes</h4>
            <ul>
              <li><strong>Stocks (Equities):</strong> Higher risk, higher potential returns, best for long-term growth</li>
              <li><strong>Bonds (Fixed Income):</strong> Lower risk, steady income, provides stability</li>
              <li><strong>Cash & Cash Equivalents:</strong> Lowest risk, highest liquidity, minimal returns</li>
              <li><strong>Real Estate:</strong> Tangible assets, inflation hedge, rental income potential</li>
            </ul>
            
            <h4>Factors Affecting Your Allocation</h4>
            <ul>
              <li><strong>Risk Tolerance:</strong> How much volatility can you handle?</li>
              <li><strong>Time Horizon:</strong> When will you need the money?</li>
              <li><strong>Financial Goals:</strong> Retirement, home purchase, education?</li>
              <li><strong>Age:</strong> Younger investors can typically take more risk</li>
            </ul>
            
            <h4>Common Allocation Strategies</h4>
            <p><strong>Age-Based Rule:</strong> Hold (100 - your age)% in stocks. A 30-year-old would hold 70% stocks, 30% bonds.</p>
            <p><strong>Conservative:</strong> 40% stocks, 50% bonds, 10% cash</p>
            <p><strong>Moderate:</strong> 60% stocks, 35% bonds, 5% cash</p>
            <p><strong>Aggressive:</strong> 80% stocks, 15% bonds, 5% cash</p>
            
            <h4>Why It Matters</h4>
            <p>Studies show that asset allocation accounts for over 90% of portfolio returns over time - more important than individual security selection.</p>
          `
        },
        { 
          id: 'rebalancing', 
          title: 'Portfolio Rebalancing', 
          duration: '12 min', 
          type: 'article',
          content: `
            <h4>What is Rebalancing?</h4>
            <p>Rebalancing is the process of realigning your portfolio back to your target asset allocation. As markets move, your portfolio drifts from its original allocation.</p>
            
            <h4>Why Rebalance?</h4>
            <ul>
              <li><strong>Maintain Risk Level:</strong> Keep your desired risk exposure</li>
              <li><strong>Discipline:</strong> Forces you to "buy low, sell high"</li>
              <li><strong>Avoid Concentration:</strong> Prevent overexposure to any asset</li>
              <li><strong>Stay on Track:</strong> Align with your long-term goals</li>
            </ul>
            
            <h4>Example of Portfolio Drift</h4>
            <p>You start with 60% stocks, 40% bonds. After a strong year for stocks, your portfolio becomes 70% stocks, 30% bonds. Rebalancing means selling some stocks and buying bonds to return to 60/40.</p>
            
            <h4>When to Rebalance</h4>
            <ul>
              <li><strong>Calendar-Based:</strong> Quarterly, semi-annually, or annually</li>
              <li><strong>Threshold-Based:</strong> When allocation drifts 5% or more from target</li>
              <li><strong>Combination:</strong> Check quarterly but only rebalance if thresholds are exceeded</li>
            </ul>
            
            <h4>How to Rebalance</h4>
            <p>You can rebalance by selling overweight assets and buying underweight ones, or by directing new contributions to underweight assets.</p>
            
            <h4>Tax Considerations</h4>
            <p>Rebalancing in tax-advantaged accounts (401k, IRA) avoids capital gains taxes. In taxable accounts, consider tax implications before rebalancing.</p>
          `
        }
      ]
    }
  ];

  const quizQuestions = [
    {
      question: "What is a Bull Market?",
      options: [
        "A market where prices are falling",
        "A market where prices are rising consistently",
        "A market with no price movement",
        "A market only for livestock trading"
      ],
      correct: 1
    },
    {
      question: "What does 'Portfolio Diversification' mean?",
      options: [
        "Investing all money in one stock",
        "Spreading investments across different assets to reduce risk",
        "Only investing in technology companies",
        "Keeping all money in cash"
      ],
      correct: 1
    },
    {
      question: "What are Dividends?",
      options: [
        "Fees charged by brokers",
        "Payments made by companies to shareholders from profits",
        "The price you pay for a stock",
        "Losses in your investment"
      ],
      correct: 1
    },
    {
      question: "What does Market Capitalization (Market Cap) represent?",
      options: [
        "The total value of a company's outstanding shares",
        "The number of employees in a company",
        "The physical size of company buildings",
        "The company's annual revenue"
      ],
      correct: 0
    },
    {
      question: "What is a Bear Market?",
      options: [
        "A market where investors are aggressive",
        "A market experiencing prolonged price declines",
        "A market only for experienced traders",
        "A market with high trading volume"
      ],
      correct: 1
    },
    {
      question: "What does P/E Ratio stand for?",
      options: [
        "Profit/Expense Ratio",
        "Price/Earnings Ratio",
        "Portfolio/Equity Ratio",
        "Performance/Evaluation Ratio"
      ],
      correct: 1
    },
    {
      question: "What is an ETF?",
      options: [
        "Electronic Trading Facility",
        "Exchange Traded Fund - a basket of securities traded on an exchange",
        "Estimated Time Frame",
        "Equity Transaction Fee"
      ],
      correct: 1
    },
    {
      question: "What does 'Blue Chip Stock' refer to?",
      options: [
        "Stocks that have fallen in value",
        "New startup company stocks",
        "Stocks of large, well-established, financially stable companies",
        "Technology sector stocks only"
      ],
      correct: 2
    }
  ];

  // Calculate if unit is locked (previous unit must be 100% complete)
  const isUnitLocked = (unitIndex) => {
    if (unitIndex === 0) return false;
    const previousUnit = courseUnits[unitIndex - 1];
    return getUnitProgress(previousUnit) < 100;
  };

  // Calculate progress for a specific unit
  const getUnitProgress = (unit) => {
    const totalLessons = unit.lessons.length;
    const completed = unit.lessons.filter(lesson => 
      completedLessons.includes(lesson.id)
    ).length;
    return Math.round((completed / totalLessons) * 100);
  };

  // Toggle unit expansion
  const toggleUnit = (unitId, unitIndex) => {
    if (isUnitLocked(unitIndex)) return;
    setExpandedUnit(expandedUnit === unitId ? null : unitId);
  };

  // Check if lesson is completed
  const isLessonCompleted = (lessonId) => {
    return completedLessons.includes(lessonId);
  };

  // Handle lesson click - mark as complete and show content
  const handleLessonClick = (lesson) => {
    // Toggle active lesson
    if (activeLesson?.id === lesson.id) {
      setActiveLesson(null);
    } else {
      setActiveLesson(lesson);
      // Auto-mark as complete when opened
      if (!completedLessons.includes(lesson.id)) {
        setCompletedLessons([...completedLessons, lesson.id]);
      }
    }
  };

  // Get total lessons across all units
  const getTotalLessons = () => {
    return courseUnits.reduce((total, unit) => total + unit.lessons.length, 0);
  };

  // Get completed lessons count
  const getCompletedCount = () => {
    return completedLessons.length;
  };

  // Calculate overall progress percentage
  const getOverallProgress = () => {
    const total = getTotalLessons();
    const completed = getCompletedCount();
    return Math.round((completed / total) * 100);
  };

  // Check if all units are completed
  const areAllUnitsCompleted = () => {
    return completedLessons.length === getTotalLessons();
  };

  // Get quizzes passed count
  const getQuizzesPassed = () => {
    return showScore && score >= quizQuestions.length * 0.7 ? 1 : 0;
  };

  // Scroll to ref
  const scrollToRef = (ref) => {
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Find first incomplete unit
  const findFirstIncompleteUnit = () => {
    for (let i = 0; i < courseUnits.length; i++) {
      const unit = courseUnits[i];
      if (isUnitLocked(i)) continue;
      const hasIncomplete = unit.lessons.some((l) => !isLessonCompleted(l.id));
      if (hasIncomplete) return unit;
    }
    return courseUnits[0];
  };

  // Handle resume learning button
  const handleResumeLearning = () => {
    const unit = findFirstIncompleteUnit();
    if (!unit) return;
    setExpandedUnit(unit.id);

    requestAnimationFrame(() => {
      const el = document.getElementById(`unit-${unit.id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else scrollToRef(unitsSectionRef);
    });
  };

  // Quiz handlers
  const handleAnswerClick = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === quizQuestions[currentQuestion].correct) {
      setScore(score + 1);
    }

    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < quizQuestions.length) {
      setCurrentQuestion(nextQuestion);
      setSelectedAnswer(null);
    } else {
      setShowScore(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setSelectedAnswer(null);
    setQuizStarted(false);
  };

  // Calculate progress circle
  const progress = getOverallProgress();
  const circumference = 2 * Math.PI * 62;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="learning-page">
      <div className="learning-container">
        {/* Header */}
        <header className="learning-header">
          <span className="header-badge">INVESTING 101</span>
          <h1 className="learning-title">Stock Market Mastery</h1>
          <p className="learning-subtitle">
            Build a solid foundation in investing with our comprehensive course covering
            market fundamentals, terminology, strategies, and risk management.
          </p>
          <div className="header-actions">
            <button className="primary-btn" onClick={handleResumeLearning}>
              {completedLessons.length > 0 ? 'Continue Learning' : 'Start Learning'}
            </button>
            <button className="secondary-btn" onClick={() => setShowCourseDetails(true)}>
              Course Details
            </button>
          </div>
        </header>

        {/* Course Layout */}
        <div className="course-layout">
          {/* Main Content */}
          <main className="course-main" ref={unitsSectionRef}>
            <div className="section-header">
              <h2 className="section-title">
                <span className="icon">📚</span>
                Course Units
              </h2>
            </div>

            <div className="units-list">
              {courseUnits.map((unit, index) => {
                const unitProgress = getUnitProgress(unit);
                const locked = isUnitLocked(index);
                const isExpanded = expandedUnit === unit.id;

                return (
                  <div
                    key={unit.id}
                    id={`unit-${unit.id}`}
                    className={`unit-card ${locked ? 'locked' : ''}`}
                  >
                    <div
                      className="unit-header"
                      onClick={() => toggleUnit(unit.id, index)}
                    >
                      <div className="unit-info">
                        <div className="unit-meta">
                          <span className="unit-number">UNIT {unit.id}</span>
                          {unitProgress === 100 ? (
                            <span className="completion-badge">
                              <span className="check-icon">✓</span>
                              Complete
                            </span>
                          ) : locked ? (
                            <span className="locked-badge">🔒 Locked</span>
                          ) : null}
                        </div>
                        <h3 className="unit-title">{unit.title}</h3>
                        <p className="unit-description">{unit.description}</p>
                      </div>
                      {locked ? (
                        <div className="lock-icon">🔒</div>
                      ) : (
                        <div className="expand-icon">
                          {isExpanded ? '−' : '+'}
                        </div>
                      )}
                    </div>

                    {isExpanded && !locked && (
                      <div className="lessons-list">
                        {unit.lessons.map((lesson) => {
                          const completed = isLessonCompleted(lesson.id);
                          const isActive = activeLesson?.id === lesson.id;
                          
                          return (
                            <div key={lesson.id}>
                              <div
                                className={`lesson-item ${completed ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                                onClick={() => handleLessonClick(lesson)}
                              >
                                <div className="lesson-icon">
                                  {lesson.type === 'video' ? '🎥' : 
                                   lesson.type === 'quiz' ? '📝' : '📄'}
                                </div>
                                <div className="lesson-content">
                                  <div className="lesson-title">{lesson.title}</div>
                                  <div className="lesson-duration">{lesson.duration}</div>
                                </div>
                                {completed && (
                                  <div className="completion-check">✓</div>
                                )}
                              </div>
                              
                              {/* Video/Content Player */}
                              {isActive && (
                                <div className="lesson-player">
                                  {lesson.type === 'video' && lesson.videoUrl ? (
                                    <div className="video-container">
                                      <iframe
                                        src={lesson.videoUrl}
                                        title={lesson.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      ></iframe>
                                    </div>
                                  ) : (
                                    <div 
                                      className="article-content"
                                      dangerouslySetInnerHTML={{ __html: lesson.content }}
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {isExpanded && locked && (
                      <div className="locked-message">
                        <span className="lock-icon-large">🔒</span>
                        <p>Complete the previous unit to unlock this content</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </main>

          {/* Sidebar */}
          <aside className="course-sidebar">
            {/* Progress Card */}
            <div className="progress-card">
              <div className="progress-header">
                <span className="progress-icon">📊</span>
                <h3>Your Progress</h3>
              </div>

              <div className="progress-circle-container">
                <div className="progress-circle">
                  <svg viewBox="0 0 140 140">
                    <circle className="progress-bg" cx="70" cy="70" r="62" />
                    <circle
                      className="progress-fill"
                      cx="70"
                      cy="70"
                      r="62"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                    />
                  </svg>
                  <div className="progress-percentage">{progress}%</div>
                </div>
                <div className="progress-level">
                  {progress === 100 ? 'Course Complete!' :
                   progress >= 75 ? 'Almost There!' :
                   progress >= 50 ? 'Halfway!' :
                   progress >= 25 ? 'Making Progress!' :
                   'Just Getting Started!'}
                </div>
              </div>

              <div className="progress-stats">
                <div className="stat-item">
                  <span className="stat-label">Lessons Completed</span>
                  <span className="stat-value">
                    {getCompletedCount()} / {getTotalLessons()}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Current Streak</span>
                  <span className="stat-value streak">5 days 🔥</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Quizzes Passed</span>
                  <span className="stat-value">{getQuizzesPassed()}</span>
                </div>
              </div>

              <div className="achievements">
                <h4>Recent Badges</h4>
                <div className="badges">
                  <div className={`badge ${completedLessons.length >= 5 ? 'earned' : 'locked'}`} title="First Steps">
                    🎯
                  </div>
                  <div className={`badge ${progress >= 50 ? 'earned' : 'locked'}`} title="Halfway Hero">
                    🏆
                  </div>
                  <div className={`badge ${progress === 100 ? 'earned' : 'locked'}`} title="Course Master">
                    👑
                  </div>
                </div>
              </div>

              <button className="leaderboard-btn" onClick={() => setShowLeaderboard(true)}>
                View Leaderboard 📈
              </button>
            </div>

            {/* Milestone Card */}
            <div className="milestone-card">
              <h3>Next Milestone</h3>
              <p>Complete {getTotalLessons() - getCompletedCount()} more lessons to finish the course!</p>
              <div className="milestone-progress">
                <div className="milestone-bar">
                  <div className="milestone-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="milestone-text">
                  {getCompletedCount()}/{getTotalLessons()}
                </span>
              </div>
            </div>
          </aside>
        </div>

        {/* Modals */}
        {(showCourseDetails || showLeaderboard) && (
          <div
            className="modal-overlay"
            onClick={() => {
              setShowCourseDetails(false);
              setShowLeaderboard(false);
            }}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">
                  {showCourseDetails ? "Course Details" : "Leaderboard"}
                </h3>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowCourseDetails(false);
                    setShowLeaderboard(false);
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {showCourseDetails ? (
                <div className="modal-body">
                  <p className="modal-lead">
                    This course is a guided path through investing fundamentals—designed for
                    beginners and future long-term investors.
                  </p>

                  <div className="detail-grid">
                    <div className="detail-item">
                      <div className="detail-label">Units</div>
                      <div className="detail-value">{courseUnits.length}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Lessons</div>
                      <div className="detail-value">{getTotalLessons()}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Difficulty</div>
                      <div className="detail-value">Beginner → Intermediate</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Recommended Pace</div>
                      <div className="detail-value">20–30 min/day</div>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button
                      className="primary-btn"
                      onClick={() => {
                        setShowCourseDetails(false);
                        handleResumeLearning();
                      }}
                    >
                      Continue Learning
                    </button>
                    {areAllUnitsCompleted() && (
                      <button
                        className="secondary-btn"
                        onClick={() => {
                          setShowCourseDetails(false);
                          scrollToRef(quizSectionRef);
                        }}
                      >
                        Take Final Quiz
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="modal-body">
                  <div className="leaderboard-list">
                    {[
                      { name: "A. Morgan", points: 1280, streak: 12 },
                      { name: "J. Patel", points: 1215, streak: 9 },
                      { name: "E. Carter", points: 1180, streak: 5 },
                      { name: "S. Nguyen", points: 1105, streak: 7 },
                      { name: "R. Kim", points: 995, streak: 3 }
                    ].map((row, i) => (
                      <div key={row.name} className="leaderboard-row">
                        <div className="lb-rank">#{i + 1}</div>
                        <div className="lb-name">{row.name}</div>
                        <div className="lb-meta">
                          <span className="lb-points">{row.points} pts</span>
                          <span className="lb-streak">🔥 {row.streak}d</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="modal-actions">
                    <button
                      className="primary-btn"
                      onClick={() => {
                        setShowLeaderboard(false);
                        handleResumeLearning();
                      }}
                    >
                      Resume Learning
                    </button>
                    <button className="secondary-btn" onClick={() => setShowLeaderboard(false)}>
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interactive Quiz Section - Only shows when all units completed */}
        {areAllUnitsCompleted() && (
          <section className="quiz-section" ref={quizSectionRef} id="quiz">
            <div className="quiz-header">
              <h2 className="quiz-title">🎓 Final Assessment</h2>
              <p className="quiz-description">
                Test your knowledge and earn your Stock Market Mastery certificate!
              </p>
            </div>

            {!quizStarted ? (
              <div className="quiz-start">
                <button className="quiz-start-btn" onClick={() => setQuizStarted(true)}>
                  Start Final Quiz
                </button>
              </div>
            ) : (
              <div className="quiz-container">
                {showScore ? (
                  <div className="quiz-results">
                    <h3 className="results-title">Quiz Complete! 🎉</h3>
                    <div className="score-display">
                      <span className="score-number">{score}</span>
                      <span className="score-total">/ {quizQuestions.length}</span>
                    </div>
                    <p className="score-message">
                      {score === quizQuestions.length
                        ? "Perfect score! You're a stock market expert! 🏆"
                        : score >= quizQuestions.length * 0.7
                        ? "Great job! You have a solid understanding! 🌟"
                        : score >= quizQuestions.length * 0.5
                        ? "Good effort! Keep learning and you'll master it! 💪"
                        : "Keep studying! Review the concepts above and try again. 📚"}
                    </p>
                    <button className="quiz-retry-btn" onClick={resetQuiz}>
                      Try Again
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="quiz-progress">
                      <span className="progress-text">
                        Question {currentQuestion + 1} of {quizQuestions.length}
                      </span>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="question-card">
                      <h3 className="question-text">
                        {quizQuestions[currentQuestion].question}
                      </h3>
                      <div className="options-grid">
                        {quizQuestions[currentQuestion].options.map((option, index) => (
                          <button
                            key={index}
                            className={`option-btn ${
                              selectedAnswer === index ? "selected" : ""
                            }`}
                            onClick={() => handleAnswerClick(index)}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      <button
                        className="quiz-next-btn"
                        onClick={handleNextQuestion}
                        disabled={selectedAnswer === null}
                      >
                        {currentQuestion === quizQuestions.length - 1 ? "Finish Quiz" : "Next Question"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        )}

        {/* Quiz Locked Message */}
        {!areAllUnitsCompleted() && (
          <section className="quiz-section" ref={quizSectionRef} id="quiz">
            <div className="quiz-header">
              <h2 className="quiz-title">🔒 Final Assessment Locked</h2>
              <p className="quiz-description">
                Complete all {getTotalLessons()} lessons to unlock the final quiz
              </p>
            </div>
            <div className="locked-message" style={{ padding: '64px 32px' }}>
              <span className="lock-icon-large" style={{ fontSize: '72px', marginBottom: '24px' }}>🔒</span>
              <p style={{ fontSize: '16px', marginBottom: '16px' }}>
                You've completed {getCompletedCount()} of {getTotalLessons()} lessons
              </p>
              <p style={{ fontSize: '14px', color: 'var(--green)' }}>
                {getTotalLessons() - getCompletedCount()} lessons remaining
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default LearningCenter;