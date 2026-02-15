import { useEffect, useState } from "react";
import NewsCard from "../components/NewsCard";
import "./NewsPage.css";
import { useAuth } from "../hooks/AuthContext";

const NewsPage = () => {
    const [articles, setArticles] = useState([]);
    const [filteredArticles, setFilteredArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const { auth, loadingAuth } = useAuth();
    

    const categories = [
        { id: "all", label: "All News", icon: "📰" },
        { id: "market", label: "Markets", icon: "📈" },
        { id: "stocks", label: "Stocks", icon: "💹" },
        { id: "crypto", label: "Crypto", icon: "₿" },
        { id: "economy", label: "Economy", icon: "💰" },
    ];

    async function fetchNews(auth) {
        setLoading(true);
        setError(null);

        try {
        const res = await fetch("/api/react/news", { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
            auth: auth, 
            "is-everything": false
            }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const articlesData = Array.isArray(json) ? json : (json.articles ?? []);
        setArticles(articlesData);
        setFilteredArticles(articlesData);
        } catch (err) {
        setError(err.message || "Failed to fetch news");
        console.error("Error fetching news:", err);
        } finally {
        setLoading(false);
        }
    }
    useEffect(() => {
        fetchNews(auth);
    }, [auth]);

    // Filter articles based on search and category
    useEffect(() => {
        let filtered = articles;

        // Search filter
        if (searchTerm) {
        filtered = filtered.filter((article) => {
            const searchLower = searchTerm.toLowerCase();
            return (
            article.title?.toLowerCase().includes(searchLower) ||
            article.description?.toLowerCase().includes(searchLower) ||
            article.source?.name?.toLowerCase().includes(searchLower)
            );
        });
        }

        // Category filter (simple keyword matching)
        if (selectedCategory !== "all") {
        filtered = filtered.filter((article) => {
            const text = `${article.title} ${article.description}`.toLowerCase();
            return text.includes(selectedCategory);
        });
        }

        setFilteredArticles(filtered);
    }, [searchTerm, selectedCategory, articles]);

    return (
        <div className="news-page">
        {/* Hero Section */}
        <section className="news-hero">
            <div className="news-hero-content">
            <div className="news-hero-badge">
                <span className="badge-dot"></span>
                Latest Financial News
            </div>
            <h1 className="news-hero-title">
                Stay Informed,
                <br />
                <span className="gradient-text">Invest Smarter</span>
            </h1>
            <p className="news-hero-description">
                Get the latest market news, stock updates, and financial insights 
                to make better investment decisions.
            </p>
            </div>
        </section>

        {/* Search & Filter Section */}
        <section className="news-controls">
            <div className="news-controls-container">
            {/* Search Bar */}
            <div className="search-bar">
                <span className="search-icon">🔍</span>
                <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                />
                {searchTerm && (
                <button 
                    className="clear-search"
                    onClick={() => setSearchTerm("")}
                >
                    ✕
                </button>
                )}
            </div>

            {/* Category Filters */}
            <div className="category-filters">
                {categories.map((category) => (
                <button
                    key={category.id}
                    className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                >
                    <span className="category-icon">{category.icon}</span>
                    <span className="category-label">{category.label}</span>
                </button>
                ))}
            </div>

            {/* Refresh Button */}
            <button 
                className="refresh-btn"
                onClick={fetchNews}
                disabled={loading}
            >
                <span className={`refresh-icon ${loading ? 'spinning' : ''}`}>↻</span>
                Refresh
            </button>
            </div>
        </section>

        {/* Articles Section */}
        <section className="news-articles">
            <div className="news-articles-container">
            {loading ? (
                <div className="news-loading">
                <div className="loading-spinner"></div>
                <p>Loading latest news...</p>
                </div>
            ) : error ? (
                <div className="news-error">
                <div className="error-icon">⚠️</div>
                <h3>Failed to Load News</h3>
                <p>{error}</p>
                <button className="retry-btn" onClick={fetchNews}>
                    Try Again
                </button>
                </div>
            ) : filteredArticles.length === 0 ? (
                <div className="news-empty">
                <div className="empty-icon">📭</div>
                <h3>No Articles Found</h3>
                <p>
                    {searchTerm 
                    ? `No results for "${searchTerm}"`
                    : "No news articles available"}
                </p>
                {(searchTerm || selectedCategory !== "all") && (
                    <button 
                    className="clear-filters-btn"
                    onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("all");
                    }}
                    >
                    Clear Filters
                    </button>
                )}
                </div>
            ) : (
                <>
                <div className="articles-header">
                    <h2 className="articles-count">
                    {filteredArticles.length} {filteredArticles.length === 1 ? 'Article' : 'Articles'}
                    {searchTerm && ` matching "${searchTerm}"`}
                    </h2>
                    <div className="sort-dropdown">
                    <select className="sort-select">
                        <option value="recent">Most Recent</option>
                        <option value="popular">Most Popular</option>
                        <option value="relevant">Most Relevant</option>
                    </select>
                    </div>
                </div>

                <div className="news-grid">
                    {filteredArticles.map((article, index) => (
                    <div 
                        key={index} 
                        className="news-grid-item"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <NewsCard article={article} />
                    </div>
                    ))}
                </div>
                </>
            )}
            </div>
        </section>

        {/* CTA Section */}
        {!loading && filteredArticles.length > 0 && (
            <section className="news-cta">
            <div className="news-cta-content">
                <h2>Want More Market Insights?</h2>
                <p>Join our newsletter to get daily market updates and investment tips</p>
                <div className="newsletter-form">
                <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="newsletter-input"
                />
                <button className="newsletter-btn">Subscribe</button>
                </div>
            </div>
            </section>
        )}
        </div>
    );
    };

export default NewsPage;
