import Modal from './Modal';

// 1. Add 'loading' to the interface
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading?: boolean; // <-- Added this optional prop
}

const DeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  loading = false // <-- Default to false
}: DeleteModalProps) => {
  
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: '25px', textAlign: 'center', maxWidth: '400px' }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#b91c1c', fontSize: '1.5rem' }}>
          {title}
        </h2>
        <p style={{ color: '#555', marginBottom: '30px', lineHeight: '1.5' }}>
          {message}
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <button 
            onClick={onClose} 
            disabled={loading}
            style={{
              padding: '10px 24px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              background: '#f9fafb',
              color: '#374151',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            Cancel
          </button>
          
          <button 
            onClick={onConfirm} 
            disabled={loading}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '8px',
              background: '#b91c1c',
              color: 'white',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              minWidth: '100px'
            }}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteModal;