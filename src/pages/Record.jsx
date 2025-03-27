import { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './Sidebar';
import {
  Table,
  Badge,
  Input,
  Select,
  Space,
  Typography,
  Card,
  DatePicker,
  Modal,
  Button,
  Tabs,
  Timeline,
  Avatar,
  Statistic,
  Row,
  Col,
  Descriptions,
  Tag,
  Spin
} from 'antd';
import { EyeOutlined, UserOutlined, ClockCircleOutlined, TeamOutlined, CarOutlined, ToolOutlined } from '@ant-design/icons';
import moment from 'moment';

const { Search } = Input;
const { Title, Text } = Typography;  // Add Text here

// Add theme constants
const themeColors = {
  primary: '#2E7D32', // dark green
  secondary: '#4CAF50', // medium green
  light: '#E8F5E9', // light green
  white: '#FFFFFF',
  success: '#388E3C',
  warning: '#FFA000',
  error: '#D32F2F',
  text: '#2C3E50',
  // Add new status colors
  pending: '#FFA000',
  approved: '#388E3C',
  declined: '#D32F2F',
  expired: '#9E9E9E',
  completed: '#1976D2'
};

// Add this style block
const styles = {
  searchInput: {
    borderColor: themeColors.primary
  }
};

// Add this function before DetailModal
const getStatusColor = (status) => {
  switch(status?.toLowerCase()) {
    case 'approve':
    case 'approved':
      return 'green';
    case 'pending':
      return 'gold';
    case 'decline':
    case 'declined':
      return 'red';
    case 'reserved':
      return 'blue';
    case 'cancelled':
      return 'gray';
    default:
      return 'default';
  }
};

// Move DetailModal outside of Record component
const DetailModal = ({ visible, record, onClose, theme }) => {
  const [modalData, setModalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (visible && record?.reservation_id) {
        setIsLoading(true);
        try {
          const response = await axios.post('http://localhost/coc/gsd/records&reports.php', {
            operation: 'getReservationDetailsById',
            json: {
              reservation_id: record.reservation_id
            }
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (response.data?.status === 'success') {
            setModalData(response.data.data);
          }
        } catch (error) {
          toast.error('Error fetching details');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [visible, record]);

  const ReservedItemsList = ({ items, type }) => {
    if (!items || items.length === 0) return null;
    
    return (
      <div style={{ marginBottom: '12px' }}>
        {items.map((item, index) => (
          <Tag
            key={index}
            style={{
              padding: '4px 12px',
              margin: '4px',
              borderRadius: '4px',
              fontSize: '14px',
              background: '#f5f5f5',
              border: '1px solid #d9d9d9'
            }}
          >
            {type === 'venue' ? item.venue_name :
             type === 'vehicle' ? item.vehicle_name :
             item.equipment_name}
          </Tag>
        ))}
      </div>
    );
  };

  return (
    <Modal
      title={
        <span style={{ color: theme.primary }}>
          Reservation Details - {modalData?.reservation_title}
        </span>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button 
          key="close-button"
          onClick={onClose}
          style={{
            backgroundColor: theme.primary,
            color: theme.white
          }}
        >
          Close
        </Button>
      ]}
      style={{
        borderRadius: '12px',
        overflow: 'hidden'
      }}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <div className="p-4">
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Event Title">{modalData?.reservation_title}</Descriptions.Item>
            <Descriptions.Item label="Description">{modalData?.reservation_description}</Descriptions.Item>
            <Descriptions.Item label="Requester">
              <Space>
                <UserOutlined />
                {modalData?.full_name}
                <Tag color="blue">{modalData?.department_name}</Tag>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Participants">{modalData?.reservation_participants}</Descriptions.Item>
            <Descriptions.Item label="Start Date">
              {moment(modalData?.reservation_start_date).format('MMM DD, YYYY hh:mm A')}
            </Descriptions.Item>
            <Descriptions.Item label="End Date">
              {moment(modalData?.reservation_end_date).format('MMM DD, YYYY hh:mm A')}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(modalData?.status_request)}>{modalData?.status_request}</Tag>
            </Descriptions.Item>
          </Descriptions>

          {(modalData?.venues?.length > 0 ||
            modalData?.vehicles?.length > 0 ||
            modalData?.equipment?.length > 0) && (
            <>
              <hr style={{ margin: '24px 0', border: '1px solid #f0f0f0' }} />
              
              <div style={{ marginTop: '20px' }}>
                <Title level={5} style={{ marginBottom: '16px' }}>Reserved Items</Title>
                
                {modalData?.venues?.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <Text type="secondary" style={{ fontSize: '13px' }}>Venues</Text>
                    <ReservedItemsList items={modalData.venues} type="venue" />
                  </div>
                )}

                {modalData?.vehicles?.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <Text type="secondary" style={{ fontSize: '13px' }}>Vehicles</Text>
                    <ReservedItemsList items={modalData.vehicles} type="vehicle" />
                  </div>
                )}

                {modalData?.equipment?.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <Text type="secondary" style={{ fontSize: '13px' }}>Equipment</Text>
                    <ReservedItemsList items={modalData.equipment} type="equipment" />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
};

const Record = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('1');

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
        const response = await axios.post('http://localhost/coc/gsd/records&reports.php', {
            operation: 'fetchRecord',
            json: {}
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data?.status === 'success') {
            const consolidatedData = consolidateReservations(response.data.data);
            setReservations(consolidatedData);
            console.log('Consolidated reservations:', consolidatedData);
        } else { 
            toast.error('No pending reservations found.');
            setReservations([]);
        }
    } catch (error) {
        toast.error('Error fetching reservations. Please try again later.');
        setReservations([]);
    } finally {
        setLoading(false);
    }
  };

  const consolidateReservations = (data) => {
    return data.map(item => ({
      reservation_id: item.reservation_id,
      title: item.reservation_title,
      description: item.reservation_description,
      start_date: item.reservation_start_date,
      end_date: item.reservation_end_date,
      status: item.reservation_status_name,
      requester: item.user_full_name
    }));
  };
  
  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      render: (date) => moment(date).format('MMM DD, YYYY hh:mm A'),
      sorter: (a, b) => moment(a.start_date).unix() - moment(b.start_date).unix(),
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      render: (date) => moment(date).format('MMM DD, YYYY hh:mm A'),
      sorter: (a, b) => moment(a.end_date).unix() - moment(b.end_date).unix(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Requester',
      dataIndex: 'requester',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => showModal(record)}
          size="small"
        >
          View
        </Button>
      ),
    }
  ];

  const getFilteredReservations = (status) => {
    return reservations.filter(reservation => {
      const searchLower = searchText.toLowerCase();
      const matchesSearch = (
        reservation.title?.toLowerCase().includes(searchLower) ||
        reservation.description?.toLowerCase().includes(searchLower) ||
        reservation.requester?.toLowerCase().includes(searchLower)
      );

      if (status === 'active') {
        return matchesSearch && reservation.status === 'Reserved';
      } else {
        return matchesSearch && reservation.status === 'Decline';
      }
    });
  };

  const tabItems = [
    {
      key: '1',
      label: 'Active Reservations',
      children: (
        <Table
          columns={columns}
          dataSource={getFilteredReservations('active')}
          rowKey="approval_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} reservations`,
          }}
          scroll={{ x: 1000 }}
          style={{
            borderRadius: '8px',
            overflow: 'hidden'
          }}
          className="record-table"
        />
      )
    },
    {
      key: '2',
      label: 'Completed/Declined Reservations',
      children: (
        <Table
          columns={columns}
          dataSource={getFilteredReservations('completed')}
          rowKey="approval_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} reservations`,
          }}
          scroll={{ x: 1000 }}
          style={{
            borderRadius: '8px',
            overflow: 'hidden'
          }}
          className="record-table"
        />
      )
    }
  ];

  const showModal = (record) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div className="p-4" style={{ 
        backgroundColor: themeColors.light, 
        minHeight: '100vh',
        width: '100%' 
      }}>
        <Card 
          className="m-4"
          style={{ 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderRadius: '12px',
            border: 'none'
          }}
        >
          <ToastContainer />
          <div className="mb-4">
            <Title level={2} style={{ color: themeColors.primary }}>Reservation Records</Title>
            <Space className="mb-4" size="large">
              <Search
                placeholder="Search reservations..."
                allowClear
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
                className="search-input"
              />
              <Select
                defaultValue="all"
                style={{ width: 120 }}
                className="status-select"
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: '1', label: 'Pending' },
                  { value: '2', label: 'Approved' },
                  { value: '3', label: 'Declined' }
                ]}
              />
            </Space>
          </div>

          <Tabs 
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            style={{ marginTop: '16px' }}
          />

          <DetailModal
            visible={isModalVisible}
            record={selectedRecord}
            onClose={() => {
              setIsModalVisible(false);
              setSelectedRecord(null);
            }}
            theme={themeColors}
          />
        </Card>
      </div>
    </div>
  );
};

export default Record;

