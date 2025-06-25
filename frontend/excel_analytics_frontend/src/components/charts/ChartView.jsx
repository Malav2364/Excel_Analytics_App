import React from 'react';
import { useCallback } from 'react';
import BarChart from './BarChart';
import LineChart from './LineChart';
import PieChart from './PieChart';
import ChartConfig from './ChartConfig';
import HistogramChart from './HistogramChart';

const ChartView = ({ data, initialConfig, onSave }) => {
  const [config, setConfig] = React.useState(initialConfig || {
    type: 'bar',
    xAxis: Object.keys(data[0] || {})[0],
    yAxis: Object.keys(data[0] || {})[1],
  });

  const handleConfigChange = useCallback((newConfig) => {
    setConfig(newConfig);
  }, []);

  const renderChart = () => {
    switch (config.type) {
      case 'bar':
        return <BarChart data={data} config={config} />;
      case 'line':
        return <LineChart data={data} config={config} />;
      case 'pie':
        return <PieChart data={data} config={config} />;
      case 'histogram':
        return <HistogramChart data={data} config={config} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <ChartConfig
        data={data}
        config={config}
        onConfigChange={handleConfigChange}
      />
      <div className="bg-white p-4 rounded-lg shadow">
        {renderChart()}
      </div>
      {onSave && (
        <button
          onClick={() => onSave(config)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Save Chart Configuration
        </button>
      )}
    </div>
  );
};

export default ChartView;
