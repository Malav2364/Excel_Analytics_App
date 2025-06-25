import React, { forwardRef } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const HistogramChart = forwardRef(({ data, config }, ref) => {
  const { xAxis } = config;

  // 1. Extract numerical data and filter out non-numeric values
  const numericData = data.map(item => parseFloat(item[xAxis])).filter(val => !isNaN(val));

  if (numericData.length === 0) {
    return <p>The selected column '{xAxis}' contains no valid numerical data for a histogram.</p>;
  }

  // 2. Create bins for the histogram
  const min = Math.min(...numericData);
  const max = Math.max(...numericData);
  const binCount = 10; // A reasonable default
  const binSize = (max - min) / binCount;

  const bins = Array.from({ length: binCount }, (_, i) => {
    const binMin = min + i * binSize;
    const binMax = min + (i + 1) * binSize;
    return {
      label: `${binMin.toFixed(1)} - ${binMax.toFixed(1)}`,
      count: 0,
      min: binMin,
      max: binMax,
    };
  });
  // Ensure the last bin captures the max value perfectly
  bins[binCount - 1].max = max;

  // 3. Populate bins with data
  numericData.forEach(value => {
    // Find the correct bin for the value
    let binIndex = Math.floor((value - min) / binSize);
    // For the max value, it should go into the last bin
    if (value === max) {
      binIndex = binCount - 1;
    }
    if (bins[binIndex]) {
      bins[binIndex].count++;
    }
  });

  // 4. Prepare data for Chart.js
  const chartData = {
    labels: bins.map(bin => bin.label),
    datasets: [
      {
        label: `Frequency of ${xAxis}`,
        data: bins.map(bin => bin.count),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        barPercentage: 1.0,
        categoryPercentage: 1.0,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: `Histogram of ${xAxis}` },
    },
    scales: {
      x: {
        title: { display: true, text: 'Value Bins' },
      },
      y: {
        title: { display: true, text: 'Frequency' },
        beginAtZero: true,
      },
    },
  };

  return <Bar ref={ref} data={chartData} options={options} />;
});

export default HistogramChart;
