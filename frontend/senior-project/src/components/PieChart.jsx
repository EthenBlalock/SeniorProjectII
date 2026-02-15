import React, { useRef, useEffect } from 'react';
import './Charts.css';

const PieChart = ({ data, colors, size = 220 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.35;
    const innerRadius = size * 0.20;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Calculate total
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
      // Draw empty state
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
      return;
    }

    let currentAngle = -Math.PI / 2; // Start at top

    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      
      // Draw slice
      ctx.fillStyle = colors[index % colors.length];
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fill();

      // Add subtle stroke
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      currentAngle += sliceAngle;
    });

    // Draw center circle for donut effect
    ctx.fillStyle = '#1a1d23';
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fill();

  }, [data, colors, size]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="custom-chart-container">
      <div className="chart-canvas-wrapper">
        <canvas 
          ref={canvasRef} 
          width={size} 
          height={size}
          className="pie-canvas"
        />
        {total > 0 && (
          <div className="chart-center-text">
            <div className="chart-total">${total}</div>
            <div className="chart-label">Total</div>
          </div>
        )}
      </div>
      
      <div className="chart-legend">
        {data.map((item, index) => (
          <div key={item.name} className="legend-item">
            <div 
              className="legend-color" 
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <div className="legend-text">
              <span className="legend-name">{item.name}</span>
              <span className="legend-value">${item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieChart;
