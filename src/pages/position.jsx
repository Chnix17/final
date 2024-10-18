import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import Sidebar from './Sidebar';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';

const VehiclePositions = () => {
  const navigate = useNavigate();
  
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: '', name: '' });
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await fetch('http://localhost/coc/gsd/fetchMaster.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ operation: 'fetchPositions' }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        if (data.status === 'success') {
          setPositions(data.data);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error('Error fetching vehicle positions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, []);

  const handleEdit = (id) => {
    const positionToEdit = positions.find((position) => position.position_id === id);
    if (positionToEdit) {
      setFormData({ id: positionToEdit.position_id, name: positionToEdit.position_name });
      setEditMode(true);
      setShowModal(true);
    }
  };

  const handleDelete = (id) => {
    setSelectedPositionId(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch('http://localhost/coc/gsd/delete_master.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ operation: 'deletePosition', position_id: selectedPositionId }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setPositions(positions.filter(position => position.position_id !== selectedPositionId));
        toast.success('Position deleted successfully!');
      } else {
        toast.error(data.message || 'Failed to delete position.');
      }
    } catch (error) {
      console.error('Error deleting position:', error);
      toast.error('Error deleting position.');
    } finally {
      setShowConfirmDelete(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost/coc/gsd/update_master1.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ operation: 'updatePosition', id: formData.id, name: formData.name }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setPositions(positions.map(position => 
          position.position_id === formData.id ? { ...position, position_name: formData.name } : position
        ));
        toast.success('Position updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update position.');
      }
    } catch (error) {
      console.error('Error updating position:', error);
      toast.error('Error updating position.');
    } finally {
      closeModal();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setFormData({ id: '', name: '' });
  };

  if (loading) {
    return <div className="text-center text-xl">Loading...</div>;
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container mx-auto p-6 flex-grow-1">
        <div className="mb-4">
          <Button variant="link" onClick={() => navigate('/Master')}>
            <FaArrowLeft className="mr-2" /> Back to Master
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-center mb-6">Personel Positions Master</h1>
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-green-500 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <tr key={position.position_id} className="border-b hover:bg-gray-100">
                <td className="py-3 px-4">{position.position_name}</td>
                <td className="py-3 px-4">
                  <Button 
                    onClick={() => handleEdit(position.position_id)} 
                    className="bg-blue-500 text-white rounded px-4 py-2 mr-2 hover:bg-blue-600"
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={() => handleDelete(position.position_id)} 
                    className="bg-red-500 text-white rounded px-4 py-2 hover:bg-red-600"
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Modal show={showModal} onHide={closeModal}>
          <Modal.Header closeButton>
            <Modal.Title>{editMode ? 'Edit Position' : 'Position Details'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group controlId="formPositionName">
                <Form.Label>Name:</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>
              Close
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showConfirmDelete} onHide={() => setShowConfirmDelete(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Deletion</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to delete this position?</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>

        <ToastContainer />
      </div>
    </div>
  );
};

export default VehiclePositions;
