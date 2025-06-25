import React, { useState, useEffect, useMemo } from 'react';
import { Listbox } from '@headlessui/react';
import { toast } from 'react-toastify';

const chartTypes = ['bar', 'line', 'pie', 'scatter', 'area', 'histogram'];

const ChartConfig = ({ data, config: initialConfig, onConfigChange, onCancel }) => {
  const [currentConfig, setCurrentConfig] = useState(() => {
    const baseConfig = initialConfig && typeof initialConfig === 'object' ? initialConfig : {};
    return {
      type: 'bar',
      xAxis: '',
      yAxis: '',
      name: '',
      ...baseConfig,
    };
  });

  // Effect to synchronize with initialConfig prop changes
  useEffect(() => {
    setCurrentConfig(prev => {
      const baseConfig = initialConfig && typeof initialConfig === 'object' ? initialConfig : {};
      // Merge, ensuring new initialConfig values overwrite if they exist, otherwise keep previous.
      // This also re-asserts defaults if initialConfig is minimal (e.g., for a new chart).
      const newMergedConfig = {
        type: 'bar', // Default
        xAxis: '',   // Default
        yAxis: '',   // Default
        name: '',    // Default
        ...prev,     // Keep previous state for fields not explicitly in baseConfig or if baseConfig is empty
        ...baseConfig, // Apply new initialConfig, potentially overriding defaults or prev
      };
      // Ensure type is one of the valid chartTypes
      if (!chartTypes.includes(newMergedConfig.type)) {
        newMergedConfig.type = 'bar';
      }
      return newMergedConfig;
    });
  }, [initialConfig]);

  const columns = useMemo(() => {
    return data && data.length > 0 && data[0] && typeof data[0] === 'object'
      ? Object.keys(data[0])
      : [];
  }, [data]);

  const numericColumns = useMemo(() => {
    if (!data || data.length === 0 || columns.length === 0) {
      return [];
    }
    // A column is considered numeric if all its non-empty/null values in a sample are numbers.
    const sample = data.slice(0, 10); // Check up to 10 rows
    return columns.filter(col =>
      sample.every(row => {
        const value = row[col];
        return value === '' || value === null || value === undefined || !isNaN(parseFloat(value));
      })
    );
  }, [data, columns]);

  // Effect to set default axes based on columns or ensure they are valid when columns or initialConfig changes
  useEffect(() => {
    if (columns.length > 0) {
      setCurrentConfig(prevConfig => {
        let newXAxis = prevConfig.xAxis;
        let newYAxis = prevConfig.yAxis;
        let newType = prevConfig.type || 'bar'; // Should be set by init/sync effect
        let configActuallyChanged = false;

        // Default or validate xAxis
        if (!newXAxis || !columns.includes(newXAxis)) {
          newXAxis = columns[0];
          configActuallyChanged = true;
        }

        // Default or validate yAxis, try to make it different from xAxis if possible
        if (!newYAxis || !columns.includes(newYAxis) || (newXAxis === newYAxis && columns.length > 1)) {
          if (columns.length > 1) {
            // Try to find a column different from newXAxis
            const differentColumn = columns.find(col => col !== newXAxis);
            newYAxis = differentColumn || columns[1]; // Fallback to columns[1] if all are same as newXAxis (unlikely) or if find returns undefined
          } else {
            newYAxis = columns[0]; // Only one column available
          }
          configActuallyChanged = true;
        }
        
        // Ensure type is valid
        if (!chartTypes.includes(newType)) {
            newType = 'bar';
            configActuallyChanged = true;
        }


        if (configActuallyChanged) {
          // Check if the derived values are actually different from what's already in prevConfig
          // This is to prevent unnecessary state updates if the logic re-confirms existing values.
          if (prevConfig.xAxis !== newXAxis || prevConfig.yAxis !== newYAxis || prevConfig.type !== newType) {
            return { ...prevConfig, xAxis: newXAxis, yAxis: newYAxis, type: newType };
          }
        }
        return prevConfig; // No change needed or change was not material
      });
    } else {
      // No columns, clear axes if they are set
      setCurrentConfig(prevConfig => {
        if (prevConfig.xAxis !== undefined || prevConfig.yAxis !== undefined) {
          // Only return new object if a change is made
          if (prevConfig.xAxis !== undefined || prevConfig.yAxis !== undefined) {
             return { ...prevConfig, xAxis: undefined, yAxis: undefined };
          }
        }
        return prevConfig;
      });
    }
  // This effect runs when columns array changes (new data) or when initialConfig changes (new chart context).
  // The internal logic uses prevConfig from functional update, so it's always up-to-date.
  }, [columns, initialConfig]);

  const handleChange = (field, value) => {
    setCurrentConfig(prevConfig => ({ ...prevConfig, [field]: value }));
  };

  const handleSave = () => {
    const { type, xAxis, yAxis } = currentConfig;
    let configToSave = { ...currentConfig };

    // Ensure a name exists, generate if empty
    if (!configToSave.name || configToSave.name.trim() === '') {
      if (type === 'histogram') {
        configToSave.name = `Histogram of ${xAxis}` + (yAxis ? ` by ${yAxis}` : '');
      } else {
        configToSave.name = `${type} chart of ${yAxis || 'N/A'} by ${xAxis || 'N/A'}`;
      }
    }

    // Validation
    if (!xAxis || !columns.includes(xAxis)) {
      toast.error("Please select a valid X axis.");
      return;
    }

    if (type === 'histogram' && !numericColumns.includes(xAxis)) {
      toast.error("Histogram requires a numeric column for the X axis.");
      return;
    }

    if (type === 'histogram' && yAxis && !numericColumns.includes(yAxis)) {
      toast.error("For a 2-parameter histogram, the Y axis must also be a numeric column.");
      return;
    }

    if (type !== 'histogram' && (!yAxis || !columns.includes(yAxis))) {
      toast.error("Please select a valid Y axis.");
      return;
    }

    // Clean up payload for histogram if yAxis is not selected
    if (type === 'histogram' && !yAxis) {
      delete configToSave.yAxis; // Ensure yAxis is not sent for a 1-parameter histogram
    }

    onConfigChange(configToSave);
  };

  const isNewChart = !(initialConfig && initialConfig._id);

  return (
    <div className="p-4 bg-card rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        {isNewChart ? 'Create New Chart' : 'Edit Chart'}
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground">Chart Type</label>
          <Listbox value={currentConfig.type || 'bar'} onChange={(value) => handleChange('type', value)}>
            <div className="relative mt-1">
              <Listbox.Button className="relative w-full py-2 pl-3 pr-10 text-left bg-background border border-input rounded-md shadow-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm">
                <span className="block truncate">{currentConfig.type || 'Select type'}</span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </Listbox.Button>
              <Listbox.Options className="absolute z-10 w-full py-1 mt-1 overflow-auto text-base bg-background border border-input rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {chartTypes.map((type) => (
                  <Listbox.Option
                    key={type}
                    value={type}
                    className={({ active }) =>
                      `${active ? 'text-primary-foreground bg-primary' : 'text-foreground'}
                      cursor-default select-none relative py-2 pl-10 pr-4`
                    }
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                          {type}
                        </span>
                        {selected ? (
                          <span className={`${active ? 'text-primary-foreground' : 'text-primary'} absolute inset-y-0 left-0 flex items-center pl-3`}>
                            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground">X Axis</label>
          {currentConfig.type === 'histogram' && numericColumns.length === 0 && (
            <p className="text-sm text-red-500 mt-1">No numeric columns found. Please select another chart type.</p>
          )}
          <Listbox value={currentConfig.xAxis || ''} onChange={(value) => handleChange('xAxis', value)} disabled={columns.length === 0}>
             <div className="relative mt-1">
              <Listbox.Button className="relative w-full py-2 pl-3 pr-10 text-left bg-background border border-input rounded-md shadow-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm disabled:opacity-50">
                <span className="block truncate">{currentConfig.xAxis || (columns.length === 0 ? 'No data columns' : 'Select X axis')}</span>
                 <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </span>
              </Listbox.Button>
              <Listbox.Options className="absolute z-10 w-full py-1 mt-1 overflow-auto text-base bg-background border border-input rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {(currentConfig.type === 'histogram' ? numericColumns : columns).map((column) => (
                  <Listbox.Option key={column} value={column} className={({ active }) => `${active ? 'text-primary-foreground bg-primary' : 'text-foreground'} cursor-default select-none relative py-2 pl-10 pr-4`}>
                    {({ selected, active }) => (
                      <>
                        <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>{column}</span>
                        {selected ? (<span className={`${active ? 'text-primary-foreground' : 'text-primary'} absolute inset-y-0 left-0 flex items-center pl-3`}><svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></span>) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        {/* The Y-axis is now always visible, but optional for histograms */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground">
            Y Axis {currentConfig.type === 'histogram' && <span className="text-xs text-gray-500">(Optional)</span>}
          </label>
          <Listbox value={currentConfig.yAxis || ''} onChange={(value) => handleChange('yAxis', value)} disabled={columns.length === 0}>
            <div className="relative mt-1">
              <Listbox.Button className="relative w-full py-2 pl-3 pr-10 text-left bg-background border border-input rounded-md shadow-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm disabled:opacity-50">
                <span className="block truncate">{currentConfig.yAxis || (columns.length === 0 ? 'No data columns' : 'Select Y axis')}</span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </span>
              </Listbox.Button>
              <Listbox.Options className="absolute z-10 w-full py-1 mt-1 overflow-auto text-base bg-background border border-input rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {columns.map((column) => (
                  <Listbox.Option key={column} value={column} className={({ active }) => `${active ? 'text-primary-foreground bg-primary' : 'text-foreground'} cursor-default select-none relative py-2 pl-10 pr-4`}>
                    {({ selected, active }) => (
                      <>
                        <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>{column}</span>
                        {selected ? (<span className={`${active ? 'text-primary-foreground' : 'text-primary'} absolute inset-y-0 left-0 flex items-center pl-3`}><svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></span>) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        {/* Removed the Z-axis selector for old 3D charts */}
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium rounded-md text-foreground bg-muted hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={(() => {
            const { type, xAxis, yAxis } = currentConfig;
            if (columns.length === 0 || !xAxis || !columns.includes(xAxis)) {
              return true;
            }
            if (type === 'histogram') {
              if (!numericColumns.includes(xAxis)) {
                return true;
              }
              // If yAxis is selected for a histogram, it must be numeric
              if (yAxis && !numericColumns.includes(yAxis)) {
                return true;
              }
            } else {
              // For all other chart types, yAxis is required
              if (!yAxis || !columns.includes(yAxis)) {
                return true;
              }
            }
            return false;
          })()}
          className="px-4 py-2 text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
        >
          {isNewChart ? 'Create Chart' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default ChartConfig;
