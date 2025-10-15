/**
 * Central configuration for device field definitions
 * Used by both DeviceList and DeviceFormModal components
 */

// Device types with metadata
export const DEVICE_TYPES = {
  'NIC': {
    label: 'Network Interface Card',
    color: 'blue',
    icon: '🌐'
  },
  'SSD': {
    label: 'Solid State Drive',
    color: 'green',
    icon: '💾'
  },
  'FPGA': {
    label: 'Field-Programmable Gate Array',
    color: 'orange',
    icon: '🔧'
  },
  'GPU': {
    label: 'Graphics Processing Unit',
    color: 'red',
    icon: '🎮'
  },
  'CXL(FPGA)': {
    label: 'CXL FPGA Device',
    color: 'purple',
    icon: '⚡'
  },
  'CXL(ASIC)': {
    label: 'CXL ASIC Device',
    color: 'purple',
    icon: '💎'
  }
};

// Get device type list (for dropdowns)
export const getDeviceTypesList = () => Object.keys(DEVICE_TYPES);

// Get device type metadata
export const getDeviceTypeInfo = (type) => DEVICE_TYPES[type] || { 
  label: type, 
  color: 'default', 
  icon: '🔌' 
};

// Basic fields common to all devices
export const BASIC_DEVICE_FIELDS = [
  'id', 'name', 'type', 'owner', 'status', 'attachedServer', 
  'users', 'serialNumber', 'location', 'note'
];

// Type-specific fields by device type
export const TYPE_SPECIFIC_FIELDS = {
  'NIC': [
    'dataRate', 'partNumber', 'ips', 'bmcIp', 'oobMac', 'sudoUser', 'sudoPassword',
    'bmcUser', 'bmcPassword', 'hostMacs', 'boardId'
  ],
  'FPGA': ['partNumber', 'mac'],
  'CXL(FPGA)': ['partNumber', 'mac'],
  'CXL(ASIC)': ['partNumber', 'capacity'],
  'SSD': ['partNumber', 'model', 'manufacturer', 'capacity'],
  'GPU': ['partNumber', 'model', 'manufacturer']
};

// Default fields to initialize for each device type
export const DEFAULT_DEVICE_TYPE_VALUES = {
  'NIC': {
    dataRate: '',
    partNumber: '',
    serialNumber: '',
    ips: [],
    bmcIp: '',
    sudoUser: '',
    sudoPassword: '',
    bmcUser: '',
    bmcPassword: '',
    oobMac: '',
    hostMacs: [],
    boardId: ''
  },
  'FPGA': {
    partNumber: '',
    serialNumber: '',
    mac: ''
  },
  'CXL(FPGA)': {
    partNumber: '',
    serialNumber: '',
    mac: ''
  },
  'CXL(ASIC)': {
    partNumber: '',
    capacity: ''
  },
  'SSD': {
    partNumber: '',
    serialNumber: '',
    model: '',
    manufacturer: '',
    capacity: ''
  },
  'GPU': {
    partNumber: '',
    serialNumber: '',
    model: '',
    manufacturer: ''
  }
};

// Format field names for display (convert camelCase to Title Case)
export function formatFieldName(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
}

// Get all fields that should be excluded from the expanded view
export function getExcludedFields(deviceType) {
  const typeSpecificFields = deviceType && TYPE_SPECIFIC_FIELDS[deviceType] 
    ? TYPE_SPECIFIC_FIELDS[deviceType] 
    : [];
    
  return [...BASIC_DEVICE_FIELDS, ...typeSpecificFields];
}
