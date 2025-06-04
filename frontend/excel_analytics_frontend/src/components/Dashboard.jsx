import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';

function Dashboard() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'application/vnd.ms-excel' || 
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        setFiles(prev => [...prev, data]);
      } catch (error) {
        console.error('Error uploading file:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* File Upload Section */}
      <Card className="mb-6 p-4">
        <h2 className="text-2xl font-bold mb-4">Upload Excel File</h2>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".xls,.xlsx"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button as="span" variant="outline">
              Choose File
            </Button>
          </label>
          {loading && <span>Uploading...</span>}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Create New Chart</h3>
              {/* Chart creation form will go here */}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Existing Charts</h3>
              <div className="grid gap-4">
                {selectedFile.charts?.map((chart) => (
                  <Card key={chart._id} className="p-4">
                    <h4>{chart.title}</h4>
                    {/* Chart visualization will go here */}
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default Dashboard;
