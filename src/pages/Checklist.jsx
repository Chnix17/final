import React, { useState, useEffect } from 'react';
import { Tabs, Table, Button, Card, Space, Typography, Modal, Select, Input, List, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import Sidebar from './Sidebar';

function Checklist() {
  const [currentTab, setCurrentTab] = useState('1');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [resourceType, setResourceType] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [resources, setResources] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [venueData, setVenueData] = useState([]);
  const [equipmentData, setEquipmentData] = useState([]);
  const [vehicleData, setVehicleData] = useState([]);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewChecklistItems, setViewChecklistItems] = useState([]);

  useEffect(() => {
    const fetchChecklists = async () => {
      try {
        const response = await fetch('http://localhost/coc/gsd/fetch2.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ operation: 'fetchChecklist' })
        });
        const result = await response.json();
        if (result.status === 'success') {
          // Transform data for venues
          const venueList = Object.values(result.data.venues || {}).map(item => ({
            key: `v${item.id}`,
            id: item.id, // Use id from API response
            name: item.name,
            checklistCount: item.count
          }));
          setVenueData(venueList);

          // Transform data for equipment
          const equipmentList = Object.values(result.data.equipment || {}).map(item => ({
            key: `e${item.id}`,
            id: item.id, // Use id from API response
            name: item.name,
            checklistCount: item.count
          }));
          setEquipmentData(equipmentList);

          // Transform data for vehicles
          const vehicleList = Object.values(result.data.vehicles || {}).map(item => ({
            key: `vh${item.id}`,
            id: item.id, // Use id from API response
            name: item.name,
            checklistCount: item.count
          }));
          setVehicleData(vehicleList);
        }
      } catch (error) {
        console.error('Error fetching checklists:', error);
        message.error('Failed to fetch checklists');
      }
    };

    fetchChecklists();
  }, []);

  const fetchChecklistById = async (type, id) => {
    try {
      console.log('Sending request with:', { type, id }); // Log request parameters
      
      const response = await fetch('http://localhost/coc/gsd/fetch2.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          operation: 'fetchChecklistById',
          type,
          id
        })
      });
      
      const result = await response.json();
      console.log('Response received:', result); // Log full response

      if (result.status === 'success') {
        console.log('Checklist items:', result.data); // Log checklist items
        setViewChecklistItems(result.data.map(item => item.checklist_name));
        setIsViewModalVisible(true);
      } else {
        console.error('Error response:', result); // Log error response
        message.error('Failed to fetch checklist items');
      }
    } catch (error) {
      console.error('Error details:', error); // Log detailed error
      message.error('Failed to fetch checklist items');
    }
  };

  const columns = [
    {
      title: 'Name of Resource',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'No. Checklist',
      dataIndex: 'checklistCount',
      key: 'checklistCount',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small" 
            onClick={() => fetchChecklistById(
              currentTab === '1' ? 'venue' : 
              currentTab === '2' ? 'equipment' : 
              'vehicle',
              record.id
            )}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  const fetchResources = async (type) => {
    try {
      const response = await fetch('http://localhost/coc/gsd/fetch2.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ operation: 'fetchAllResources', type })
      });
      const result = await response.json();
      if (result.status === 'success') {
        switch (type) {
          case 'venue':
            setResources(result.data.venues.map(v => ({ 
              value: v.ven_id,
              label: v.ven_name 
            })));
            break;
          case 'vehicle':
            setResources(result.data.vehicles.map(v => ({ 
              value: v.vehicle_id, 
              label: `${v.vehicle_model_title} (${v.vehicle_registration})` 
            })));
            break;
          case 'equipment':
            setResources(result.data.equipment.map(e => ({ 
              value: e.equip_id, 
              label: e.equip_name 
            })));
            break;
        }
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const handleTypeChange = (value) => {
    setResourceType(value);
    setSelectedResource(null);
    fetchResources(value);
  };

  const handleAddItem = () => {
    if (newItem.trim()) {
      setChecklistItems([...checklistItems, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleSaveChecklist = async () => {
    if (!resourceType || !selectedResource || checklistItems.length === 0) {
      message.error('Please fill in all required fields and add at least one checklist item');
      return;
    }

    // Validate resource type
    if (!['venue', 'equipment', 'vehicle'].includes(resourceType)) {
      message.error('Invalid resource type');
      return;
    }

    try {
      const response = await fetch('http://localhost/coc/gsd/fetch2.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          operation: 'saveMasterChecklist',
          checklistNames: checklistItems,
          type: resourceType,
          id: selectedResource
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        message.success(result.message || 'Checklist saved successfully');
        setIsModalVisible(false);
        setChecklistItems([]);
        setResourceType(null);
        setSelectedResource(null);
        setNewItem('');
        
        // Refresh the data after saving
        const updatedType = resourceType === 'venue' ? 'venue' :
                          resourceType === 'equipment' ? 'equipment' :
                          'vehicle';
        await fetchResources(updatedType);
        window.location.reload(); // Refresh to show updated counts
      } else {
        message.error(result.message || 'Failed to save checklist');
      }
    } catch (error) {
      console.error('Error saving checklist:', error);
      message.error('Failed to save checklist. Please try again.');
    }
  };

  const renderTabContent = (data) => (
    <Card>
      <div style={{ marginBottom: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>Resources List</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          Add Checklist
        </Button>
      </div>
      <Table columns={columns} dataSource={data} pagination={false} bordered />
      
      <Modal
        title="Add Checklist"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSaveChecklist}
        okButtonProps={{
          disabled: !resourceType || !selectedResource || checklistItems.length === 0
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Select
            style={{ width: '100%' }}
            placeholder="Select Type"
            onChange={handleTypeChange}
            options={[
              { value: 'venue', label: 'Venue' },
              { value: 'equipment', label: 'Equipment' },
              { value: 'vehicle', label: 'Vehicle' }
            ]}
          />
          
          <Select
            style={{ width: '100%' }}
            placeholder="Select Resource"
            value={selectedResource}
            onChange={setSelectedResource}
            options={resources}
            disabled={!resourceType}
          />
          
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add checklist item"
              onPressEnter={handleAddItem}
            />
            <Button type="primary" onClick={handleAddItem}>Add</Button>
          </Space.Compact>
          
          <List
            bordered
            dataSource={checklistItems}
            renderItem={(item) => (
              <List.Item>
                • {item}
              </List.Item>
            )}
          />
        </Space>
      </Modal>

      <Modal
        title="View Checklist"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        <List
          bordered
          dataSource={viewChecklistItems}
          renderItem={(item) => (
            <List.Item>
              • {item}
            </List.Item>
          )}
        />
      </Modal>
    </Card>
  );

  const items = [
    {
      key: '1',
      label: 'Venue',
      children: renderTabContent(venueData),
    },
    {
      key: '2',
      label: 'Equipment',
      children: renderTabContent(equipmentData),
    },
    {
      key: '3',
      label: 'Vehicle',
      children: renderTabContent(vehicleData),
    },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '24px', backgroundColor: '#f5f5f5' }}>
        <Tabs
          activeKey={currentTab}
          onChange={setCurrentTab}
          items={items}
          type="card"
          style={{ background: '#fff', padding: '16px', borderRadius: '8px' }}
        />
      </div>
    </div>
  );
}

export default Checklist;
