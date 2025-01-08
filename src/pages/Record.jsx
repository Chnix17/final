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
const { Title } = Typography;

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
  const [activeTab, setActiveTab] = useState('1');
  const [modalData, setModalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (visible && record?.approval_id) {
        setIsLoading(true);
        try {
          const response = await axios.post('http://localhost/coc/gsd/records&reports.php', {
            operation: 'getReservationDetailsById',
            json: {
              approval_id: record.approval_id
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

  // Replace detailedData with modalData in the render logic
  const VenueView = () => (
    <div className="p-4">
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Venue Name">{modalData?.venue?.venue_name}</Descriptions.Item>
          {/* Update all detailedData references to modalData */}
          <Descriptions.Item label="Form Name">{modalData?.venue?.venue_form_name}</Descriptions.Item>
          <Descriptions.Item label="Event Title">{modalData?.venue?.venue_form_event_title}</Descriptions.Item>
          <Descriptions.Item label="Description">{modalData?.venue?.venue_form_description}</Descriptions.Item>
          <Descriptions.Item label="Participants">{modalData?.venue?.venue_participants}</Descriptions.Item>
          <Descriptions.Item label="Start Date">
            {moment(modalData?.venue?.venue_form_start_date).format('MMM DD, YYYY hh:mm A')}
          </Descriptions.Item>
          <Descriptions.Item label="End Date">
            {moment(modalData?.venue?.venue_form_end_date).format('MMM DD, YYYY hh:mm A')}
          </Descriptions.Item>
          <Descriptions.Item label="Requester">{modalData?.venue?.venue_form_user_full_name}</Descriptions.Item>
          <Descriptions.Item label="Approval Status">
            <Tag color={getStatusColor(record?.approval_status)}>{record?.approval_status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Request Status">
            <Tag color={getStatusColor(modalData?.status_request)}>{modalData?.status_request}</Tag>
          </Descriptions.Item>
        </Descriptions>
      )}
    </div>
  );

  const VehicleView = () => (
    <div className="p-4">
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Vehicle Details">
              <div style={{ padding: '8px' }}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <strong>Make:</strong> {modalData?.vehicle?.vehicle_make}
                  </Col>
                  <Col span={12}>
                    <strong>Model:</strong> {modalData?.vehicle?.vehicle_model}
                  </Col>
                  <Col span={12}>
                    <strong>Category:</strong> {modalData?.vehicle?.vehicle_category}
                  </Col>
                  <Col span={12}>
                    <strong>License:</strong> {modalData?.vehicle?.vehicle_license}
                  </Col>
                </Row>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Form Name">{modalData?.vehicle?.vehicle_form_name}</Descriptions.Item>
            <Descriptions.Item label="Purpose">{modalData?.vehicle?.vehicle_form_purpose}</Descriptions.Item>
            <Descriptions.Item label="Destination">{modalData?.vehicle?.vehicle_form_destination}</Descriptions.Item>
            <Descriptions.Item label="Start Date">
              {modalData?.vehicle?.vehicle_form_start_date && 
              moment(modalData?.vehicle?.vehicle_form_start_date).format('MMM DD, YYYY hh:mm A')}
            </Descriptions.Item>
            <Descriptions.Item label="End Date">
              {modalData?.vehicle?.vehicle_form_end_date && 
              moment(modalData?.vehicle?.vehicle_form_end_date).format('MMM DD, YYYY hh:mm A')}
            </Descriptions.Item>
            <Descriptions.Item label="Requester">{modalData?.vehicle?.vehicle_form_user_full_name}</Descriptions.Item>
            <Descriptions.Item label="Approval Status">
              <Tag color={getStatusColor(record?.approval_status)}>{record?.approval_status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Request Status">
              <Tag color={getStatusColor(modalData?.status_request)}>{modalData?.status_request}</Tag>
            </Descriptions.Item>
          </Descriptions>
          
          {modalData?.passengers?.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <Title level={4}>Passengers</Title>
              <Table
                dataSource={modalData.passengers}
                columns={[
                  { 
                    title: 'Name',
                    dataIndex: 'passenger_name',
                    key: 'passenger_name'
                  },
                  { 
                    title: 'ID',
                    dataIndex: 'passenger_id',
                    key: 'passenger_id'
                  }
                ]}
                pagination={false}
                bordered
                size="small"
              />
            </div>
          )}
        </>
      )}
    </div>
  );

  const items = [
    {
      key: '1',
      label: 'Details',
      children: record?.form_type === 'Venue' ? <VenueView /> : <VehicleView />
    },
    {
      key: '2',
      label: 'Equipment',
      children: (
        <div className="p-4">
          {modalData?.equipment && (
            <Descriptions bordered>
              <Descriptions.Item label="Equipment Name">{modalData.equipment.equipment_name}</Descriptions.Item>
              <Descriptions.Item label="Quantity">{modalData.equipment.reservation_equipment_quantity}</Descriptions.Item>
            </Descriptions>
          )}
        </div>
      )
    }
  ];

  return (
    <Modal
      title={
        <span style={{ color: theme.primary }}>
          Reservation Details - {record?.reservation_event_title}
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
      className="detail-modal"
    >
      <Tabs 
        defaultActiveKey="1" 
        items={items}
        onChange={setActiveTab}
        className="detail-tabs"
      />
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
    const consolidated = data.map(item => ({
      approval_id: item.approval_id,
      form_name: item.venue_form_name || item.vehicle_form_name || 'N/A',
      form_type: item.venue_form_name ? 'Venue' : item.vehicle_form_name ? 'Vehicle' : 'N/A',
      approval_created_at: item.approval_created_at,
      approval_status: item.approval_status,
      reservation_status: item.reservation_status
    }));
    console.log('Consolidated data:', consolidated);
    return consolidated;
  };

  const columns = [
    {
      title: 'Approval ID',
      dataIndex: 'approval_id',
      sorter: (a, b) => a.approval_id - b.approval_id,
    },
    {
      title: 'Form Name',
      dataIndex: 'form_name',
      sorter: (a, b) => a.form_name.localeCompare(b.form_name),
      filterable: true,
    },
    {
      title: 'Type',
      dataIndex: 'form_type',
      filters: [
        { text: 'Venue', value: 'Venue' },
        { text: 'Vehicle', value: 'Vehicle' },
      ],
      onFilter: (value, record) => record.form_type === value,
    },
    {
      title: 'Created Date',
      dataIndex: 'approval_created_at',
      render: (date) => moment(date).format('MMM DD, YYYY hh:mm A'),
      sorter: (a, b) => moment(a.approval_created_at).unix() - moment(b.approval_created_at).unix(),
    },
    {
      title: 'Approval Status',
      dataIndex: 'approval_status',
      filters: [
        { text: 'Approved', value: 'approve' },
        { text: 'Pending', value: 'pending' },
        { text: 'Declined', value: 'decline' },
      ],
      onFilter: (value, record) => record.approval_status === value,
    },
    {
      title: 'Reservation Status',
      dataIndex: 'reservation_status',
      filters: [
        { text: 'Reserved', value: 'Reserved' },
        { text: 'Cancelled', value: 'Cancelled' },
      ],
      onFilter: (value, record) => record.reservation_status === value,
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

  const filteredReservations = reservations.filter(reservation => {
    const searchLower = searchText.toLowerCase();
    return (
      reservation.form_name.toLowerCase().includes(searchLower) ||
      reservation.form_type.toLowerCase().includes(searchLower) ||
      reservation.approval_status.toLowerCase().includes(searchLower) ||
      (reservation.reservation_status && reservation.reservation_status.toLowerCase().includes(searchLower))
    );
  });

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
    
          <Table
            columns={columns}
            dataSource={filteredReservations}
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

