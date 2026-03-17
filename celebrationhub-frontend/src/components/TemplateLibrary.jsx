'use client';
import { useState, useEffect } from 'react';
import { mockTemplates } from '@/lib/mockData';
import Image from 'next/image'; 

export default function TemplateLibrary() {
  const [templates, setTemplates] = useState([]);
  const [activeTab, setActiveTab] = useState('birthday');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [defaults, setDefaults] = useState({ birthday: 1, anniversary: 5 });
  const [loading, setLoading] = useState(true);

 
useEffect(() => {
  const loadTemplates = async () => {
    try {
      // For now, use mock data
      setTimeout(() => {
        setTemplates(mockTemplates);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load templates:', error);
      setLoading(false);
    }
  };
   
    loadTemplates();
  }, []);

  const filteredTemplates = templates.filter(t => t.type === activeTab);

  const handleSetDefault = async (templateId) => {
    try {
      // Later: await fetchAPI(`/templates/${templateId}/set-default`, {
      //   method: 'POST',
      //   body: JSON.stringify({ type: activeTab })
      // });
      
      setDefaults({ ...defaults, [activeTab]: templateId });
      alert(`Template set as default for ${activeTab}s`);
    } catch (error) {
      console.error('Failed to set default:', error);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading templates...</div>;
  }

  return (
    <div className="template-library">
      <div className="header">
        <h1>Template Library</h1>
        <p>Choose and customize templates for your celebrations</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'birthday' ? 'active' : ''}`}
          onClick={() => setActiveTab('birthday')}
        >
          🎂 Birthday Templates
        </button>
        <button
          className={`tab ${activeTab === 'anniversary' ? 'active' : ''}`}
          onClick={() => setActiveTab('anniversary')}
        >
          💍 Anniversary Templates
        </button>
      </div>

      {/* Template Grid */}
      <div className="template-grid">
        {filteredTemplates.map(template => (
          <div key={template.id} className="template-card">
            <div className="template-preview" onClick={() => setSelectedTemplate(template)}>
              <Image src={template.previewUrl} alt={template.name} />
              <div className="preview-overlay">
                <button className="preview-btn">Preview</button>
              </div>
            </div>
            <div className="template-info">
              <h3>{template.name}</h3>
              <p>{template.description}</p>
              {defaults[activeTab] === template.id ? (
                <div className="default-badge">✓ Current Default</div>
              ) : (
                <button
                  className="set-default-btn"
                  onClick={() => handleSetDefault(template.id)}
                >
                  Set as Default
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {selectedTemplate && (
        <div className="modal-overlay" onClick={() => setSelectedTemplate(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedTemplate(null)}>×</button>
            <h2>{selectedTemplate.name}</h2>
            <Image src={selectedTemplate.previewUrl} alt={selectedTemplate.name} />
            <p>{selectedTemplate.description}</p>
            <button
              className="modal-action-btn"
              onClick={() => {
                handleSetDefault(selectedTemplate.id);
                setSelectedTemplate(null);
              }}
            >
              Set as Default
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .template-library {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header {
          margin-bottom: 32px;
        }

        h1 {
          font-family: Georgia, serif;
          font-size: 32px;
          margin-bottom: 8px;
        }

        .header p {
          color: #666;
        }

        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 32px;
          border-bottom: 2px solid #f0f0f0;
        }

        .tab {
          background: none;
          border: none;
          padding: 12px 24px;
          font-size: 16px;
          cursor: pointer;
          color: #666;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }

        .tab:hover {
          color: #1a1a1a;
        }

        .tab.active {
          color: #4f46e5;
          border-bottom-color: #4f46e5;
        }

        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        .template-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .template-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .template-preview {
          position: relative;
          cursor: pointer;
          aspect-ratio: 3/2;
          overflow: hidden;
        }

        .template-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .template-preview:hover .preview-overlay {
          opacity: 1;
        }

        .preview-btn {
          background: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .template-info {
          padding: 20px;
        }

        .template-info h3 {
          font-size: 18px;
          margin-bottom: 8px;
        }

        .template-info p {
          font-size: 14px;
          color: #666;
          margin-bottom: 16px;
        }

        .default-badge {
          background: #16a34a;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          display: inline-block;
        }

        .set-default-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .set-default-btn:hover {
          background: #4338ca;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s;
        }

        .modal {
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          animation: slideUp 0.3s;
        }

        .close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 32px;
          cursor: pointer;
          color: #666;
        }

        .modal h2 {
          font-family: Georgia, serif;
          margin-bottom: 16px;
        }

        .modal img {
          width: 100%;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .modal p {
          color: #666;
          margin-bottom: 24px;
        }

        .modal-action-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 12px 32px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          width: 100%;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .template-library {
            padding: 16px;
          }

          .template-grid {
            grid-template-columns: 1fr;
          }

          .modal {
            margin: 16px;
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
}