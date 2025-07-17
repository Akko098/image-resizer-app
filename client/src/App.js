
import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [images, setImages] = useState(null);
  const [widths, setWidths] = useState([{ id: 1, value: '' }]);
  const [error, setError] = useState('');
  const [fileCount, setFileCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    setImages(e.target.files);
    setFileCount(e.target.files.length);
  };

  const handleWidthChange = (index, value) => {
    const newWidths = [...widths];
    newWidths[index].value = value;
    setWidths(newWidths);
  };

  const addWidthInput = () => {
    setWidths([...widths, { id: widths.length + 1, value: '' }]);
  };

  const removeWidthInput = (index) => {
    const newWidths = widths.filter((_, i) => i !== index);
    setWidths(newWidths);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!images || images.length === 0) {
      setError('Please select at least one image.');
      setLoading(false);
      return;
    }

    const filledWidths = widths.filter(w => w.value.trim() !== '').map(w => w.value);
    if (filledWidths.length === 0) {
      setError('Please enter at least one width.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < images.length; i++) {
      formData.append('images', images[i]);
    }
    formData.append('widths', JSON.stringify(filledWidths));

    try {
      const response = await axios.post('http://localhost:3001/api/resize', formData, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'resized-images.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      console.error('An error occurred:', err);
      if (err.response) {
        const reader = new FileReader();
        reader.onload = () => {
            const errorMessage = reader.result;
            setError(`Server Error: ${errorMessage}`);
        };
        reader.readAsText(err.response.data);
      } else if (err.request) {
        setError('Could not connect to the server. Please ensure it is running.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="card">
        <div className="card-header">
          <h1 className="text-center">Image Resizer</h1>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="image" className="form-label">1. Select Images</label>
              <input type="file" className="form-control" id="image" onChange={handleImageChange} accept="image/png, image/jpeg" multiple disabled={loading} />
              {fileCount > 0 && <div className="form-text">{fileCount} files selected.</div>}
            </div>

            <div className="mb-3">
              <label className="form-label">2. Enter Widths (px)</label>
              {widths.map((item, index) => (
                <div key={item.id} className="input-group mb-2">
                  <input
                    type="number"
                    className="form-control"
                    value={item.value}
                    onChange={(e) => handleWidthChange(index, e.target.value)}
                    placeholder="e.g., 800"
                    disabled={loading}
                  />
                  {widths.length > 1 && (
                    <button type="button" className="btn btn-outline-danger" onClick={() => removeWidthInput(index)} disabled={loading}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-outline-primary mt-2" onClick={addWidthInput} disabled={loading}>
                Add another size
              </button>
            </div>

            <div className="d-grid">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    {' '}Resizing...
                  </>
                ) : (
                  '3. Resize and Download ZIP'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
