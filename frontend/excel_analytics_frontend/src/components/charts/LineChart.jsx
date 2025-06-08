import React from 'react';
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

const LineChart = ({ data, config }) => {
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

  return <Line data={chartData} options={options} />;
};

export default LineChart;
