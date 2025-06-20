import React, { forwardRef } from 'react'; // Import forwardRef
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const LineChart = forwardRef(({ data, config }, ref) => { // Use forwardRef
  const chartData = {
    labels: data.map(item => item[config.xAxis]),
    datasets: [
      {
        label: config.yAxis,
        data: data.map(item => item[config.yAxis]),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allow chart to fill container better
    layout: { // Add padding around the chart
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${config.yAxis} by ${config.xAxis}`,
      },
    },
  };

  return <Line ref={ref} data={chartData} options={options} />; // Pass ref
});

export default LineChart;
