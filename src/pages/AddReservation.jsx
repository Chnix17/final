import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Row, Col, Modal } from 'react-bootstrap';
import Sidebar from './Sidebar';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddReservation = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    reservationName: '',
    eventTitle: '',
    description: '',
    venue: '',
    startDate: '',
    endDate: '',
    selectedUserId: '',
  });
  
  // Loading and selection states
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState([]);
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [equipment, setEquipment] = useState([]);
  
  // Selected items
  const [selectedModels, setSelectedModels] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState({});
  
  // Modal visibility states
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchVenues(), fetchUsers(), fetchVehicles(), fetchEquipment()]);
      } catch (error) {
        toast.error("An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchVenues = async () => {
    try {
      const response = await axios.post("http://localhost/coc/gsd/fetch2.php", new URLSearchParams({ operation: "fetchVenue" }));
      if (response.data.status === 'success') {
        setVenues(response.data.data);
      } else {
        toast.error("Error fetching venues: " + response.data.message);
      }
    } catch {
      toast.error("An error occurred while fetching venues.");
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.post("http://localhost/coc/gsd/fetch2.php", new URLSearchParams({ operation: "fetchUsers" }));
      if (response.data.status === 'success') {
        setUsers(response.data.data);
      } else {
        toast.error("Error fetching users: " + response.data.message);
      }
    } catch {
      toast.error("An error occurred while fetching users.");
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.post("http://localhost/coc/gsd/fetch2.php", new URLSearchParams({ operation: "fetchVehicles" }));
      if (response.data.status === 'success') {
        setVehicles(response.data.data);
      } else {
        toast.error("Error fetching vehicles: " + response.data.message);
      }
    } catch {
      toast.error("An error occurred while fetching vehicles.");
    }
  };

  const fetchEquipment = async () => {
    try {
      const response = await axios.post("http://localhost/coc/gsd/fetch2.php", new URLSearchParams({ operation: "fetchEquipments" }));
      if (response.data.status === 'success') {
        setEquipment(response.data.data);
      } else {
        toast.error("Error fetching equipment: " + response.data.message);
      }
    } catch {
      toast.error("An error occurred while fetching equipment.");
    }
  };

  const handleAddReservation = async (e) => {
    e.preventDefault();
  
    // Validate required fields
    const missingFields = [];
    const requiredFields = [
      'reservationName',
      'eventTitle',
      'venue',
      'selectedUserId',
      'startDate',
      'endDate'
    ];
  
    requiredFields.forEach(field => {
      if (!formData[field]) {
        missingFields.push(field);
      }
    });
  
    if (missingFields.length > 0) {
      toast.error(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }
  
    setLoading(true);
  
    // Construct the payload
    const payload = {
      operation: 'completeReservation', // Change this to match your backend
      reservation: {
        reservation_name: formData.reservationName,
        reservation_event_title: formData.eventTitle,
        reservation_description: formData.description,
        reservation_start_date: `${formData.startDate} ${new Date().toLocaleTimeString()}`,
        reservation_end_date: `${formData.endDate} ${new Date().toLocaleTimeString()}`,
        reservations_users_id: formData.selectedUserId,
      },
      vehicles: selectedModels.map(vehicleId => ({ vehicle_id: vehicleId })),
      venues: [{ venue_id: formData.venue }],
      equipments: Object.entries(selectedEquipment).map(([equipId, quantity]) => ({
        equip_id: parseInt(equipId),
        quantity: quantity,
      })),
    };
  
    try {
      const response = await axios.post('http://localhost/coc/gsd/insertbyadmin.php', payload);
  
      console.log("API Response:", response.data);
  
      if (response.data.status === 'success') {
        toast.success("Reservation successfully added!");
        resetForm();
        navigate('/viewReservation');
      } else {
        toast.error(response.data.message || "An error occurred. Please try again.");
      }
    } catch (error) {
      toast.error("Error adding reservation: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
  

  const resetForm = () => {
    setFormData({
      reservationName: '',
      eventTitle: '',
      description: '',
      venue: '',
      startDate: '',
      endDate: '',
      selectedUserId: '',
    });
    setSelectedModels([]);
    setSelectedEquipment({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (vehicleId) => {
    setSelectedModels(prevSelected => 
      prevSelected.includes(vehicleId)
        ? prevSelected.filter(id => id !== vehicleId)
        : [...prevSelected, vehicleId]
    );
  };

  const handleEquipmentCheckboxChange = (equipmentId) => {
    setSelectedEquipment(prev => {
      const updated = { ...prev };
      if (updated[equipmentId]) {
        delete updated[equipmentId]; // Remove equipment if already selected
      } else {
        updated[equipmentId] = 1; // Default quantity of 1
      }
      return updated;
    });
  };

  const handleEquipmentQuantityChange = (equipmentId, quantity) => {
    setSelectedEquipment(prev => ({
      ...prev,
      [equipmentId]: quantity ? parseInt(quantity) : 1,
    }));
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-grow p-5">
        <h2 className="text-2xl font-bold mb-4">Add Reservation</h2>
        <Form onSubmit={handleAddReservation}>
          <Form.Group controlId="formReservationName">
            <Form.Label>Reservation Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter reservation name"
              name="reservationName"
              value={formData.reservationName}
              onChange={handleInputChange}
              required
            />
          </Form.Group>
          <Form.Group controlId="formEventTitle">
            <Form.Label>Event Title</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter event title"
              name="eventTitle"
              value={formData.eventTitle}
              onChange={handleInputChange}
              required
            />
          </Form.Group>
          <Form.Group controlId="formDescription">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group controlId="formVenue">
            <Form.Label>Venue</Form.Label>
            <Form.Control
              as="select"
              name="venue"
              value={formData.venue}
              onChange={handleInputChange}
              required
            >
              <option value="">Select venue</option>
              {venues.map(venue => (
                <option key={venue.ven_id} value={venue.ven_id}>
                  {venue.ven_name}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
          <Form.Group controlId="formUser">
            <Form.Label>Select User</Form.Label>
            <Form.Control
              as="select"
              name="selectedUserId"
              value={formData.selectedUserId}
              onChange={handleInputChange}
              required
            >
              <option value="">Select user</option>
              {users.map(user => (
                <option key={user.users_id} value={user.users_id}>
                  {user.users_name}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
          <Form.Group controlId="formStartDate">
            <Form.Label>Start Date</Form.Label>
            <Form.Control
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              required
            />
          </Form.Group>
          <Form.Group controlId="formEndDate">
            <Form.Label>End Date</Form.Label>
            <Form.Control
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              required
            />
          </Form.Group>

          <div className="mt-3">
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : 'Add Reservation'}
            </Button>
            <Button variant="secondary" className="ms-2" onClick={() => setShowAddVehicleModal(true)}>
              Select Vehicles
            </Button>
            <Button variant="secondary" className="ms-2" onClick={() => setShowAddEquipmentModal(true)}>
              Select Equipment
            </Button>
          </div>
        </Form>
      </div>

      {/* Select Vehicle Modal */}
      <Modal show={showAddVehicleModal} onHide={() => setShowAddVehicleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Select Vehicles</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h4>Select Vehicles</h4>
          <Row className="g-3">
            {vehicles.map(vehicle => (
              <Col key={vehicle.vehicle_id} xs={6} md={4}>
                <Card>
                  <Card.Body>
                    <Card.Title>Vehicle ID: {vehicle.vehicle_id}</Card.Title>
                    <Card.Text>
                      <strong>Make:</strong> {vehicle.vehicle_make_name}<br />
                      <strong>Category:</strong> {vehicle.vehicle_category_name}<br />
                      <strong>License:</strong> {vehicle.vehicle_license}
                    </Card.Text>
                    <Form.Check
                      type="checkbox"
                      label="Select"
                      checked={selectedModels.includes(vehicle.vehicle_id)}
                      onChange={() => handleCheckboxChange(vehicle.vehicle_id)}
                    />
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddVehicleModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => setShowAddVehicleModal(false)}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showAddEquipmentModal} onHide={() => setShowAddEquipmentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Select Equipment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h4>Select Equipment</h4>
          <Row className="g-3">
            {equipment.map(item => (
              <Col key={item.equip_id} xs={6} md={4}>
                <Card>
                  <Card.Body>
                    <Card.Title>Equipment ID: {item.equip_id}</Card.Title>
                    <Card.Text>
                      <strong>Name:</strong> {item.equip_name}<br />
                      <strong>Category:</strong> {item.equipment_category_name}
                    </Card.Text>
                    <Form.Check
                      type="checkbox"
                      label="Select"
                      checked={selectedEquipment[item.equip_id] !== undefined}
                      onChange={() => handleEquipmentCheckboxChange(item.equip_id)}
                    />
                    {selectedEquipment[item.equip_id] !== undefined && (
                      <Form.Group controlId={`formEquipmentQuantity${item.equip_id}`} className="mt-2">
                        <Form.Label>Quantity</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          value={selectedEquipment[item.equip_id] || ''}
                          onChange={(e) => handleEquipmentQuantityChange(item.equip_id, e.target.value)}
                        />
                      </Form.Group>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddEquipmentModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => setShowAddEquipmentModal(false)}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default AddReservation;