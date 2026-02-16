import React from 'react';
import './Charts.css';

const BarChart = ({ data, color = '#22c55e', showRange = false }) => {
  // Calculate max value for scaling
  const maxValue = Math.max(
    ...data.map(item => {
      if (showRange) {
        const rangeMax = (item.min || 0) + (item.band || 0);
        const userValue = item.user || 0;
        return Math.max(rangeMax, userValue);
      }
      return item.amount || item.value || 0;
    }),
    10 // Baseline of 10 instead of 1 for better small-value scaling
  );

  // Calculate bar height as percentage - FIXED to make bars actually grow tall
  const getBarHeight = (value) => {
    if (!value || value === 0) return 0;
    if (maxValue === 0) return 0;
    
    // Calculate percentage (0-100) of the max value
    const percent = (value / maxValue) * 100;
    
    // Return percentage - bars will be this % of the container height
    return percent;
  };

  return (
    <div className="bar-chart-container">
      <div className="bar-chart">
        {data.map((item, index) => {
          const itemValue = item.amount || item.value || 0;
          const userValue = item.user || 0;
          const rangeMin = item.min || 0;
          const rangeBand = item.band || 0;
          const rangeMax = rangeMin + rangeBand;

          return (
            <div key={index} className="bar-group">
              <div className="bar-column">
                {showRange ? (
                  // Range comparison mode
                  <div className="bar-stack">
                    {/* NC Range Bar (background) */}
                    {rangeMax > 0 ? (
                      <div 
                        className="bar range-bar"
                        style={{ 
                          height: `${getBarHeight(rangeMax)}%`
                        }}
                      >
                        {/* Darker band showing the actual range (min to max) */}
                        {rangeBand > 0 ? (
                          <div 
                            className="range-band"
                            style={{
                              height: `${(rangeBand / rangeMax) * 100}%`
                            }}
                          />
                        ) : null}
                      </div>
                    ) : null}
                    
                    {/* User's actual spending */}
                    {userValue > 0 ? (
                      <div 
                        className="bar user-bar"
                        style={{ 
                          height: `${getBarHeight(userValue)}%`,
                          backgroundColor: color
                        }}
                      >
                        <div className="bar-value">${userValue}</div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  // Simple bar mode
                  <>
                    {itemValue > 0 ? (
                      <div 
                        className="bar simple-bar"
                        style={{ 
                          height: `${getBarHeight(itemValue)}%`,
                          backgroundColor: color
                        }}
                      >
                        <div className="bar-value">${itemValue}</div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
              <div className="bar-label">{item.name}</div>
            </div>
          );
        })}
      </div>

      {showRange && (
        <div className="chart-legend horizontal">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: 'rgba(46, 204, 113, 0.2)' }} />
            <span>NC Range</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: color }} />
            <span>Your Spending</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarChart;
