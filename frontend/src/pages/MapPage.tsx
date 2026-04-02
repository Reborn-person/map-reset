import React, { useEffect, useMemo, useState } from 'react';
import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Address {
  _id: string;
  name: string;
  description: string;
  location: {
    type?: 'Point';
    coordinates: [number, number];
  };
  tags: string[];
}

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  name: string;
}

interface RouteSummary {
  distance: number;
  duration: number;
}

const addressIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const currentLocIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const pageShellStyle: React.CSSProperties = {
  display: 'flex',
  height: '100vh',
  overflow: 'hidden',
  background: '#e2e8f0',
};

const sidebarStyle: React.CSSProperties = {
  width: 390,
  background: '#f8fafc',
  borderRight: '1px solid #cbd5e1',
  display: 'flex',
  flexDirection: 'column',
};

const panelStyle: React.CSSProperties = {
  padding: 20,
  borderBottom: '1px solid #cbd5e1',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const routeCardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 16,
  padding: 16,
  marginBottom: 16,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
};

const addressCardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 16,
  padding: 16,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
};

const stepCardStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 10,
};

const toolbarRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #cbd5e1',
  borderRadius: 12,
  padding: '12px 14px',
  fontSize: 14,
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 12,
  padding: '10px 12px',
  fontSize: 14,
  minWidth: 110,
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 96,
  resize: 'vertical',
};

const primaryButtonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 12,
  padding: '10px 14px',
  background: '#0f172a',
  color: '#ffffff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 12,
  padding: '10px 14px',
  background: '#ffffff',
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const dangerButtonStyle: React.CSSProperties = {
  border: '1px solid #fecaca',
  borderRadius: 12,
  padding: '10px 14px',
  background: '#fef2f2',
  color: '#b91c1c',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const ghostButtonStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#0f172a',
  cursor: 'pointer',
  fontWeight: 600,
};

const tagStyle: React.CSSProperties = {
  background: '#dbeafe',
  color: '#1d4ed8',
  borderRadius: 999,
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 600,
};

const noticeStyle: React.CSSProperties = {
  background: '#e0f2fe',
  color: '#0c4a6e',
  borderRadius: 12,
  padding: '10px 12px',
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
};

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 520,
  background: '#ffffff',
  borderRadius: 20,
  padding: 20,
  boxShadow: '0 30px 60px rgba(15, 23, 42, 0.2)',
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  color: '#0f172a',
  fontWeight: 600,
};

const MapEvents = ({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) => {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng);
    },
  });

  return null;
};

const RouteViewport = ({
  routePath,
  currentPosition,
  destinationPosition,
}: {
  routePath: [number, number][] | null;
  currentPosition: L.LatLng | null;
  destinationPosition: L.LatLng | null;
}) => {
  const map = useMap();

  useEffect(() => {
    if (routePath && routePath.length > 1) {
      map.fitBounds(routePath, { padding: [40, 40] });
      return;
    }

    if (currentPosition && destinationPosition) {
      map.fitBounds(
        [
          [currentPosition.lat, currentPosition.lng],
          [destinationPosition.lat, destinationPosition.lng],
        ],
        { padding: [40, 40] }
      );
    }
  }, [currentPosition, destinationPosition, map, routePath]);

  return null;
};

const MapPage: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<L.LatLng | null>(null);
  const [routePath, setRoutePath] = useState<[number, number][] | null>(null);
  const [routeMode, setRouteMode] = useState('driving');
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [currentPosition, setCurrentPosition] = useState<L.LatLng | null>(null);
  const [activeDestination, setActiveDestination] = useState<L.LatLng | null>(null);
  const [nearbyRadius, setNearbyRadius] = useState('3000');
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    addressText: '',
    tags: '',
  });

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const fetchAddresses = async () => {
    try {
      const { data } = await api.get('/addresses');
      setAddresses(data);
      setStatusMessage('');
    } catch (error) {
      setStatusMessage('Failed to load addresses');
    }
  };

  useEffect(() => {
    fetchAddresses();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition(L.latLng(position.coords.latitude, position.coords.longitude));
        },
        () => {
          setStatusMessage('Current location unavailable, using Guangzhou as the default center');
        }
      );
    }
  }, []);

  const handleMapClick = (latlng: L.LatLng) => {
    setSelectedLocation(latlng);
    setEditingAddress(null);
    setForm({
      name: '',
      description: '',
      addressText: '',
      tags: '',
    });
    setIsModalVisible(true);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setSelectedLocation(L.latLng(address.location.coordinates[1], address.location.coordinates[0]));
    setForm({
      name: address.name,
      description: address.description,
      addressText: address.description,
      tags: address.tags.join(','),
    });
    setIsModalVisible(true);
  };

  const resetRoutePanel = () => {
    setRoutePath(null);
    setRouteSteps([]);
    setRouteSummary(null);
    setActiveDestination(null);
  };

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleAddAddress = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const payload = {
        name: form.name,
        description: form.description,
        addressText: form.addressText,
        tags: form.tags
          ? form.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
          : [],
        location: selectedLocation
          ? {
              type: 'Point',
              coordinates: [selectedLocation.lng, selectedLocation.lat] as [number, number],
            }
          : undefined,
      };

      if (editingAddress) {
        await api.put(`/addresses/${editingAddress._id}`, payload);
        setStatusMessage('Address updated successfully');
      } else {
        await api.post('/addresses', payload);
        setStatusMessage('Address added successfully');
      }

      setIsModalVisible(false);
      setEditingAddress(null);
      setSelectedLocation(null);
      setForm({
        name: '',
        description: '',
        addressText: '',
        tags: '',
      });
      fetchAddresses();
    } catch (error: any) {
      setStatusMessage(error.response?.data?.message || 'Failed to save address');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/addresses/${id}`);
      setStatusMessage('Address deleted');
      fetchAddresses();
      resetRoutePanel();
    } catch (error) {
      setStatusMessage('Failed to delete address');
    }
  };

  const loadNearbyAddresses = async () => {
    if (!currentPosition) {
      setStatusMessage('Please allow location access before using nearby search');
      return;
    }

    try {
      const { data } = await api.get('/addresses/nearby', {
        params: {
          lng: currentPosition.lng,
          lat: currentPosition.lat,
          radius: nearbyRadius,
        },
      });

      setAddresses(data);
      setShowNearbyOnly(true);
      setStatusMessage('Nearby addresses loaded');
    } catch (error) {
      setStatusMessage('Failed to load nearby addresses');
    }
  };

  const resetAddressList = async () => {
    await fetchAddresses();
    setShowNearbyOnly(false);
  };

  const getNavigationStart = async (): Promise<L.LatLng> => {
    if (navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = L.latLng(position.coords.latitude, position.coords.longitude);
            setCurrentPosition(location);
            resolve(location);
          },
          () => {
            const fallback = L.latLng(23.1291, 113.2644);
            setStatusMessage('Unable to get your live location, using Guangzhou as the start point');
            resolve(fallback);
          }
        );
      });
    }

    return L.latLng(23.1291, 113.2644);
  };

  const handleNavigate = async (target: Address) => {
    setIsNavigating(true);
    try {
      const start = await getNavigationStart();
      const targetLng = target.location.coordinates[0];
      const targetLat = target.location.coordinates[1];

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/${routeMode}/${start.lng},${start.lat};${targetLng},${targetLat}?overview=full&geometries=geojson&steps=true`
      );
      const data = await response.json();

      if (!data.routes || !data.routes.length) {
        setStatusMessage('No route found');
        return;
      }

      const route = data.routes[0];
      const coords = route.geometry.coordinates.map((point: [number, number]) => [point[1], point[0]]);
      const steps = route.legs?.[0]?.steps?.map((step: any) => ({
        instruction: step.maneuver?.instruction || `${step.maneuver?.type || 'Continue'} ${step.name || ''}`.trim(),
        distance: step.distance,
        duration: step.duration,
        name: step.name || 'Unnamed road',
      })) || [];

      setRoutePath(coords);
      setRouteSteps(steps);
      setRouteSummary({
        distance: route.distance,
        duration: route.duration,
      });
      setActiveDestination(L.latLng(targetLat, targetLng));
      setStatusMessage(
        `Route found: ${(route.distance / 1000).toFixed(2)} km, about ${(route.duration / 60).toFixed(0)} mins`
      );
    } catch (error) {
      setStatusMessage('Failed to get route');
    } finally {
      setIsNavigating(false);
    }
  };

  const downloadBlob = (data: BlobPart, fileName: string) => {
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExportCsv = async () => {
    try {
      const response = await api.get('/batch/export', { responseType: 'blob' });
      downloadBlob(response.data, 'addresses.csv');
      setStatusMessage('CSV exported');
    } catch (error) {
      setStatusMessage('CSV export failed');
    }
  };

  const handleExportGeoJSON = async () => {
    try {
      const response = await api.get('/batch/export/geojson', { responseType: 'blob' });
      downloadBlob(response.data, 'addresses.geojson');
      setStatusMessage('GeoJSON exported');
    } catch (error) {
      setStatusMessage('GeoJSON export failed');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/batch/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setStatusMessage(`${file.name} uploaded successfully`);
      fetchAddresses();
    } catch (error) {
      setStatusMessage(`${file.name} upload failed`);
    }
  };

  const filteredAddresses = useMemo(
    () =>
      addresses.filter(
        (address) =>
          address.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          address.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          address.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      ),
    [addresses, searchTerm]
  );

  return (
    <div style={pageShellStyle}>
      <aside style={sidebarStyle}>
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Address Navigation</h2>
            <button type="button" onClick={logout} style={ghostButtonStyle}>
              Logout
            </button>
          </div>
          <p style={{ color: '#475569' }}>Welcome, {user?.username}</p>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name, description or tags"
            style={inputStyle}
          />

          <div style={toolbarRowStyle}>
            <select value={routeMode} onChange={(event) => setRouteMode(event.target.value)} style={selectStyle}>
              <option value="driving">Driving</option>
              <option value="walking">Walking</option>
              <option value="cycling">Cycling</option>
            </select>
            <select value={nearbyRadius} onChange={(event) => setNearbyRadius(event.target.value)} style={selectStyle}>
              <option value="1000">1 km</option>
              <option value="3000">3 km</option>
              <option value="5000">5 km</option>
            </select>
          </div>

          <div style={toolbarRowStyle}>
            <button type="button" onClick={loadNearbyAddresses} style={primaryButtonStyle}>
              Nearby
            </button>
            {showNearbyOnly ? (
              <button type="button" onClick={resetAddressList} style={secondaryButtonStyle}>
                Show All
              </button>
            ) : null}
          </div>

          <div style={toolbarRowStyle}>
            <label style={secondaryButtonStyle}>
              Import CSV
              <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
            <button type="button" onClick={handleExportCsv} style={secondaryButtonStyle}>
              Export CSV
            </button>
            <button type="button" onClick={handleExportGeoJSON} style={secondaryButtonStyle}>
              Export GeoJSON
            </button>
          </div>

          <p style={{ color: '#64748b', marginBottom: 0 }}>
            Click the map to pick coordinates, or enter a text address for geocoding.
          </p>
          {statusMessage ? <div style={noticeStyle}>{statusMessage}</div> : null}
        </div>

        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          {routeSummary ? (
            <div style={routeCardStyle}>
              <h3 style={{ marginTop: 0 }}>Route Result</h3>
              <p>Distance: {(routeSummary.distance / 1000).toFixed(2)} km</p>
              <p>Estimated time: {(routeSummary.duration / 60).toFixed(0)} mins</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {routeSteps.length ? (
                  routeSteps.map((step, index) => (
                    <div key={`${step.name}-${index}`} style={stepCardStyle}>
                      <strong>{index + 1}. {step.instruction}</strong>
                      <div style={{ color: '#64748b', marginTop: 6 }}>
                        {step.name} · {(step.distance / 1000).toFixed(2)} km · {(step.duration / 60).toFixed(0)} mins
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={stepCardStyle}>No step instructions available</div>
                )}
              </div>
              <button type="button" onClick={resetRoutePanel} style={{ ...secondaryButtonStyle, marginTop: 12 }}>
                Clear Route
              </button>
            </div>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredAddresses.length ? (
              filteredAddresses.map((item) => (
                <div key={item._id} style={addressCardStyle}>
                  <h3 style={{ marginTop: 0, marginBottom: 8 }}>{item.name}</h3>
                  <p style={{ marginTop: 0, color: '#475569' }}>{item.description}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {item.tags.map((tag) => (
                      <span key={tag} style={tagStyle}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={isNavigating}
                      onClick={() => handleNavigate(item)}
                      style={primaryButtonStyle}
                    >
                      {isNavigating ? 'Navigating...' : 'Navigate'}
                    </button>
                    <button type="button" onClick={() => handleEdit(item)} style={secondaryButtonStyle}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(item._id)} style={dangerButtonStyle}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={addressCardStyle}>No addresses found</div>
            )}
          </div>
        </div>
      </aside>

      <main style={{ flex: 1 }}>
        <MapContainer center={[23.1291, 113.2644]} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents onMapClick={handleMapClick} />
          <RouteViewport
            routePath={routePath}
            currentPosition={currentPosition}
            destinationPosition={activeDestination}
          />

          {currentPosition ? (
            <Marker position={currentPosition} icon={currentLocIcon}>
              <Popup>
                <strong>Your current location</strong>
              </Popup>
            </Marker>
          ) : null}

          {filteredAddresses.map((address) => {
            const position: [number, number] = [
              address.location.coordinates[1],
              address.location.coordinates[0],
            ];

            return (
              <Marker key={address._id} position={position} icon={addressIcon}>
                <Popup>
                  <strong>{address.name}</strong>
                  <br />
                  {address.description}
                  <br />
                  <button
                    type="button"
                    onClick={() => handleNavigate(address)}
                    style={{ ...primaryButtonStyle, marginTop: 8 }}
                  >
                    Navigate Here
                  </button>
                </Popup>
              </Marker>
            );
          })}

          {activeDestination ? (
            <Marker position={activeDestination} icon={destinationIcon}>
              <Popup>
                <strong>Destination</strong>
              </Popup>
            </Marker>
          ) : null}

          {routePath ? <Polyline positions={routePath} color="blue" weight={5} /> : null}
        </MapContainer>
      </main>

      {isModalVisible ? (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{editingAddress ? 'Edit Address' : 'Add Address'}</h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalVisible(false);
                  setSelectedLocation(null);
                  setEditingAddress(null);
                }}
                style={ghostButtonStyle}
              >
                Close
              </button>
            </div>
            <form onSubmit={handleAddAddress} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              <label style={labelStyle}>
                Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                  placeholder="Home, Office, School..."
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Address details or remarks"
                  style={textareaStyle}
                />
              </label>
              <label style={labelStyle}>
                Text Address
                <input
                  name="addressText"
                  value={form.addressText}
                  onChange={handleFormChange}
                  placeholder="Enter an address for automatic geocoding"
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Tags
                <input
                  name="tags"
                  value={form.tags}
                  onChange={handleFormChange}
                  placeholder="home, favorite, company"
                  style={inputStyle}
                />
              </label>
              <div style={{ color: '#64748b' }}>
                {selectedLocation
                  ? `Selected coordinates: ${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`
                  : 'No coordinates selected yet. You can still save by providing a text address.'}
              </div>
              <button type="submit" style={primaryButtonStyle}>
                Save Address
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MapPage;
