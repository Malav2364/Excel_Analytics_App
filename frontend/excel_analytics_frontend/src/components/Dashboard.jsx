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
import Bar3DChart from './charts/Bar3DChart'; // Import Bar3DChart
import Scatter3DChart from './charts/Scatter3DChart'; // Import Scatter3DChart
import ScatterChart from './charts/ScatterChart'; // Import ScatterChart
import AreaChart from './charts/AreaChart'; // Import AreaChart


function Dashboard() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false); // For file upload
  const [loadingFileDetails, setLoadingFileDetails] = useState(false); // For loading selected file's full data
  const [user, setUser] = useState(null);
  const [charts, setCharts] = useState([]);
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [editingChart, setEditingChart] = useState(null);
  const chartRefs = useRef({}); // To store refs to chart instances

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


  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('File size exceeds 5MB limit. Please choose a smaller file.');
      event.target.value = '';
      return;
    }

    // Check file type
    const isExcel = file.type === 'application/vnd.ms-excel' || 
                    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    
    if (!isExcel) {
      toast.error('Please select an Excel file (.xls or .xlsx)');
      event.target.value = '';
      return;
    }

    const uploadPromise = new Promise((resolve, reject) => {
      const uploadFile = async () => {
        try {
          setLoading(true);
          const formData = new FormData();
        formData.append('file', file);
        
        const token = authService.getAccessToken();
        console.log('Uploading file:', {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified).toISOString()
        });

        const response = await fetch('http://localhost:5000/api/excel/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
          console.error('Server error:', responseData);
          throw new Error(responseData.message || responseData.details || 'Upload failed');
        }
        
        console.log('Upload successful:', responseData);
        
        setFiles(prev => [...prev, responseData]);
        setSelectedFile(responseData); // Set newly uploaded file as selected
        resolve('File uploaded successfully! Ready for analysis.');
        
      } catch (error) {
        console.error('Error uploading file:', {
          error: error.message,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        });
        
        // Create user-friendly error message based on the error type
        const errorMessage = error.message.toLowerCase();
        let userMessage = 'An unexpected error occurred while uploading the file. Please try again.';
        
        if (errorMessage.includes('invalid excel file') || errorMessage.includes('failed to read excel file')) {
          userMessage = 'The file appears to be corrupted or not a valid Excel file. Please check the file and try again.';
        } else if (errorMessage.includes('empty') || errorMessage.includes('no data')) {
          userMessage = 'The Excel file is empty. Please upload a file containing data.';
        } else if (errorMessage.includes('password') || errorMessage.includes('protected')) {
          userMessage = 'Unable to read the Excel file. Please make sure it\'s not password protected and try again.';
        } else if (errorMessage.includes('file upload failed') || errorMessage.includes('file path')) {
          userMessage = 'Failed to upload the file. Please try again. If the problem persists, the file might be corrupted.';
        }
        
        reject(userMessage);
      } finally {
        setLoading(false);
        event.target.value = ''; // Reset file input
      }
    };
    uploadFile(); // Execute the async function
    });

    toast.promise(uploadPromise, {
      loading: 'Uploading file...',
      success: (message) => message,
      error: (error) => error,
    });
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleAddChart = async (config) => {
    try {
      const newChart = await addChart(selectedFile._id, {
        ...config,
        // Ensure name is generated safely, even if xAxis or yAxis are somehow empty
        name: `${config.type} chart of ${config.yAxis || 'N/A'} by ${config.xAxis || 'N/A'}`
      });
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
      const updatedChart = await updateChart(selectedFile._id, chartId, {
        ...config,
        // Ensure name is generated safely
        name: `${config.type} chart of ${config.yAxis || 'N/A'} by ${config.xAxis || 'N/A'}`
      });
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

  return (
    <div className="min-h-screen bg-background">
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

      <div className="container mx-auto p-4">
        {/* File Upload Section */}
        <Card className="mb-6 p-4">
          <h2 className="text-2xl font-bold mb-4 text-green-700 dark:text-green-400">
            Upload Excel File
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".xls,.xlsx"
                onChange={handleFileUpload}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-green-50 file:text-green-700
                  hover:file:bg-green-100
                  dark:file:bg-green-900 dark:file:text-green-400
                  dark:hover:file:bg-green-800"
                id="file-upload"
              />
            </div>
            {loading && (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-green-500 rounded-full border-t-transparent"></div>
                <span className="text-green-600 dark:text-green-400">Uploading your file...</span>
              </div>
            )}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Supported formats: .xls, .xlsx</p>
              <p>Maximum file size: 5MB</p>
            </div>
          </div>
        </Card>

      {/* Recent Files Section */}
      <Card className="mb-6 p-4">
        <h2 className="text-2xl font-bold mb-4">Recent Files</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <Card key={file._id} className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedFile(file)}>
              <h3 className="font-semibold">{file.fileName}</h3>
              <p className="text-sm text-gray-500">
                Uploaded: {new Date(file.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                Size: {(file.fileSize / 1024).toFixed(2)} KB
              </p>
            </Card>
          ))}
        </div>
      </Card>

      {/* Data Visualization Section */}
      {selectedFile && (
        <Card className="p-4">
          <h2 className="text-2xl font-bold mb-4">Data Visualization</h2>
          {loadingFileDetails && (
            <div className="flex items-center justify-center my-4">
              <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent"></div>
              <span className="ml-3 text-green-600 dark:text-green-400">Loading file data and charts...</span>
            </div>
          )}
          {!loadingFileDetails && selectedFile.data && selectedFile.headers && selectedFile.headers.length > 0 && (
            <div className="flex flex-col gap-6"> {/* Changed from grid to flex-col for vertical stacking */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-green-700 dark:text-green-400">Create New Chart</h3> {/* Styled title like Existing Charts */}
                <Button
                  onClick={() => {
                    // Condition already checked by parent div, but good for safety
                    if (selectedFile && selectedFile.data && selectedFile.headers && selectedFile.headers.length > 0) {
                      setEditingChart(null); 
                      setShowChartDialog(true);
                    } else {
                      toast.error("File data is not fully loaded or is invalid. Please wait or re-select the file.");
                    }
                  }}
                  className="w-full mb-4 bg-green-600 hover:bg-green-700 text-white"
                  // Button is effectively enabled if this section is rendered.
                  // disabled={loadingFileDetails || !selectedFile || !selectedFile.data || !selectedFile.headers || selectedFile.headers.length === 0}
                >
                  Create New Chart
                </Button>
                {/* Remove direct rendering of ChartConfig here */}
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
                      <div className="chart-container h-64 w-full mb-3"> {/* Added a container with fixed height */}
                        {chart.type === 'bar' && selectedFile.data && (
                          <BarChart ref={el => chartRefs.current[chart._id] = el} data={selectedFile.data} config={chart} />
                        )}
                        {chart.type === 'line' && selectedFile.data && (
                          <LineChart ref={el => chartRefs.current[chart._id] = el} data={selectedFile.data} config={chart} />
                        )}
                        {chart.type === 'pie' && selectedFile.data && (
                          <PieChart ref={el => chartRefs.current[chart._id] = el} data={selectedFile.data} config={chart} />
                        )}
                        {chart.type === 'bar3d' && selectedFile.data && (
                          <Bar3DChart ref={el => chartRefs.current[chart._id] = el} data={selectedFile.data} config={chart} />
                        )}
                        {chart.type === 'scatter3d' && selectedFile.data && (
                          <Scatter3DChart ref={el => chartRefs.current[chart._id] = el} data={selectedFile.data} config={chart} />
                        )}
                        {chart.type === 'scatter' && selectedFile.data && (
                          <ScatterChart ref={el => chartRefs.current[chart._id] = el} data={selectedFile.data} config={chart} />
                        )}
                        {chart.type === 'area' && selectedFile.data && (
                          <AreaChart ref={el => chartRefs.current[chart._id] = el} data={selectedFile.data} config={chart} />
                        )}
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
      )}

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
    </div>
  );
}

export default Dashboard;
