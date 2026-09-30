/**
 * Yatra Now - Bus Transit Master Data Engine
 * Real-time Fleet Telemetry, Sequential Stops, Depot Registry, and Incident Reports
 */

export const INITIAL_DEPOTS = [
  {
    id: 'depot_01',
    name: 'Central City State Transport Depot',
    location: 'Majestic Hub, Central Junction',
    branchCode: 'CSTD-01',
    isGovernment: true,
    totalBuses: 48,
    activeBuses: 36,
    verified: true
  },
  {
    id: 'depot_02',
    name: 'Metro Link Private Fleet Operators',
    location: 'North Bypass Highway Terminal',
    branchCode: 'MLPF-09',
    isGovernment: false,
    totalBuses: 24,
    activeBuses: 18,
    verified: true
  },
  {
    id: 'depot_03',
    name: 'Eastern Suburban Transport Depot',
    location: 'Tech Valley Ring Road Terminal',
    branchCode: 'ESTD-04',
    isGovernment: true,
    totalBuses: 30,
    activeBuses: 22,
    verified: false
  }
];

export const INITIAL_BUSES = [
  {
    id: 'bus_101',
    name: 'City Superfast Express',
    busNumber: '104-A',
    registrationNumber: 'KA-01-F-9821',
    depotId: 'depot_01',
    depotName: 'Central City State Transport Depot',
    origin: 'Central Bus Terminal',
    destination: 'Tech Valley Metro Complex',
    status: 'running', // 'running' | 'idle' | 'breakdown'
    speed: 42, // km/h
    bearing: 65,
    delayMinutes: 0, // On Time
    currentStopIndex: 2,
    driver: {
      name: 'Ramesh Kumar',
      license: 'DL-2018-099412',
      mobile: '+91 94451 12345'
    },
    conductor: {
      name: 'Suresh Babu',
      badgeId: 'COND-8821',
      mobile: '+91 94451 12346'
    },
    currentPosition: [12.9716, 77.5946],
    stops: [
      { id: 'st_01', name: 'Central Bus Terminal', lat: 12.9716, lng: 77.5946, scheduledTime: '08:00 AM', actualTime: '08:00 AM', delay: 0 },
      { id: 'st_02', name: 'Town Hall Circle', lat: 12.9645, lng: 77.5855, scheduledTime: '08:15 AM', actualTime: '08:15 AM', delay: 0 },
      { id: 'st_03', name: 'Lalbagh West Gate', lat: 12.9510, lng: 77.5840, scheduledTime: '08:30 AM', actualTime: '08:30 AM', delay: 0 },
      { id: 'st_04', name: 'South End Circle', lat: 12.9360, lng: 77.5790, scheduledTime: '08:45 AM', actualTime: '08:45 AM', delay: 0 },
      { id: 'st_05', name: 'Silk Board Junction', lat: 12.9175, lng: 77.6235, scheduledTime: '09:05 AM', actualTime: '09:05 AM', delay: 0 },
      { id: 'st_06', name: 'Tech Valley Metro Complex', lat: 12.8950, lng: 77.6550, scheduledTime: '09:30 AM', actualTime: '09:30 AM', delay: 0 }
    ]
  },
  {
    id: 'bus_102',
    name: 'Rapid Metro Rider',
    busNumber: '204-B',
    registrationNumber: 'DL-01-AB-4509',
    depotId: 'depot_02',
    depotName: 'Metro Link Private Fleet Operators',
    origin: 'Airport Gateway Terminal',
    destination: 'Central Railway Station',
    status: 'running',
    speed: 54,
    bearing: 185,
    delayMinutes: 14, // DELAYED by 14 mins (strictly red in UI)
    currentStopIndex: 1,
    driver: {
      name: 'Vikas Deshmukh',
      license: 'DL-2015-884123',
      mobile: '+91 98231 65432'
    },
    conductor: {
      name: 'Mohan Lal',
      badgeId: 'COND-4509',
      mobile: '+91 98231 65433'
    },
    currentPosition: [12.9980, 77.5920],
    stops: [
      { id: 'st_11', name: 'Airport Gateway Terminal', lat: 13.0450, lng: 77.5900, scheduledTime: '08:15 AM', actualTime: '08:15 AM', delay: 0 },
      { id: 'st_12', name: 'Hebbal Flyover Junction', lat: 13.0355, lng: 77.5970, scheduledTime: '08:35 AM', actualTime: '08:49 AM', delay: 14 },
      { id: 'st_13', name: 'Cantonment Crossing', lat: 12.9940, lng: 77.5980, scheduledTime: '09:00 AM', actualTime: '09:14 AM', delay: 14 },
      { id: 'st_14', name: 'Central Railway Station', lat: 12.9780, lng: 77.5695, scheduledTime: '09:25 AM', actualTime: '09:39 AM', delay: 14 }
    ]
  },
  {
    id: 'bus_103',
    name: 'Suburban Green Cruiser',
    busNumber: '302-C',
    registrationNumber: 'MH-12-Q-7788',
    depotId: 'depot_01',
    depotName: 'Central City State Transport Depot',
    origin: 'University North Gate',
    destination: 'South End Circle',
    status: 'running',
    speed: 38,
    bearing: 140,
    delayMinutes: 8, // Delayed by 8 mins
    currentStopIndex: 2,
    driver: {
      name: 'Jagdish Rao',
      license: 'DL-2019-331290',
      mobile: '+91 97123 44556'
    },
    conductor: {
      name: 'Anand Verma',
      badgeId: 'COND-7788',
      mobile: '+91 97123 44557'
    },
    currentPosition: [12.9645, 77.5855],
    stops: [
      { id: 'st_21', name: 'University North Gate', lat: 13.0100, lng: 77.5550, scheduledTime: '08:40 AM', actualTime: '08:40 AM', delay: 0 },
      { id: 'st_22', name: 'Malleshwaram 8th Cross', lat: 12.9880, lng: 77.5680, scheduledTime: '08:55 AM', actualTime: '09:03 AM', delay: 8 },
      { id: 'st_02', name: 'Town Hall Circle', lat: 12.9645, lng: 77.5855, scheduledTime: '09:15 AM', actualTime: '09:23 AM', delay: 8 },
      { id: 'st_04', name: 'South End Circle', lat: 12.9360, lng: 77.5790, scheduledTime: '09:40 AM', actualTime: '09:48 AM', delay: 8 }
    ]
  },
  {
    id: 'bus_104',
    name: 'Eastern Interstate Shuttle',
    busNumber: '505-X',
    registrationNumber: 'TN-09-BK-3312',
    depotId: 'depot_03',
    depotName: 'Eastern Suburban Transport Depot',
    origin: 'Silk Board Junction',
    destination: 'Tech Valley Metro Complex',
    status: 'idle', // In depot maintenance
    speed: 0,
    bearing: 0,
    delayMinutes: 0,
    currentStopIndex: 0,
    driver: {
      name: 'K. Balaji',
      license: 'DL-2014-991244',
      mobile: '+91 98840 99881'
    },
    conductor: {
      name: 'Pradeep Chandran',
      badgeId: 'COND-3312',
      mobile: '+91 98840 99882'
    },
    currentPosition: [12.9175, 77.6235],
    stops: [
      { id: 'st_05', name: 'Silk Board Junction', lat: 12.9175, lng: 77.6235, scheduledTime: '10:00 AM', actualTime: '10:00 AM', delay: 0 },
      { id: 'st_06', name: 'Tech Valley Metro Complex', lat: 12.8950, lng: 77.6550, scheduledTime: '10:30 AM', actualTime: '10:30 AM', delay: 0 }
    ]
  }
];

export const INITIAL_INCIDENTS = [
  {
    id: 'inc_01',
    busId: 'bus_102',
    busName: 'Rapid Metro Rider',
    busNumber: '204-B',
    regNumber: 'DL-01-AB-4509',
    type: 'Vehicle Breakdown',
    description: 'Radiator coolant overheating near Hebbal Flyover. Mechanic team requested.',
    reportedBy: 'Vikas Deshmukh (Driver)',
    timestamp: '10 mins ago',
    status: 'investigating',
    visibleToPublic: true
  },
  {
    id: 'inc_02',
    busId: 'bus_104',
    busName: 'Eastern Interstate Shuttle',
    busNumber: '505-X',
    regNumber: 'TN-09-BK-3312',
    type: 'Scheduled Maintenance',
    description: 'Brake pads replacement and tire pressure calibration.',
    reportedBy: 'K. Balaji (Driver)',
    timestamp: '2 hours ago',
    status: 'resolved',
    visibleToPublic: false
  }
];

// Helper to save and load state locally
export class BusDataStore {
  constructor() {
    this.depots = this.load('depots', INITIAL_DEPOTS);
    this.buses = this.load('buses', INITIAL_BUSES);
    this.incidents = this.load('incidents', INITIAL_INCIDENTS);
  }

  load(key, fallback) {
    try {
      const stored = localStorage.getItem('yatranow_' + key);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  }

  save(key, data) {
    localStorage.setItem('yatranow_' + key, JSON.stringify(data));
  }

  getBuses() { return this.buses; }
  getDepots() { return this.depots; }
  getIncidents() { return this.incidents; }

  addBus(busData) {
    this.buses.unshift(busData);
    this.save('buses', this.buses);
    return busData;
  }

  addIncident(incident) {
    this.incidents.unshift(incident);
    this.save('incidents', this.incidents);
    return incident;
  }

  updateBusLocation(busId, lat, lng, speed, bearing) {
    const bus = this.buses.find(b => b.id === busId);
    if (bus) {
      bus.currentPosition = [lat, lng];
      bus.speed = speed;
      bus.bearing = bearing;
      this.save('buses', this.buses);
    }
    return bus;
  }
}

export const busDataStore = new BusDataStore();
