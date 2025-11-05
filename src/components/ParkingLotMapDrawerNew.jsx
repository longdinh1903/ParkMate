import React, { useState, useRef, useCallback, useEffect } from "react";
import { Stage, Layer, Rect, Text, Group, Line, Transformer } from "react-konva";
import toast from "react-hot-toast";
import floorApi from "../api/floorApi";
import areaApi from "../api/areaApi";

export default function ParkingLotMapDrawer({ lot, onClose }) {
  const [currentFloor, setCurrentFloor] = useState(1);
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if lot is in PREPARING or MAP_DENIED status (allow drawing in these statuses)
  const canEdit = ["PREPARING", "MAP_DENIED"].includes(
    (lot.mapStatus || lot.status || "").toUpperCase()
  );

  const [mode, setMode] = useState("draw"); // "draw" | "erase" | "area"
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [selectedSpotId, setSelectedSpotId] = useState(null);
  const [bulkSpotCount, setBulkSpotCount] = useState("");
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState("#1e3a8a");
  const [eraseSize, setEraseSize] = useState(20);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySourceFloor, setCopySourceFloor] = useState(null);

  const isDrawing = useRef(false);
  const isCreatingArea = useRef(false);
  const areaStartPos = useRef(null);
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const selectedAreaRef = useRef(null);

  // Load existing floors from database
  useEffect(() => {
    const loadExistingFloors = async () => {
      try {
        setLoading(true);
        console.log("🔍 Loading existing floors for lot:", lot.id);
        
        const floorsRes = await floorApi.getByLotId(lot.id);
        const floorsDataRaw = floorsRes.data?.data || floorsRes.data;

        // Normalize response
        let floorsData = [];
        if (Array.isArray(floorsDataRaw)) {
          floorsData = floorsDataRaw;
        } else if (floorsDataRaw && Array.isArray(floorsDataRaw.content)) {
          floorsData = floorsDataRaw.content;
        }

        console.log("📥 Loaded existing floors:", floorsData);

        if (floorsData.length > 0) {
          // Create floor list with existing floors (areas will be empty for drawing)
          const existingFloors = floorsData.map(floor => ({
            floorNumber: floor.floorNumber,
            floorName: floor.floorName || `Floor ${floor.floorNumber}`,
            areas: [],
            strokes: [],
            existsInDb: true, // Mark as existing
            dbId: floor.id,
          }));

          // Add missing floors up to totalFloors
          const maxFloorNumber = Math.max(...floorsData.map(f => f.floorNumber));
          const totalFloors = lot.totalFloors || maxFloorNumber;
          
          for (let i = 1; i <= totalFloors; i++) {
            if (!existingFloors.find(f => f.floorNumber === i)) {
              existingFloors.push({
                floorNumber: i,
                floorName: `Floor ${i}`,
                areas: [],
                strokes: [],
                existsInDb: false,
              });
            }
          }

          // Sort by floor number
          existingFloors.sort((a, b) => a.floorNumber - b.floorNumber);

          setFloors(existingFloors);
          
          // Set current floor to first UNDRAWN floor, or first floor if all drawn
          const firstUndrawnFloor = existingFloors.find(f => !f.existsInDb);
          setCurrentFloor(firstUndrawnFloor ? firstUndrawnFloor.floorNumber : existingFloors[0].floorNumber);
          
          console.log("✅ Initialized floors:", existingFloors);
          console.log("📍 Current floor set to:", firstUndrawnFloor ? `Floor ${firstUndrawnFloor.floorNumber} (undrawn)` : `Floor ${existingFloors[0].floorNumber} (all drawn)`);
          // No toast needed - loading spinner already shows floors are loading
        } else {
          // No existing floors, start with Floor 1
          setFloors([
            {
              floorNumber: 1,
              floorName: "Floor 1",
              areas: [],
              strokes: [],
              existsInDb: false,
            },
          ]);
          setCurrentFloor(1);
          console.log("ℹ️ No existing floors, starting fresh");
        }
      } catch (err) {
        console.error("❌ Error loading floors:", err);
        // Start with Floor 1 on error
        setFloors([
          {
            floorNumber: 1,
            floorName: "Floor 1",
            areas: [],
            strokes: [],
            existsInDb: false,
          },
        ]);
        setCurrentFloor(1);
      } finally {
        setLoading(false);
      }
    };

    loadExistingFloors();
  }, [lot.id, lot.totalFloors]);

  // Get current floor data
  const currentFloorData =
    floors.find((f) => f.floorNumber === currentFloor) || floors[0];
  const areas = currentFloorData?.areas || [];
  const strokes = currentFloorData?.strokes || [];

  // Update current floor
  const updateCurrentFloor = useCallback(
    (updates) => {
      setFloors((prev) =>
        prev.map((f) =>
          f.floorNumber === currentFloor ? { ...f, ...updates } : f
        )
      );
    },
    [currentFloor]
  );

  // ===== DRAWING FUNCTIONS =====

  const handleMouseDown = (e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const targetClass = e.target.getClassName();
    
    // Chỉ chặn khi click vào Area/Spot rectangles, không chặn Background
    const clickedOnShape = 
      (targetClass === "Rect" && e.target.attrs.fill !== "#ffffff") ||
      targetClass === "Text" ||
      targetClass === "Group";

    if (mode === "draw") {
      if (clickedOnShape) return;
      isDrawing.current = true;

      setFloors((prev) =>
        prev.map((f) =>
          f.floorNumber === currentFloor
            ? {
                ...f,
                strokes: [
                  ...f.strokes,
                  {
                    id: Date.now().toString(),
                    points: [pos.x, pos.y],
                    stroke: brushColor,
                    strokeWidth: brushSize,
                    tension: 0.5,
                    lineCap: "round",
                    lineJoin: "round",
                  },
                ],
              }
            : f
        )
      );
    } else if (mode === "erase") {
      if (clickedOnShape) return;
      isDrawing.current = true;
      // Erasing will happen in handleMouseMove
    } else if (mode === "area") {
      if (clickedOnShape) {
        console.log("Clicked on shape, not creating area");
        return;
      }
      console.log("Starting area creation at:", pos);
      isCreatingArea.current = true;
      areaStartPos.current = pos;
    }
  };

  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return; // Safety check

    // 🖌 Draw mode
    if (mode === "draw" && isDrawing.current) {
      setFloors((prev) =>
        prev.map((f) => {
          if (f.floorNumber !== currentFloor) return f;
          const strokes = f.strokes;
          if (strokes.length === 0) return f;

          const last = strokes[strokes.length - 1];
          const updated = {
            ...last,
            points: [...last.points, point.x, point.y],
          };

          return { ...f, strokes: [...strokes.slice(0, -1), updated] };
        })
      );
    }

    // 🧹 Erase mode
    if (mode === "erase" && isDrawing.current) {
      setFloors((prev) =>
        prev.map((f) => {
          if (f.floorNumber !== currentFloor) return f;
          
          // Filter out strokes that intersect with erase position
          const filteredStrokes = f.strokes.filter((stroke) => {
            const points = stroke.points;
            for (let i = 0; i < points.length; i += 2) {
              const x = points[i];
              const y = points[i + 1];
              const distance = Math.sqrt(
                Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)
              );
              if (distance < eraseSize) {
                return false; // Remove this stroke
              }
            }
            return true; // Keep this stroke
          });

          return { ...f, strokes: filteredStrokes };
        })
      );
    }

    // 🟦 Area mode (preview rectangle)
    if (
      mode === "area" &&
      isCreatingArea.current &&
      areaStartPos.current
    ) {
      console.log("Moving mouse while creating area:", point);
      const width = point.x - areaStartPos.current.x;
      const height = point.y - areaStartPos.current.y;
      const tempId = "temp-area";

      setFloors((prev) =>
        prev.map((f) => {
          if (f.floorNumber !== currentFloor) return f;
          const hasTemp = f.areas.some((a) => a.id === tempId);
          const newArea = {
            id: tempId,
            name: "Drawing...",
            x: areaStartPos.current.x,
            y: areaStartPos.current.y,
            width: Math.abs(width),
            height: Math.abs(height),
            spots: [],
            fill: "rgba(147,197,253,0.2)",
            stroke: "#3b82f6",
          };
          return {
            ...f,
            areas: hasTemp
              ? f.areas.map((a) => (a.id === tempId ? newArea : a))
              : [...f.areas, newArea],
          };
        })
      );
    }
  };

  const handleMouseUp = (e) => {
    if (mode === "draw") {
      isDrawing.current = false;
      return;
    }

    if (mode === "area" && isCreatingArea.current && areaStartPos.current) {
      console.log("Mouse up in area mode");
      isCreatingArea.current = false;
      const stage = e.target.getStage();
      const point = stage.getPointerPosition();
      console.log("Final point:", point);
      
      // Lưu giá trị startPos vào biến local trước khi xóa ref
      const startX = areaStartPos.current.x;
      const startY = areaStartPos.current.y;
      
      if (!point) {
        // Nếu không có point, xóa temp area
        setFloors((prev) =>
          prev.map((f) =>
            f.floorNumber === currentFloor
              ? { ...f, areas: f.areas.filter((a) => a.id !== "temp-area") }
              : f
          )
        );
        areaStartPos.current = null;
        return;
      }

      const width = point.x - startX;
      const height = point.y - startY;

      setFloors((prev) =>
        prev.map((f) => {
          if (f.floorNumber !== currentFloor) return f;
          const filtered = f.areas.filter((a) => a.id !== "temp-area");

          if (Math.abs(width) > 30 && Math.abs(height) > 30) {
            const newArea = {
              id: Date.now().toString(),
              name: `Area ${filtered.length + 1}`,
              x: startX,
              y: startY,
              width: Math.abs(width),
              height: Math.abs(height),
              spots: [],
              fill: "rgba(147,197,253,0.3)",
              stroke: "#3b82f6",
            };
            // Area created - no toast needed, visual feedback is enough
            return { ...f, areas: [...filtered, newArea] };
          } else {
            toast.error("⚠️ Area too small!");
            return { ...f, areas: filtered };
          }
        })
      );

      areaStartPos.current = null;
    }
  };

  // ===== AREA MANAGEMENT =====

  const handleAddSpotToArea = () => {
    if (!selectedAreaId) {
      toast.error("⚠️ Please select an area first!");
      return;
    }

    const selectedArea = areas.find((a) => a.id === selectedAreaId);
    if (!selectedArea) {
      toast.error("⚠️ Selected area not found!");
      return;
    }

    // Đảm bảo spots array tồn tại
    if (!selectedArea.spots) {
      selectedArea.spots = [];
    }

    // Tạo spot mới trong area
    const spotWidth = 40;
    const spotHeight = 60;
    const spotsPerRow = Math.floor(selectedArea.width / (spotWidth + 10));
    const existingSpots = selectedArea.spots.length;
    const row = Math.floor(existingSpots / spotsPerRow);
    const col = existingSpots % spotsPerRow;

    const newSpot = {
      id: Date.now().toString(),
      name: `${selectedArea.name}-S${existingSpots + 1}`,
      x: col * (spotWidth + 10) + 5,
      y: row * (spotHeight + 10) + 5,
      width: spotWidth,
      height: spotHeight,
      fill: "rgba(34,197,94,0.3)",
      stroke: "#16a34a",
    };

    updateCurrentFloor({
      areas: areas.map((a) =>
        a.id === selectedAreaId 
          ? { ...a, spots: [...(a.spots || []), newSpot] } 
          : a
      ),
    });

    // Removed toast to avoid spam when adding multiple spots
  };

  // Bulk add spots
  const handleBulkAddSpots = () => {
    if (!selectedAreaId) {
      toast.error("⚠️ Please select an area first!");
      return;
    }

    const count = parseInt(bulkSpotCount);
    if (!count || count < 1) {
      toast.error("⚠️ Please enter a valid number of spots!");
      return;
    }

    const selectedArea = areas.find((a) => a.id === selectedAreaId);
    if (!selectedArea) {
      toast.error("⚠️ Selected area not found!");
      return;
    }

    // Đảm bảo spots array tồn tại
    if (!selectedArea.spots) {
      selectedArea.spots = [];
    }

    const spotWidth = 40;
    const spotHeight = 60;
    const spotsPerRow = Math.floor(selectedArea.width / (spotWidth + 10));
    const existingSpots = selectedArea.spots.length;

    const newSpots = [];
    for (let i = 0; i < count; i++) {
      const spotIndex = existingSpots + i;
      const row = Math.floor(spotIndex / spotsPerRow);
      const col = spotIndex % spotsPerRow;

      newSpots.push({
        id: `${Date.now()}-${i}`,
        name: `${selectedArea.name}-S${spotIndex + 1}`,
        x: col * (spotWidth + 10) + 5,
        y: row * (spotHeight + 10) + 5,
        width: spotWidth,
        height: spotHeight,
        fill: "rgba(34,197,94,0.3)",
        stroke: "#16a34a",
      });
    }

    updateCurrentFloor({
      areas: areas.map((a) =>
        a.id === selectedAreaId 
          ? { ...a, spots: [...(a.spots || []), ...newSpots] } 
          : a
      ),
    });

    toast.success(`✅ Added ${count} spots to ${selectedArea.name}!`);
    setBulkSpotCount(""); // Reset to empty
  };

  const handleDeleteArea = () => {
    if (!selectedAreaId) {
      toast.error("⚠️ Please select an area to delete!");
      return;
    }

    const areaName = areas.find(a => a.id === selectedAreaId)?.name;
    updateCurrentFloor({
      areas: areas.filter((a) => a.id !== selectedAreaId),
    });
    setSelectedAreaId(null);
    setSelectedSpotId(null);
    toast.success(`🗑 Deleted ${areaName}!`);
  };

  const handleDeleteSpot = () => {
    if (!selectedSpotId || !selectedAreaId) {
      toast.error("⚠️ Please select a spot to delete!");
      return;
    }

    const area = areas.find(a => a.id === selectedAreaId);
    const spotName = area?.spots.find(s => s.id === selectedSpotId)?.name;

    updateCurrentFloor({
      areas: areas.map((a) =>
        a.id === selectedAreaId
          ? { ...a, spots: a.spots.filter((s) => s.id !== selectedSpotId) }
          : a
      ),
    });
    setSelectedSpotId(null);
    toast.success(`🗑 Deleted ${spotName}!`);
  };

  const handleClearAll = () => {
    if (strokes.length === 0 && areas.length === 0) {
      // Nothing to clear - no notification needed
      return;
    }

    updateCurrentFloor({
      strokes: [],
      areas: [],
    });
    setSelectedAreaId(null);
    setSelectedSpotId(null);
    toast.success("🧹 Floor cleared!");
  };

  // ===== KEYBOARD SHORTCUTS =====
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (mode === "area") {
          if (selectedSpotId) {
            handleDeleteSpot();
          } else if (selectedAreaId) {
            handleDeleteArea();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedAreaId, selectedSpotId]);

  // ===== FLOOR MANAGEMENT =====

  const handleAddFloor = () => {
    const maxFloorNumber = Math.max(...floors.map(f => f.floorNumber));
    const newFloorNumber = maxFloorNumber + 1;
    
    // Check if exceeds total floors
    if (lot.totalFloors && newFloorNumber > lot.totalFloors) {
      toast.error(`⚠️ Cannot add more than ${lot.totalFloors} floors!`);
      return;
    }
    
    setFloors([
      ...floors,
      {
        floorNumber: newFloorNumber,
        floorName: `Floor ${newFloorNumber}`,
        areas: [],
        strokes: [],
        existsInDb: false,
      },
    ]);
    setCurrentFloor(newFloorNumber);
    // Floor added - no toast needed, dropdown shows new floor
  };

  const handleDeleteFloor = () => {
    if (floors.length === 1) {
      toast.error("⚠️ Cannot delete the last floor!");
      return;
    }

    const floorToDelete = floors.find(f => f.floorNumber === currentFloor);
    
    // If floor exists in DB, warn user
    if (floorToDelete?.existsInDb) {
      toast.error("⚠️ Cannot delete floor that already exists in database!");
      return;
    }

    setFloors(floors.filter((f) => f.floorNumber !== currentFloor));
    
    // Set to first available floor
    const remainingFloors = floors.filter((f) => f.floorNumber !== currentFloor);
    setCurrentFloor(remainingFloors[0].floorNumber);
    
    toast.success(`🗑 Floor ${currentFloor} deleted!`);
  };

  // ===== COPY FLOOR FUNCTION =====

  const handleCopyFloor = () => {
    setShowCopyModal(true);
  };

  const handleConfirmCopy = () => {
    if (!copySourceFloor) {
      toast.error("⚠️ Please select a floor to copy from!");
      return;
    }

    const sourceFloorData = floors.find(f => f.floorNumber === copySourceFloor);
    if (!sourceFloorData) {
      toast.error("⚠️ Source floor not found!");
      return;
    }

    if (sourceFloorData.areas.length === 0) {
      toast.error("⚠️ Source floor has no areas to copy!");
      return;
    }

    // Deep copy areas and spots with new IDs
    const copiedAreas = sourceFloorData.areas.map(area => ({
      ...area,
      id: Date.now().toString() + Math.random(), // New unique ID
      spots: area.spots.map(spot => ({
        ...spot,
        id: Date.now().toString() + Math.random(), // New unique ID
      })),
    }));

    // Update current floor with copied data
    updateCurrentFloor({
      areas: copiedAreas,
      strokes: [], // Don't copy strokes, only areas/spots
    });

    setShowCopyModal(false);
    setCopySourceFloor(null);
    toast.success(`✅ Copied ${copiedAreas.length} areas from Floor ${copySourceFloor}!`);
  };

  const handleCancelCopy = () => {
    setShowCopyModal(false);
    setCopySourceFloor(null);
  };

  // ===== SAVE TO DATABASE =====

  const handleSaveLayout = async () => {
    try {
      // Validation
      if (floors.length === 0) {
        toast.error("⚠️ No floors to save!");
        return;
      }

      // Only save floors that have areas (new drawings)
      const floorsToSave = floors.filter(f => f.areas.length > 0);
      
      if (floorsToSave.length === 0) {
        toast.error("⚠️ Please create at least one area before saving!");
        return;
      }

      const loadingId = toast.loading("💾 Saving parking lot layout...");

      console.log("🚀 Starting save for lot:", lot.id);
      console.log("📦 Total floors to save:", floorsToSave.length);

      // Lưu từng floor
      for (const floor of floorsToSave) {
        console.log(`\n🏢 Saving Floor ${floor.floorNumber}...`);
        
        // Skip if floor already exists in database
        if (floor.existsInDb) {
          console.log(`⚠️ Floor ${floor.floorNumber} already exists in DB (ID: ${floor.dbId}), skipping floor creation...`);
          
          // Use existing floor ID to save areas
          const floorId = floor.dbId;
          
          // Lưu các areas mới
          if (floor.areas.length > 0) {
            console.log(`📍 Saving ${floor.areas.length} NEW areas for existing floor ${floorId}...`);
            
            for (const area of floor.areas) {
              const areaPayload = {
                name: area.name,
                vehicleType: "CAR_UP_TO_9_SEATS",
                areaTopLeftX: Math.round(area.x),
                areaTopLeftY: Math.round(area.y),
                areaWidth: Math.round(area.width),
                areaHeight: Math.round(area.height),
                supportElectricVehicle: false,
                totalSpots: area.spots?.length || 0,
                spotRequests: (area.spots || []).map((s) => ({
                  name: s.name,
                  spotTopLeftX: Math.round(s.x),
                  spotTopLeftY: Math.round(s.y),
                  spotWidth: Math.round(s.width),
                  spotHeight: Math.round(s.height),
                })),
              };

              try {
                const areaRes = await areaApi.create(floorId, areaPayload);
                console.log(`✅ Area "${area.name}" created:`, areaRes.data);
              } catch (areaError) {
                console.error(`❌ Area "${area.name}" failed:`, areaError);
                throw new Error(`Failed to create area "${area.name}": ${areaError.response?.data?.message || areaError.message}`);
              }
            }
          }
          
          console.log(`✅ Floor ${floor.floorNumber} completed (existing floor, added areas)!`);
          continue;
        }
        
        // Create new floor if it doesn't exist in DB
        const floorPayload = {
          floorNumber: floor.floorNumber,
          floorName: floor.floorName,
          capacityRequests: [
            {
              capacity: floor.areas.reduce((sum, a) => sum + (a.spots?.length || 0), 0) || 1,
              vehicleType: "CAR_UP_TO_9_SEATS",
              supportElectricVehicle: false,
            },
          ],
        };

        console.log("📤 Creating NEW floor payload:", JSON.stringify(floorPayload, null, 2));
        console.log("📍 Endpoint:", `/api/v1/parking-service/floors/${lot.id}`);

        const floorRes = await floorApi.create(lot.id, floorPayload);
        console.log("✅ Floor response:", floorRes.data);

        // Extract floor ID with multiple fallbacks
        const floorId = floorRes.data?.data?.id || floorRes.data?.id || floorRes.data?.floorId;
        
        if (!floorId) {
          console.error("❌ No floor ID in response:", floorRes.data);
          throw new Error(`Floor ${floor.floorNumber} creation failed - no ID returned`);
        }

        console.log(`✅ Floor ${floor.floorNumber} created with ID: ${floorId}`);

        // Lưu các areas CHỈ với tọa độ layout
        // Partner sẽ đặt tên và chọn vehicleType sau
        if (floor.areas.length > 0) {
          console.log(`📍 Saving ${floor.areas.length} areas for floor ${floorId}...`);
          
          for (const area of floor.areas) {
            const areaPayload = {
              name: area.name, // Tên tạm: "Area 1", "Area 2"...
              vehicleType: "CAR_UP_TO_9_SEATS", // ⚠️ Temporary - REQUIRED by API
              areaTopLeftX: Math.round(area.x),
              areaTopLeftY: Math.round(area.y),
              areaWidth: Math.round(area.width),
              areaHeight: Math.round(area.height),
              supportElectricVehicle: false,
              totalSpots: area.spots?.length || 0,
              spotRequests: (area.spots || []).map((s) => ({
                name: s.name, // Tên tạm: "Area 1-S1"...
                spotTopLeftX: Math.round(s.x),
                spotTopLeftY: Math.round(s.y),
                spotWidth: Math.round(s.width),
                spotHeight: Math.round(s.height),
              })),
            };

            console.log(`📤 Area "${area.name}":`, JSON.stringify(areaPayload, null, 2));
            console.log(`   ⚠️ Note: vehicleType is temporary - Partner will update later`);

            try {
              const areaRes = await areaApi.create(floorId, areaPayload);
              console.log(`✅ Area "${area.name}" created:`, areaRes.data);
              
              const areaId = areaRes.data?.data?.id || areaRes.data?.id;
              console.log(`   Area ID: ${areaId}, Spots: ${area.spots?.length || 0}`);
            } catch (areaError) {
              console.error(`❌ Area "${area.name}" failed:`, areaError);
              console.error("   Error response:", areaError.response?.data);
              throw new Error(`Failed to create area "${area.name}": ${areaError.response?.data?.message || areaError.message}`);
            }
          }
        } else {
          console.log(`⚠️ Floor ${floor.floorNumber} has no areas, skipping...`);
        }

        // Note about strokes
        if (floor.strokes?.length > 0) {
          console.log(`ℹ️ Note: ${floor.strokes.length} drawing strokes exist but not saved (drawings are visual only)`);
        }

        console.log(`✅ Floor ${floor.floorNumber} completed!`);
      }

      toast.dismiss(loadingId);
      toast.success("🎉 Layout saved successfully!");
      console.log("✅ All floors, areas, and spots saved successfully!");
      
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err) {
      toast.dismiss();
      console.error("❌ Save layout error:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      
      const errorMsg = err.response?.data?.message || err.message || "Unknown error";
      toast.error(`❌ Failed to save: ${errorMsg}`);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-[60]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading floors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white z-[60]">
      {/* Check if lot is not in PREPARING status */}
      {!canEdit ? (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-lock-fill text-amber-600 text-5xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Map Editing Locked</h3>
            <p className="text-gray-600 mb-2">
              This parking lot is in <span className="font-semibold text-amber-600">{lot.mapStatus || lot.status}</span> status.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Map editing is only available when status is <span className="font-semibold text-green-600">PREPARING</span> or <span className="font-semibold text-amber-600">MAP_DENIED</span>.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium shadow-md hover:shadow-lg transition-all"
            >
              <i className="ri-close-line mr-2"></i>
              Close
            </button>
          </div>
        </div>
      ) : floors.every(f => f.existsInDb) ? (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
          <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-checkbox-circle-fill text-green-600 text-5xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">All Floors Completed! 🎉</h3>
            <p className="text-gray-600 mb-6">
              You have successfully drawn all {floors.length} floors for <span className="font-semibold">{lot.name}</span>.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-md hover:shadow-lg transition-all"
            >
              <i className="ri-close-line mr-2"></i>
              Close Editor
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-50 to-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <i className="ri-map-2-fill text-white text-xl"></i>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Draw Parking Map
                </h2>
                <p className="text-xs text-gray-500">{lot.name}</p>
              </div>
            </div>

        <div className="flex items-center gap-3">
          {/* Floor Navigation - Only show undrawn floors */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2">
            <span className="text-sm font-medium text-gray-700 flex-shrink-0">Floor:</span>
            <select
              value={currentFloor}
              onChange={(e) => setCurrentFloor(Number(e.target.value))}
              className="px-3 py-1 rounded-md text-sm font-medium bg-white text-gray-900 border border-gray-300 cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {floors.filter(f => !f.existsInDb).map((f) => (
                <option key={f.floorNumber} value={f.floorNumber}>
                  Floor {f.floorNumber}
                </option>
              ))}
            </select>
            {/* Only show Add button if haven't reached total floors */}
            {(!lot.totalFloors || floors.length < lot.totalFloors) && (
              <button
                onClick={handleAddFloor}
                className="px-3 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 text-sm font-medium flex items-center gap-1 flex-shrink-0"
              >
                <i className="ri-add-line"></i>
                Add
              </button>
            )}
            {floors.filter(f => !f.existsInDb).length > 1 && (
              <button
                onClick={handleDeleteFloor}
                className="px-3 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 text-sm flex-shrink-0"
                title="Delete Current Floor"
              >
                <i className="ri-delete-bin-line"></i>
              </button>
            )}
            {/* Copy Floor Button */}
            {floors.length > 1 && (
              <button
                onClick={handleCopyFloor}
                className="px-3 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm font-medium flex items-center gap-1 flex-shrink-0"
                title="Copy from another floor"
              >
                <i className="ri-file-copy-line"></i>
                Copy
              </button>
            )}
          </div>

          {/* Tools */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setMode("draw")}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                mode === "draw"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-transparent text-gray-700 hover:bg-gray-100"
              }`}
            >
              <i className="ri-pencil-fill"></i>
              Draw
            </button>
            <button
              onClick={() => setMode("erase")}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                mode === "erase"
                  ? "bg-orange-600 text-white shadow-md"
                  : "bg-transparent text-gray-700 hover:bg-gray-100"
              }`}
            >
              <i className="ri-eraser-fill"></i>
              Erase
            </button>
            <button
              onClick={() => setMode("area")}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                mode === "area"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-transparent text-gray-700 hover:bg-gray-100"
              }`}
            >
              <i className="ri-layout-grid-fill"></i>
              Area
            </button>
          </div>

          {/* Brush Settings */}
          {mode === "draw" && (
            <>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                <i className="ri-brush-fill text-gray-600"></i>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-20 accent-indigo-600"
                />
                <span className="text-xs font-medium text-gray-700 w-4">
                  {brushSize}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-10 h-8 border-0 rounded cursor-pointer"
                />
              </div>
            </>
          )}

          {/* Eraser Settings */}
          {mode === "erase" && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <i className="ri-eraser-fill text-orange-600"></i>
              <input
                type="range"
                min="10"
                max="50"
                value={eraseSize}
                onChange={(e) => setEraseSize(Number(e.target.value))}
                className="w-20 accent-orange-600"
              />
              <span className="text-xs font-medium text-gray-700 w-6">
                {eraseSize}
              </span>
            </div>
          )}

          {/* Area Actions */}
          {mode === "area" && (
            <>
              <button
                onClick={handleAddSpotToArea}
                className="px-4 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-all font-medium flex items-center gap-2"
                disabled={!selectedAreaId}
              >
                <i className="ri-parking-box-fill"></i>
                Add 1 Spot
              </button>

              {/* Bulk Add Spots */}
              {selectedAreaId && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={bulkSpotCount}
                    onChange={(e) => setBulkSpotCount(e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Qty"
                  />
                  <button
                    onClick={handleBulkAddSpots}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all font-medium flex items-center gap-2"
                  >
                    <i className="ri-add-circle-fill"></i>
                    Add Multiple
                  </button>
                </div>
              )}
              
              {/* Smart Delete Button */}
              {selectedSpotId ? (
                <button
                  onClick={handleDeleteSpot}
                  className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-all font-medium flex items-center gap-2"
                >
                  <i className="ri-delete-bin-fill"></i>
                  Delete Spot
                </button>
              ) : selectedAreaId ? (
                <button
                  onClick={handleDeleteArea}
                  className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-all font-medium flex items-center gap-2"
                >
                  <i className="ri-delete-bin-fill"></i>
                  Delete Area
                </button>
              ) : (
                <button
                  disabled
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed transition-all font-medium flex items-center gap-2"
                >
                  <i className="ri-delete-bin-fill"></i>
                  Delete
                </button>
              )}
            </>
          )}

          {/* General Actions */}
          <button
            onClick={handleClearAll}
            className="px-4 py-2 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-all font-medium flex items-center gap-2"
          >
            <i className="ri-eraser-fill"></i>
            Clear Floor
          </button>

          <button
            onClick={handleSaveLayout}
            className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all font-medium shadow-md flex items-center gap-2"
          >
            <i className="ri-save-fill"></i>
            Save Layout
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all font-medium flex items-center gap-2"
          >
            <i className="ri-close-line"></i>
            Close
          </button>
        </div>
      </div>

      {/* Info Panel */}
      <div className="px-4 py-2 bg-blue-50 border-b flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">Mode:</span>
            <span className={`px-2 py-0.5 rounded ${
              mode === "draw" 
                ? "bg-indigo-100 text-indigo-700" 
                : mode === "erase"
                ? "bg-orange-100 text-orange-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {mode === "draw" ? "✏️ Drawing" : mode === "erase" ? "🧹 Erasing" : "⬛ Creating Areas"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">Current Floor:</span>
            <span className="text-gray-900">{currentFloorData?.floorName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">Areas:</span>
            <span className="text-gray-900">{areas.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">Total Spots:</span>
            <span className="text-gray-900">
              {areas.reduce((sum, a) => sum + a.spots.length, 0)}
            </span>
          </div>
          {selectedSpotId && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Selected:</span>
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                🚗 {areas.find(a => a.id === selectedAreaId)?.spots.find(s => s.id === selectedSpotId)?.name || 'Spot'}
              </span>
            </div>
          )}
        </div>
        <div className="text-xs text-gray-600">
          {mode === "draw"
            ? "🖱️ Click and drag to draw lines"
            : mode === "erase"
            ? "🧹 Click and drag to erase drawing strokes"
            : selectedSpotId
            ? "🚗 Drag to move • Press Delete to remove spot"
            : selectedAreaId
            ? "📍 Drag to move • Resize corners • Press Delete to remove area"
            : "🖱️ Click and drag to create/move areas • Click spots to select them"}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-gray-100 relative overflow-hidden">
        <Stage
          ref={stageRef}
          width={window.innerWidth}
          height={window.innerHeight - 160}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          className={
            mode === "draw" 
              ? "cursor-crosshair" 
              : mode === "erase"
              ? "cursor-not-allowed"
              : "cursor-cell"
          }
        >
          <Layer>
            {/* Background */}
            <Rect
              x={0}
              y={0}
              width={window.innerWidth}
              height={window.innerHeight - 160}
              fill="#ffffff"
              onClick={() => {
                // Deselect when clicking on background in area mode
                if (mode === "area") {
                  setSelectedAreaId(null);
                  setSelectedSpotId(null);
                }
              }}
            />

            {/* Grid */}
            {Array.from({ length: 50 }).map((_, i) => (
              <React.Fragment key={`grid-${i}`}>
                <Line
                  points={[i * 50, 0, i * 50, window.innerHeight - 160]}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                />
                <Line
                  points={[0, i * 50, window.innerWidth, i * 50]}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                />
              </React.Fragment>
            ))}

            {/* Drawing Strokes */}
            {strokes.map((s) => (
              <Line
                key={s.id}
                points={s.points}
                stroke={s.stroke}
                strokeWidth={s.strokeWidth}
                tension={s.tension}
                lineCap={s.lineCap}
                lineJoin={s.lineJoin}
              />
            ))}

            {/* Areas */}
            {areas.filter(a => a && a.x != null && a.y != null).map((area) => (
              <Group key={area.id}>
                <Rect
                  id={area.id}
                  ref={(node) => {
                    if (selectedAreaId === area.id) {
                      selectedAreaRef.current = node;
                      if (transformerRef.current && node) {
                        transformerRef.current.nodes([node]);
                        transformerRef.current.getLayer()?.batchDraw();
                      }
                    }
                  }}
                  x={area.x}
                  y={area.y}
                  width={area.width}
                  height={area.height}
                  fill={area.fill}
                  stroke={selectedAreaId === area.id ? "#ef4444" : area.stroke}
                  strokeWidth={selectedAreaId === area.id ? 3 : 2}
                  onClick={() => {
                    if (mode === "area") {
                      setSelectedAreaId(area.id);
                      setSelectedSpotId(null); // Deselect spot when selecting area
                      toast(`✅ Selected: ${area.name}`);
                    }
                  }}
                  draggable={mode === "area"}
                  onDragMove={(e) => {
                    e.cancelBubble = true;
                  }}
                  onDragEnd={(e) => {
                    const newX = e.target.x();
                    const newY = e.target.y();
                    
                    updateCurrentFloor({
                      areas: areas.map((a) =>
                        a.id === area.id
                          ? { ...a, x: newX, y: newY }
                          : a
                      ),
                    });
                    
                    // Removed toast to avoid spam when dragging
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();

                    // Reset scale
                    node.scaleX(1);
                    node.scaleY(1);

                    updateCurrentFloor({
                      areas: areas.map((a) =>
                        a.id === area.id
                          ? {
                              ...a,
                              x: node.x(),
                              y: node.y(),
                              width: Math.max(50, node.width() * scaleX),
                              height: Math.max(50, node.height() * scaleY),
                            }
                          : a
                      ),
                    });
                    
                    toast.success(`📐 Resized ${area.name}`);
                  }}
                />
                <Text
                  x={area.x}
                  y={area.y - 20}
                  text={`${area.name} (${area.spots?.length || 0} spots)`}
                  fontSize={12}
                  fill="#2563eb"
                  fontStyle="bold"
                />
                {/* Display area dimensions */}
                <Text
                  x={area.x + 5}
                  y={area.y + 5}
                  text={`${Math.round(area.width)} × ${Math.round(area.height)}`}
                  fontSize={11}
                  fill="#1e40af"
                  fontStyle="bold"
                  opacity={0.8}
                />

                {/* Spots inside area */}
                {(area.spots || []).map((spot) => (
                  <Group key={spot.id}>
                    <Rect
                      id={spot.id}
                      x={area.x + spot.x}
                      y={area.y + spot.y}
                      width={spot.width}
                      height={spot.height}
                      fill={spot.fill}
                      stroke={selectedSpotId === spot.id ? "#ef4444" : spot.stroke}
                      strokeWidth={selectedSpotId === spot.id ? 3 : 1}
                      onClick={(e) => {
                        e.cancelBubble = true; // Prevent area selection
                        if (mode === "area") {
                          setSelectedSpotId(spot.id);
                          setSelectedAreaId(area.id); // Also select parent area
                          toast(`🚗 Selected: ${spot.name}`);
                        }
                      }}
                      draggable={mode === "area"}
                      onDragMove={(e) => {
                        e.cancelBubble = true;
                      }}
                      onDragEnd={(e) => {
                        const newX = e.target.x() - area.x;
                        const newY = e.target.y() - area.y;
                        
                        // Ensure spot stays within area bounds
                        const clampedX = Math.max(0, Math.min(newX, area.width - spot.width));
                        const clampedY = Math.max(0, Math.min(newY, area.height - spot.height));
                        
                        updateCurrentFloor({
                          areas: areas.map((a) =>
                            a.id === area.id
                              ? {
                                  ...a,
                                  spots: a.spots.map((s) =>
                                    s.id === spot.id
                                      ? { ...s, x: clampedX, y: clampedY }
                                      : s
                                  ),
                                }
                              : a
                          ),
                        });
                        
                        toast.success(`🚗 Moved ${spot.name}`);
                      }}
                    />
                    <Text
                      x={area.x + spot.x + spot.width / 2}
                      y={area.y + spot.y + spot.height / 2}
                      text={spot.name.split('-S')[1] || spot.name}
                      fontSize={9}
                      fill="#166534"
                      fontStyle="bold"
                      align="center"
                      verticalAlign="middle"
                      offsetX={10}
                      offsetY={5}
                      listening={false}
                    />
                  </Group>
                ))}
              </Group>
            ))}
            
            {/* Transformer for resizing selected area */}
            {mode === "area" && selectedAreaId && (
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  // Limit minimum size
                  if (newBox.width < 50 || newBox.height < 50) {
                    return oldBox;
                  }
                  return newBox;
                }}
                rotateEnabled={false}
                enabledAnchors={[
                  'top-left',
                  'top-right',
                  'bottom-left',
                  'bottom-right',
                ]}
              />
            )}
          </Layer>
        </Stage>
      </div>

      {/* Copy Floor Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="ri-file-copy-line text-blue-600 text-2xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Copy Floor Layout</h3>
                <p className="text-sm text-gray-500">Select a floor to copy from</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Copy from Floor:
              </label>
              <select
                value={copySourceFloor || ""}
                onChange={(e) => setCopySourceFloor(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select a floor --</option>
                {floors
                  .filter(f => f.floorNumber !== currentFloor && f.areas.length > 0)
                  .map(f => (
                    <option key={f.floorNumber} value={f.floorNumber}>
                      Floor {f.floorNumber} ({f.areas.length} areas, {f.areas.reduce((sum, a) => sum + (a.spots?.length || 0), 0)} spots)
                    </option>
                  ))}
              </select>
              {floors.filter(f => f.floorNumber !== currentFloor && f.areas.length > 0).length === 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  ⚠️ No other floors with areas available to copy from.
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-blue-800">
                <i className="ri-information-line mr-1"></i>
                This will copy all areas and parking spots from the selected floor to <strong>Floor {currentFloor}</strong>. 
                Any existing areas on this floor will be replaced.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelCopy}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCopy}
                disabled={!copySourceFloor}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  copySourceFloor
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <i className="ri-file-copy-line mr-2"></i>
                Copy Layout
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
