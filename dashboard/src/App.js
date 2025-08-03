import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { 
  Search, 
  SortAsc, 
  SortDesc, 
  Edit, 
  Trash2, 
  ExternalLink,
  Mail,
  User,
  Calendar,
  MessageSquare
} from 'lucide-react';
import './App.css';

function App() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('captured_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnotations, setEditingAnnotations] = useState('');

  // API base URL
  const API_BASE = 'http://localhost:8000';

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/emails`);
      setEmails(response.data);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = (e) => {
    setSortBy(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const filteredAndSortedEmails = emails
    .filter(email => 
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.body.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'captured_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const openEmailModal = (email) => {
    setSelectedEmail(email);
    setEditingAnnotations(email.annotations || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEmail(null);
    setEditingAnnotations('');
  };

  const saveAnnotations = async () => {
    try {
      await axios.put(`${API_BASE}/emails/${selectedEmail.id}`, {
        annotations: editingAnnotations
      });
      
      // Update local state
      setEmails(emails.map(email => 
        email.id === selectedEmail.id 
          ? { ...email, annotations: editingAnnotations }
          : email
      ));
      
      closeModal();
    } catch (error) {
      console.error('Error saving annotations:', error);
      alert('Failed to save annotations');
    }
  };

  const deleteEmail = async (emailId) => {
    if (!window.confirm('Are you sure you want to delete this email?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/emails/${emailId}`);
      setEmails(emails.filter(email => email.id !== emailId));
    } catch (error) {
      console.error('Error deleting email:', error);
      alert('Failed to delete email');
    }
  };

  const openGmailUrl = (url) => {
    window.open(url, '_blank');
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <h3>Loading emails...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>📧 Gmail Email Tracker</h1>
        <p>View and manage your captured emails</p>
      </div>

      {/* Stats */}
      <div className="stats">
        <div className="stat-card">
          <div className="stat-number">{emails.length}</div>
          <div className="stat-label">Total Emails</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {emails.filter(email => email.annotations).length}
          </div>
          <div className="stat-label">With Annotations</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {emails.length > 0 ? formatDate(emails[0].captured_at) : 'N/A'}
          </div>
          <div className="stat-label">Latest Capture</div>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="search-bar">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
          <input
            type="text"
            placeholder="Search emails by subject, sender, or content..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <select value={sortBy} onChange={handleSort} className="sort-select">
          <option value="captured_at">Date Captured</option>
          <option value="subject">Subject</option>
          <option value="sender">Sender</option>
          <option value="timestamp">Email Date</option>
        </select>
        <button onClick={toggleSortOrder} className="btn btn-secondary">
          {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
          {sortOrder === 'asc' ? 'Asc' : 'Desc'}
        </button>
      </div>

      {/* Email List */}
      {filteredAndSortedEmails.length === 0 ? (
        <div className="empty-state">
          <h3>No emails found</h3>
          <p>
            {searchTerm ? 'Try adjusting your search terms' : 'Start capturing emails from Gmail to see them here'}
          </p>
        </div>
      ) : (
        filteredAndSortedEmails.map(email => (
          <div key={email.id} className="email-card">
            <div className="email-header">
              <div className="email-subject">
                <Mail size={16} style={{ marginRight: '8px', color: '#3498db' }} />
                {email.subject}
              </div>
              <div className="email-meta">
                <div className="email-sender">
                  <User size={14} style={{ marginRight: '4px' }} />
                  {email.sender}
                </div>
                <div className="email-timestamp">
                  <Calendar size={14} style={{ marginRight: '4px' }} />
                  {formatDate(email.timestamp)}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#95a5a6' }}>
                  Captured: {formatDate(email.captured_at)}
                </div>
              </div>
            </div>
            
            <div className="email-body">
              <MessageSquare size={14} style={{ marginRight: '4px', color: '#95a5a6' }} />
              {email.body}
            </div>

            {email.annotations && (
              <div style={{ 
                background: '#f8f9fa', 
                padding: '0.75rem', 
                borderRadius: '6px', 
                marginBottom: '1rem',
                borderLeft: '4px solid #3498db'
              }}>
                <strong>Annotations:</strong> {email.annotations}
              </div>
            )}

            <div className="email-actions">
              <button 
                onClick={() => openEmailModal(email)} 
                className="btn btn-primary"
              >
                <Edit size={16} />
                Edit
              </button>
              <button 
                onClick={() => openGmailUrl(email.url)} 
                className="btn btn-secondary"
              >
                <ExternalLink size={16} />
                Open in Gmail
              </button>
              <button 
                onClick={() => deleteEmail(email.id)} 
                className="btn btn-danger"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      {/* Edit Modal */}
      {showModal && selectedEmail && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Email: {selectedEmail.subject}</h2>
              <button onClick={closeModal} className="close-btn">×</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input 
                type="text" 
                value={selectedEmail.subject} 
                className="form-input" 
                readOnly 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Sender</label>
              <input 
                type="text" 
                value={selectedEmail.sender} 
                className="form-input" 
                readOnly 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email Body</label>
              <textarea 
                value={selectedEmail.body} 
                className="form-textarea" 
                readOnly 
                rows={6}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Annotations</label>
              <textarea 
                value={editingAnnotations} 
                onChange={(e) => setEditingAnnotations(e.target.value)}
                className="form-textarea" 
                placeholder="Add your notes, tags, or annotations here..."
                rows={4}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={saveAnnotations} className="btn btn-success">
                Save Annotations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 