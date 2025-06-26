import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ThemeToggle } from './ui/theme-toggle';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from './ui/dialog'; // Import Dialog components
import authService from '../services/authService';
import {
  getCharts,
  addChart,
  updateChart,
  deleteChart,
  getFileById, // Added getFileById
} from '../services/api';
import BarChart from './charts/BarChart';
import LineChart from './charts/LineChart';
import PieChart from './charts/PieChart';
import ChartConfig from './charts/ChartConfig';
import ScatterChart from './charts/ScatterChart'; // Import ScatterChart
import AreaChart from './charts/AreaChart'; // Import AreaChart
import HistogramChart from './charts/HistogramChart';

// Helper components for icons
const MenuIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
  
const XIcon = (props) => (
<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
</svg>
);


function Dashboard() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadingFileDetails, setLoadingFileDetails] = useState(false); // For loading selected file's full data
  const [user, setUser] = useState(null);
  const [charts, setCharts] = useState([]);
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [editingChart, setEditingChart] = useState(null);
  const [loading, setLoading] = useState(false); // For file upload loading state
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const chartRefs = useRef({}); // To store refs to chart instances
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for mobile sidebar

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      // Fetch user's files
      const fetchFiles = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/excel/files', {
            headers: {
              'Authorization': `Bearer ${authService.getAccessToken()}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setFiles(data);
          }
        } catch (error) {
          console.error('Error fetching files:', error);
        }
      };
      fetchFiles();
    }
  }, []);

  // New useEffect to load full file details and then charts
  useEffect(() => {
    const effectLogic = async () => {
      if (!selectedFile?._id) {
        setCharts([]);
        setLoadingFileDetails(false);
        chartRefs.current = {}; // Clear refs when no file is selected
        setInsights(null);
        return;
      }

      setLoadingFileDetails(true);
      chartRefs.current = {}; // Clear refs before loading new charts for the selected file

      // Phase 1: Ensure full file details (data and headers) are loaded
      if (!selectedFile.data || !selectedFile.headers || selectedFile.headers.length === 0) {
        try {
          const fullFile = await getFileById(selectedFile._id);
          setSelectedFile(fullFile); // This will re-trigger the effect.
          // Let the re-run process the fullFile.
          return;
        } catch (error) {
          console.error(`Error fetching full file details for ${selectedFile._id}:`, error);
          toast.error('Failed to load complete file data.');
          setCharts([]);
          setLoadingFileDetails(false);
          return;
        }
      }

      // Phase 2: File details are loaded (selectedFile.data and selectedFile.headers are present)
      setCharts([]); // Clear existing charts before fetching new ones
      try {
        const fetchedCharts = await getCharts(selectedFile._id);
        setCharts(fetchedCharts || []);
      } catch (error) {
        console.error(`Error fetching charts for ${selectedFile._id}:`, error);
        toast.error('Failed to load charts for this file.');
        setCharts([]);
      } finally {
        setLoadingFileDetails(false);
      }
    };

    effectLogic();
  }, [selectedFile]); // Dependency: re-run when selectedFile object reference changes.


  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleAddChart = async (config) => {
    try {
      let chartPayload;

      if (config.type === 'histogram') {
        // For histogram, we only need xAxis. The y-axis is frequency.
        chartPayload = {
          name: `Histogram of ${config.xAxis}`,
          type: 'histogram',
          xAxis: config.xAxis,
        };
      } else {
        // For other chart types, we need both xAxis and yAxis.
        chartPayload = {
          name: `${config.type} chart of ${config.yAxis} by ${config.xAxis}`,
          type: config.type,
          xAxis: config.xAxis,
          yAxis: config.yAxis,
        };
      }

      const newChart = await addChart(selectedFile._id, chartPayload);
      setCharts([...charts, newChart]);
      toast.success('Chart added successfully');
      setShowChartDialog(false);
    } catch (error) {
      console.error('Error adding chart:', error);
      toast.error('Failed to add chart');
    }
  };

  const handleUpdateChart = async (chartId, config) => {
    try {
      let chartPayload;

      if (config.type === 'histogram') {
        // For histogram, we only need xAxis. The y-axis is frequency.
        chartPayload = {
          name: `Histogram of ${config.xAxis}`,
          type: 'histogram',
          xAxis: config.xAxis,
        };
      } else {
        // For other chart types, we need both xAxis and yAxis.
        chartPayload = {
          name: `${config.type} chart of ${config.yAxis} by ${config.xAxis}`,
          type: config.type,
          xAxis: config.xAxis,
          yAxis: config.yAxis,
        };
      }

      const updatedChart = await updateChart(selectedFile._id, chartId, chartPayload);
      setCharts(charts.map(chart => 
        chart._id === chartId ? updatedChart : chart
      ));
      toast.success('Chart updated successfully');
    } catch (error) {
      console.error('Error updating chart:', error);
      toast.error('Failed to update chart');
    }
  };

  const handleDeleteChart = async (chartId) => {
    try {
      await deleteChart(selectedFile._id, chartId);
      setCharts(charts.filter(chart => chart._id !== chartId));
      // Clean up ref for the deleted chart
      if (chartRefs.current[chartId]) {
        delete chartRefs.current[chartId];
      }
      toast.success('Chart deleted successfully');
    } catch (error) {
      console.error('Error deleting chart:', error);
      toast.error('Failed to delete chart');
    }
  };

  const handleDownloadChart = async (chartId, chartName) => {
    const chartRefValue = chartRefs.current[chartId];
    if (!chartRefValue) {
      toast.error('Chart reference not found.');
      return;
    }

    let canvasToDownload;

    // Check if it's a Chart.js instance (2D charts)
    if (chartRefValue.canvas) {
      const originalCanvas = chartRefValue.canvas;
      const newCanvas = document.createElement('canvas');
      newCanvas.width = originalCanvas.width;
      newCanvas.height = originalCanvas.height;
      const ctx = newCanvas.getContext('2d');

      // Fill background with white
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);

      // Draw the original chart onto the new canvas
      ctx.drawImage(originalCanvas, 0, 0);
      canvasToDownload = newCanvas;
    } 
    // Check if it's a react-three-fiber canvas (3D charts)
    // The ref for R3F's <Canvas> component directly IS the canvas element
    else if (chartRefValue.tagName === 'CANVAS' && chartRefValue.getContext('webgl')) { 
      canvasToDownload = chartRefValue;
      // The background color is set directly in the <Canvas> component for 3D charts
      // using <color attach="background" args={['#ffffff']} />
      // and gl={{ preserveDrawingBuffer: true }} is also set in the <Canvas>
    } else {
      toast.error('Unsupported chart type for download or chart not ready.');
      return;
    }

    try {
      const image = canvasToDownload.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${chartName || 'chart'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Chart downloaded successfully!');
    } catch (error) {
      console.error('Error downloading chart:', error);
      toast.error('Failed to download chart. The chart might be too complex or from a different origin.');
    }
  };

  // New handler for file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Basic file type and size validation
    if (!['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type)) {
      toast.error('Invalid file type. Please upload an Excel file (.xls, .xlsx).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size exceeds 5MB. Please upload a smaller file.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Upload the file
      const response = await fetch('http://localhost:5000/api/excel/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      setFiles([...files, data]); // Add the new file to the list
      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first.");
      return;
    }

    setLoadingInsights(true);
    setInsights(null);

    try {
      const response = await fetch(`http://localhost:5000/api/ai/${selectedFile._id}/insights`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const data = await response.json();
      setInsights(data);
      toast.success("AI insights generated successfully!");

    } catch (error) {
      console.error("Error generating AI insights:", error);
      toast.error("Failed to generate AI insights.");
    } finally {
      setLoadingInsights(false);
    }
  };

  const renderChartComponent = (chart) => {
    const chartRef = el => (chartRefs.current[chart._id] = el);
    const chartProps = {
      ref: chartRef,
      data: selectedFile.data,
      config: chart,
    };

    switch (chart.type) {
      case 'bar':
        return <BarChart {...chartProps} />;
      case 'line':
        return <LineChart {...chartProps} />;
      case 'pie':
        return <PieChart {...chartProps} />;
      case 'scatter':
        return <ScatterChart {...chartProps} />;
      case 'area':
        return <AreaChart {...chartProps} />;
      case 'histogram':
        return <HistogramChart {...chartProps} />;
      default:
        return <p>Unsupported chart type: {chart.type}</p>;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          success: {
            style: {
              background: 'green',
              color: 'white',
            },
          },
          error: {
            style: {
              background: '#ef4444',
              color: 'white',
            },
            duration: 5000,
          },
        }}
      />
      
      {/* Navigation Bar */}
      <nav className="bg-card shadow-md dark:bg-black dark:border-b dark:border-green-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Hamburger Menu Button - Mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <MenuIcon className="h-6 w-6" />
                <span className="sr-only">Toggle sidebar</span>
              </Button>
              <h1 className="text-xl font-bold text-green-700 dark:text-green-400">
                ExcelAnalytics
              </h1>
              {user && (
                <p className="text-sm text-green-600 dark:text-green-500">
                  Welcome back, <span className="font-medium">{user.username}</span>
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://avatar.vercel.sh/${user?.username}.png`} alt={user?.username} />
                      <AvatarFallback>{user?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm text-green-700 dark:text-green-400">{user?.username}</p>
                      <p className="w-[200px] truncate text-xs text-muted-foreground">
                        {user?.email || 'User'}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem 
                    className="text-red-600 cursor-pointer focus:text-red-600" 
                    onClick={handleLogout}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <div className="flex flex-1 overflow-auto">
        {/* Sidebar */}
        <aside
          className={`w-full max-w-xs flex-shrink-0 bg-card p-4 overflow-y-auto border-r dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static fixed inset-y-0 left-0 z-40 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-green-700 dark:text-green-400">Your Files</h2>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <XIcon className="h-6 w-6" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>
          <div className="mb-4">
            <input
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload-sidebar"
            />
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={loading}
              onClick={() => document.getElementById('file-upload-sidebar').click()}
            >
              {loading ? 'Uploading...' : 'Upload New File'}
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {files.map((file) => (
              <Card
                key={file._id}
                className={`p-3 cursor-pointer transition-all duration-200 ${selectedFile?._id === file._id ? 'border-green-500 border-2 shadow-lg' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                onClick={() => {
                  setSelectedFile(file);
                  if (window.innerWidth < 1024) { // lg breakpoint
                    setIsSidebarOpen(false);
                  }
                }}
              >
                <h3 className="font-semibold truncate" title={file.fileName}>{file.fileName}</h3>
                <p className="text-sm text-gray-500">
                  Size: {(file.fileSize / 1024).toFixed(2)} KB
                </p>
              </Card>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {selectedFile ? (
            <div>
              <Card className="p-4">
                <h2 className="text-2xl font-bold mb-4">Data Visualization for {selectedFile.fileName}</h2>
                {loadingFileDetails && (
                  <div className="flex items-center justify-center my-4">
                    <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent"></div>
                    <span className="ml-3 text-green-600 dark:text-green-400">Loading file data and charts...</span>
                  </div>
                )}
                {!loadingFileDetails && selectedFile.data && selectedFile.headers && selectedFile.headers.length > 0 && (
                  <div className="flex flex-col gap-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-green-700 dark:text-green-400">Create New Chart</h3>
                      <Button
                        onClick={() => {
                          if (selectedFile && selectedFile.data && selectedFile.headers && selectedFile.headers.length > 0) {
                            setEditingChart(null); 
                            setShowChartDialog(true);
                          } else {
                            toast.error("File data is not fully loaded or is invalid. Please wait or re-select the file.");
                          }
                        }}
                        className="w-full mb-4 bg-green-600 hover:bg-green-700 text-white"
                      >
                        Create New Chart
                      </Button>
                    </div>

                    {/* AI Insights Section */}
                    <div className="mt-6">
                      <h3 className="text-xl font-semibold mb-4 text-green-700 dark:text-green-400">AI-Powered Insights</h3>
                      <Button
                        onClick={handleGenerateInsights}
                        disabled={loadingInsights || !selectedFile?.data}
                        className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {loadingInsights ? 'Generating...' : 'Generate AI Insights'}
                      </Button>
                      {loadingInsights && (
                        <div className="flex items-center justify-center my-4">
                          <div className="animate-spin h-6 w-6 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                          <span className="ml-3 text-blue-600 dark:text-blue-400">Analyzing data...</span>
                        </div>
                      )}
                      {insights && (
                        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-lg">Summary</h4>
                              <p className="text-gray-700 dark:text-gray-300">{insights.summary}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">Key Insight</h4>
                              <p className="text-gray-700 dark:text-gray-300">{insights.insight}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">Chart Suggestion</h4>
                              <p className="text-gray-700 dark:text-gray-300">{insights.chartSuggestion}</p>
                            </div>
                            {insights.fieldSuggestions && insights.fieldSuggestions.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-lg">Field Suggestions</h4>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {insights.fieldSuggestions.map((field, index) => (
                                    <span key={index} className="bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-md text-sm font-mono">
                                      {field}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-green-700 dark:text-green-400">Existing Charts</h3>
                      {charts.length === 0 && !loadingFileDetails && (
                        <p className="text-gray-500 dark:text-gray-400">No charts created for this file yet. Click "Create New Chart" to get started!</p>
                      )}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {charts.map((chart) => (
                          <Card key={chart._id} className="p-4 shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out dark:bg-gray-800">
                            <h4 className="text-lg font-semibold mb-3 text-green-600 dark:text-green-300 truncate" title={chart.name}>{chart.name}</h4>
                            <div className="chart-container h-64 w-full mb-3">
                              {renderChartComponent(chart)}
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setShowChartDialog(true);
                                  setEditingChart(chart);
                                }}
                                className="text-green-600 hover:text-green-700"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadChart(chart._id, chart.name)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                Download
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteChart(chart._id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {!loadingFileDetails && (!selectedFile.data || !selectedFile.headers || selectedFile.headers.length === 0) && (
                  <div className="text-center py-4">
                    <p className="text-gray-600 dark:text-gray-400">File data or headers are missing or empty. Cannot display visualizations.</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Try re-selecting the file or uploading a valid Excel file.</p>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            // Placeholder when no file is selected
            <div className="flex items-center justify-center h-full">
              <Card className="w-full h-full p-4 flex items-center justify-center bg-transparent border-2 border-dashed">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Select a file to get started</h3>
                  <p className="text-gray-500 mt-2">Your charts and AI insights will appear here.</p>
                  <Button
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                    disabled={loading}
                    onClick={() => document.getElementById('file-upload-sidebar').click()}
                  >
                    {loading ? 'Uploading...' : 'Upload File'}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Dialog for Chart Configuration */}
      {selectedFile && selectedFile.data && selectedFile.headers && selectedFile.headers.length > 0 && (
        <Dialog open={showChartDialog} onOpenChange={(isOpen) => {
          setShowChartDialog(isOpen);
          if (!isOpen) {
            setEditingChart(null); // Reset editingChart when dialog closes
          }
        }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingChart ? 'Edit Chart' : 'Create New Chart'}</DialogTitle>
              <DialogDescription>
                {editingChart ? 'Modify the configuration of your chart.' : 'Configure your new chart based on the selected file data.'}
              </DialogDescription>
            </DialogHeader>
            <ChartConfig
              key={editingChart ? editingChart._id : 'new-chart-form'}
              data={selectedFile.data}
              columns={selectedFile.headers}
              config={editingChart || {
                type: 'bar',
                xAxis: selectedFile.headers[0],
                yAxis: selectedFile.headers.length > 1 ? selectedFile.headers[1] : selectedFile.headers[0],
                name: '',
              }}
              onCancel={() => {
                setShowChartDialog(false);
                setEditingChart(null);
              }}
              onConfigChange={(config) => {
                if (editingChart) {
                  handleUpdateChart(editingChart._id, config);
                } else {
                  handleAddChart(config);
                }
                setShowChartDialog(false);
                setEditingChart(null);
              }}
            />
            {/* DialogFooter and DialogClose can be added here if ChartConfig doesn't handle its own close/submit actions effectively within the dialog */}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default Dashboard;
