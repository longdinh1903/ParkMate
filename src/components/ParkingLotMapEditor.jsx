import React, { useState, useEffect } from "react";
import { Stage, Layer, Rect, Text, Group } from "react-konva";
import toast from "react-hot-toast";
import floorApi from "../api/floorApi";
import areaApi from "../api/areaApi";
import spotApi from "../api/spotApi";

export default function ParkingLotMapEditor({ lot, onClose }) {
  const [floors, setFloors] = useState([]);
  const [currentFloorId, setCurrentFloorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null); // { type: 'floor'|'area'|'spot', id, data }
  const [editName, setEditName] = useState("");
  const [editVehicleType, setEditVehicleType] = useState("");

  const vehicleTypes = [
    "CAR_UP_TO_9_SEATS",
    "MOTORBIKE",
    "BIKE",
    "OTHER",
  ];

  // Load data from backend
  useEffect(() => {
    const loadParkingLotData = async () => {
      try {
        setLoading(true);
        
        // 1. Load floors
        const floorsRes = await floorApi.getByLotId(lot.id);
        const floorsDataRaw = floorsRes.data?.data || floorsRes.data;

        // Normalize response: backend may return a paged object { content: [...] } or an array
        let floorsData = [];
        if (Array.isArray(floorsDataRaw)) {
          floorsData = floorsDataRaw;
        } else if (floorsDataRaw && Array.isArray(floorsDataRaw.content)) {
          floorsData = floorsDataRaw.content;
        } else {
          floorsData = [];
        }

        console.log("📥 Loaded floors (normalized):", floorsData);

        // 2. Load areas for each floor
        const floorsWithAreas = await Promise.all(
          floorsData.map(async (floor) => {
            const areasRes = await areaApi.getByFloorId(floor.id);
            const areasRaw = areasRes.data?.data || areasRes.data;

            // Normalize areas response: could be paged { content: [...] } or a plain array
            let areasData = [];
            if (Array.isArray(areasRaw)) {
              areasData = areasRaw;
            } else if (areasRaw && Array.isArray(areasRaw.content)) {
              areasData = areasRaw.content;
            } else {
              areasData = [];
            }

            console.log(`📥 Floor ${floor.floorNumber} areas (normalized):`, areasData);

            // 3. Load spots for each area
            const areasWithSpots = await Promise.all(
              areasData.map(async (area) => {
                const spotsRes = await spotApi.getByAreaId(area.id);
                const spotsRaw = spotsRes.data?.data || spotsRes.data;

                // Normalize spots response
                let spotsData = [];
                if (Array.isArray(spotsRaw)) {
                  spotsData = spotsRaw;
                } else if (spotsRaw && Array.isArray(spotsRaw.content)) {
                  spotsData = spotsRaw.content;
                } else {
                  spotsData = [];
                }

                return {
                  ...area,
                  spots: spotsData,
                };
              })
            );

            return {
              ...floor,
              areas: areasWithSpots,
            };
          })
        );

        setFloors(floorsWithAreas);
        if (floorsWithAreas.length > 0) {
          setCurrentFloorId(floorsWithAreas[0].id);
        }
        
        console.log("✅ All data loaded:", floorsWithAreas);
        toast.success("✅ Parking lot layout loaded!");
        
      } catch (err) {
        console.error("❌ Load error:", err);
        toast.error("Failed to load parking lot data");
      } finally {
        setLoading(false);
      }
    };

    loadParkingLotData();
  }, [lot.id]);

  const currentFloor = floors.find((f) => f.id === currentFloorId);
  const areas = currentFloor?.areas || [];

  const handleSelectItem = (type, id, data) => {
    setSelectedItem({ type, id, data });
    setEditName(data.name || data.floorName || "");
    setEditVehicleType(data.vehicleType || "CAR_UP_TO_9_SEATS");
  };

  const handleSave = async () => {
    if (!selectedItem) return;

    try {
      const loadingId = toast.loading("💾 Saving changes...");

      if (selectedItem.type === "floor") {
        const payload = {
          ...selectedItem.data,
          floorName: editName,
        };
        console.log("📤 Updating floor payload:", payload);
        await floorApi.update(selectedItem.id, payload);
        
        setFloors((prev) =>
          prev.map((f) =>
            f.id === selectedItem.id ? { ...f, floorName: editName } : f
          )
        );
      } else if (selectedItem.type === "area") {
        // Build a minimal payload with only fields expected by the API to avoid 400 errors
        const area = selectedItem.data;
        // Normalize vehicleType to API enum format: UPPERCASE_WITH_UNDERSCORES
        const vehicleTypeNormalized = (editVehicleType || "").toString()
          .toUpperCase()
          .trim()
          .replace(/\s+/g, "_")
          .replace(/[^A-Z0-9_]/g, "_");

        const payload = {
          name: editName,
          vehicleType: vehicleTypeNormalized,
          areaTopLeftX: Number(Math.round((area.areaTopLeftX || area.x || 0) * 100) / 100),
          areaTopLeftY: Number(Math.round((area.areaTopLeftY || area.y || 0) * 100) / 100),
          areaWidth: Number(Math.round((area.areaWidth || area.width || 0) * 100) / 100),
          areaHeight: Number(Math.round((area.areaHeight || area.height || 0) * 100) / 100),
          supportElectricVehicle: Boolean(area.supportElectricVehicle || false),
          totalSpots: Number((area.spots?.length) || area.totalSpots || 0),
        };
        console.log("📤 Updating area payload (minimal, normalized):", payload);
        await areaApi.update(selectedItem.id, payload);
        
        setFloors((prev) =>
          prev.map((f) =>
            f.id === currentFloorId
              ? {
                  ...f,
                  areas: f.areas.map((a) =>
                    a.id === selectedItem.id
                      ? { ...a, name: editName, vehicleType: editVehicleType }
                      : a
                  ),
                }
              : f
          )
        );
      } else if (selectedItem.type === "spot") {
        // Spot update payload - send only mutable fields
        const spot = selectedItem.data;
        const spotPayload = {
          name: editName,
          spotTopLeftX: Math.round(spot.spotTopLeftX || spot.x || 0),
          spotTopLeftY: Math.round(spot.spotTopLeftY || spot.y || 0),
          spotWidth: Math.round(spot.spotWidth || spot.width || 0),
          spotHeight: Math.round(spot.spotHeight || spot.height || 0),
        };
        console.log("📤 Updating spot payload (minimal):", spotPayload);
        await spotApi.update(selectedItem.id, spotPayload);
        
        setFloors((prev) =>
          prev.map((f) =>
            f.id === currentFloorId
              ? {
                  ...f,
                  areas: f.areas.map((a) => ({
                    ...a,
                    spots: a.spots.map((s) =>
                      s.id === selectedItem.id ? { ...s, name: editName } : s
                    ),
                  })),
                }
              : f
          )
        );
      }

      toast.dismiss(loadingId);
      toast.success("✅ Saved successfully!");
      setSelectedItem(null);
      
    } catch (err) {
      console.error("❌ Save error:", err);
      console.error("   Response data:", err.response?.data);
      const serverMsg = err.response?.data?.message || err.response?.data || err.message;
      toast.error(`Failed to save: ${serverMsg}`);
    }
  };

  const handleCancel = () => {
    setSelectedItem(null);
    setEditName("");
    setEditVehicleType("");
  };

  // Check if any areas still have default vehicle type
  const hasDefaultVehicleTypes = areas.some(
    (a) => a.vehicleType === "CAR_UP_TO_9_SEATS"
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading parking lot layout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex bg-white z-[60]">
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-50 to-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <i className="ri-edit-2-fill text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Edit Parking Map
              </h2>
              <p className="text-xs text-gray-500">{lot.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <i className="ri-close-line mr-2"></i>
            Close
          </button>
        </div>

        {/* Warning Banner */}
        {hasDefaultVehicleTypes && (
          <div className="bg-orange-100 border-l-4 border-orange-500 p-4 mx-4 mt-4 rounded">
            <div className="flex items-center">
              <i className="ri-alert-line text-orange-600 text-xl mr-3"></i>
              <p className="text-orange-800 font-medium">
                ⚠️ Action required: Some areas still have default vehicle types. Please update them.
              </p>
            </div>
          </div>
        )}

        {/* Floor Tabs */}
        <div className="flex items-center gap-2 p-4 border-b bg-gray-50">
          <span className="text-sm font-medium text-gray-700">Floors:</span>
          {floors.map((floor) => (
            <button
              key={floor.id}
              onClick={() => setCurrentFloorId(floor.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentFloorId === floor.id
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border"
              }`}
            >
              {floor.floorName}
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <Stage width={1200} height={800}>
            <Layer>
              {/* Grid Background */}
              <Rect
                x={0}
                y={0}
                width={1200}
                height={800}
                fill="#ffffff"
                stroke="#e5e7eb"
                strokeWidth={1}
              />

              {/* Draw Areas */}
              {areas.map((area) => {
                const isDefaultType = area.vehicleType === "CAR_UP_TO_9_SEATS";
                const typeColor = isDefaultType ? "#f97316" : "#10b981"; // orange or green
                
                return (
                  <Group
                    key={area.id}
                    onClick={() => handleSelectItem("area", area.id, area)}
                  >
                    {/* Area Rectangle */}
                    <Rect
                      x={area.areaTopLeftX}
                      y={area.areaTopLeftY}
                      width={area.areaWidth}
                      height={area.areaHeight}
                      fill="rgba(59, 130, 246, 0.1)"
                      stroke="#3b82f6"
                      strokeWidth={selectedItem?.id === area.id ? 3 : 2}
                      cornerRadius={4}
                    />

                    {/* Vehicle Type Label - Display outside above area */}
                    <Text
                      x={area.areaTopLeftX}
                      y={area.areaTopLeftY - 56}
                      text={`Type: ${area.vehicleType || "Not set"}`}
                      fontSize={11}
                      fill={typeColor}
                      fontStyle="bold"
                    />

                    {/* Area Name - Display outside above area */}
                    <Text
                      x={area.areaTopLeftX}
                      y={area.areaTopLeftY - 38}
                      text={`${area.name} (${area.spots?.length || 0} spots)`}
                      fontSize={12}
                      fill="#2563eb"
                      fontStyle="bold"
                    />

                    {/* Area dimensions - Display outside above area, below name */}
                    <Text
                      x={area.areaTopLeftX}
                      y={area.areaTopLeftY - 22}
                      text={`Size: ${Math.round(area.areaWidth)} × ${Math.round(area.areaHeight)}`}
                      fontSize={10}
                      fill="#64748b"
                      fontStyle="normal"
                    />

                    {/* Draw Spots */}
                    {area.spots?.map((spot) => (
                      <Group
                        key={spot.id}
                        onClick={(e) => {
                          e.cancelBubble = true;
                          handleSelectItem("spot", spot.id, spot);
                        }}
                      >
                        <Rect
                          x={area.areaTopLeftX + spot.spotTopLeftX}
                          y={area.areaTopLeftY + spot.spotTopLeftY}
                          width={spot.spotWidth}
                          height={spot.spotHeight}
                          fill="rgba(34, 197, 94, 0.2)"
                          stroke="#22c55e"
                          strokeWidth={selectedItem?.id === spot.id ? 2 : 1}
                          cornerRadius={2}
                        />
                        <Text
                          x={area.areaTopLeftX + spot.spotTopLeftX + spot.spotWidth / 2}
                          y={area.areaTopLeftY + spot.spotTopLeftY + spot.spotHeight / 2}
                          text={spot.name.split('-S')[1] || spot.name.substring(spot.name.length - 2)}
                          fontSize={9}
                          fill="#166534"
                          fontStyle="bold"
                          align="center"
                          verticalAlign="middle"
                          offsetX={10}
                          offsetY={5}
                        />
                      </Group>
                    ))}
                  </Group>
                );
              })}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Right Panel - Edit Form */}
      <div className="w-96 border-l bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b bg-gradient-to-r from-green-50 to-white">
          <h3 className="text-lg font-bold text-gray-900">
            {selectedItem ? "Edit Details" : "Parking Lot Info"}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {selectedItem ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-900 font-medium capitalize">
                  {selectedItem.type}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter name"
                />
              </div>

              {selectedItem.type === "area" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editVehicleType}
                    onChange={(e) => setEditVehicleType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {vehicleTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    💡 This determines what vehicle types can park in this area
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <i className="ri-save-line mr-2"></i>
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  <i className="ri-information-line mr-2 text-blue-600"></i>
                  Click on any Floor, Area, or Spot to edit its details.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    Total Floors:
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {floors.length}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    Total Areas:
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {floors.reduce((sum, f) => sum + f.areas.length, 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    Total Spots:
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {floors.reduce(
                      (sum, f) =>
                        sum +
                        f.areas.reduce((aSum, a) => aSum + (a.spots?.length || 0), 0),
                      0
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
