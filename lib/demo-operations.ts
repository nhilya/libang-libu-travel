import type { DutyResult, LiveStatus, LocationPoint, MonitoringItem, MonitoringReview, MonitoringUpdate, OperationsRole, StopAction, Trip } from "@/lib/operations-types";

const STORAGE_KEY = "llt.operations.demo.v1";

type DemoState = {
  trip: Trip;
  liveStatus: LiveStatus;
  monitoring: MonitoringItem[];
};

function isoAt(offsetDays: number, hours: number, minutes: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function initialState(): DemoState {
  const trip: Trip = {
    id: "trip_ipoh_001",
    title: "Ipoh Karst & Heritage Expedition",
    schoolName: "SMK Raja Perempuan",
    meetingPoint: "School main gate",
    scheduledStartAt: isoAt(1, 7, 30),
    scheduledEndAt: isoAt(1, 17, 30),
    status: "READY",
    students: 80,
    guide: { id: "guide_001", name: "Aiman Rahman", phone: "+60 12 345 6789" },
    leadTeacher: { id: "teacher_001", name: "Cikgu Aminah", phone: "+60 17 234 5678" },
    itinerary: [
      {
        id: "stop_001",
        sequence: 1,
        name: "School departure",
        address: "SMK Raja Perempuan, Ipoh",
        scheduledArrivalAt: isoAt(1, 7, 15),
        scheduledDepartureAt: isoAt(1, 7, 30),
        status: "PENDING",
      },
      {
        id: "stop_002",
        sequence: 2,
        name: "Gua Tempurung field study",
        address: "Gopeng, Perak",
        scheduledArrivalAt: isoAt(1, 9, 0),
        scheduledDepartureAt: isoAt(1, 12, 0),
        status: "PENDING",
      },
      {
        id: "stop_003",
        sequence: 3,
        name: "Ipoh Old Town heritage trail",
        address: "Concubine Lane, Ipoh",
        scheduledArrivalAt: isoAt(1, 14, 0),
        scheduledDepartureAt: isoAt(1, 16, 30),
        status: "PENDING",
      },
      {
        id: "stop_004",
        sequence: 4,
        name: "Return to school",
        address: "SMK Raja Perempuan, Ipoh",
        scheduledArrivalAt: isoAt(1, 17, 30),
        scheduledDepartureAt: isoAt(1, 17, 40),
        status: "PENDING",
      },
    ],
  };

  return {
    trip,
    liveStatus: {
      tripId: trip.id,
      tripStatus: trip.status,
      trackingState: "NOT_STARTED",
      nextStop: trip.itinerary[0],
    },
    monitoring: monitoringItems(trip.id),
  };
}

function monitoringItems(tripId: string): MonitoringItem[] {
  const item = (
    id: string,
    stage: MonitoringItem["stage"],
    category: MonitoringItem["category"],
    title: string,
    description: string,
    ownerRole: MonitoringItem["ownerRole"],
    verifierRole: MonitoringItem["verifierRole"] = "ADMIN",
    requiredEvidence = true,
  ): MonitoringItem => ({ id, tripId, stage, category, title, description, ownerRole, verifierRole, requiredEvidence, status: "PENDING", evidence: [] });

  return [
    item("monitor_bus_insurance", "PRE_TOUR", "BUS", "Bus insurance & road tax", "Upload current insurance and road-tax documents.", "ADMIN"),
    item("monitor_bus_condition", "PRE_TOUR", "BUS", "Bus condition photos", "Exterior, interior, tyres, emergency exit and safety equipment.", "ADMIN"),
    item("monitor_bus_service", "PRE_TOUR", "BUS", "Latest service invoice", "Upload proof of the bus's most recent scheduled service.", "ADMIN"),
    item("monitor_driver_profile", "PRE_TOUR", "DRIVER", "Driver profile", "Confirm identity, contact information and assigned vehicle.", "ADMIN", "ADMIN", false),
    item("monitor_driver_license", "PRE_TOUR", "DRIVER", "Driver licence & insurance", "Upload a valid licence and relevant driver insurance.", "ADMIN"),
    item("monitor_guide_profile", "PRE_TOUR", "TOUR_GUIDE", "Guide qualifications & experience", "Add qualifications, experience and licence information.", "GUIDE"),
    item("monitor_guide_intro", "PRE_TOUR", "TOUR_GUIDE", "Short introduction video", "Record a short introduction for the school before the tour.", "GUIDE"),
    item("monitor_food_options", "PRE_TOUR", "FOOD", "Minimum three vendor options", "Compare at least three vendors before final selection.", "ADMIN", "ADMIN", false),
    item("monitor_food_typhoid", "PRE_TOUR", "FOOD", "Typhoid certificate", "Upload valid food-handler typhoid documentation.", "ADMIN"),
    item("monitor_food_menu", "PRE_TOUR", "FOOD", "Food menu", "Confirm menu, allergens and dietary requirements.", "ADMIN", "ADMIN", false),
    item("monitor_food_handling", "PRE_TOUR", "FOOD", "Food handling certificate", "Upload current food handling certification.", "ADMIN"),
    item("monitor_bus_arrival", "DURING_TOUR", "BUS", "Bus arrival photo proof", "Take a timestamped arrival photo at the meeting point.", "GUIDE", "TEACHER"),
    item("monitor_driver_speed", "DURING_TOUR", "DRIVER", "Driver speed & road safety", "Record any speeding, unsafe driving or route concerns.", "GUIDE", "TEACHER", false),
    item("monitor_driver_behaviour", "DURING_TOUR", "DRIVER", "Driver behaviour", "Rate professionalism, communication and student safety.", "GUIDE", "TEACHER", false),
    item("monitor_food_fresh", "DURING_TOUR", "FOOD", "Food freshness", "Check temperature, freshness, packaging and delivery timing.", "GUIDE", "TEACHER"),
    item("monitor_food_clean", "DURING_TOUR", "FOOD", "Food cleanliness", "Check hygiene, serving area and food-handler cleanliness.", "GUIDE", "TEACHER"),
    item("monitor_teacher_review", "AFTER_TOUR", "TOUR_GUIDE", "Teacher operations review", "Final confirmation of guide, transport and meal delivery.", "TEACHER", "ADMIN", false),
  ];
}

function readState(): DemoState {
  if (typeof window === "undefined") return initialState();
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return initialState();

  try {
    const parsed = JSON.parse(stored) as DemoState;
    if (!parsed.monitoring) parsed.monitoring = monitoringItems(parsed.trip.id);
    return parsed;
  } catch {
    return initialState();
  }
}

function writeState(state: DemoState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("llt:demo-state"));
}

function nextPendingStop(trip: Trip) {
  return trip.itinerary.find((stop) => stop.status !== "COMPLETED");
}

export const demoOperations = {
  async getTrips(role: OperationsRole): Promise<Trip[]> {
    void role;
    return [readState().trip];
  },

  async getTrip(tripId: string): Promise<Trip> {
    void tripId;
    return readState().trip;
  },

  async getLiveStatus(tripId: string): Promise<LiveStatus> {
    void tripId;
    return readState().liveStatus;
  },

  async startDuty(tripId: string): Promise<DutyResult> {
    void tripId;
    const state = readState();
    state.trip.status = "IN_PROGRESS";
    state.liveStatus = {
      ...state.liveStatus,
      tripStatus: "IN_PROGRESS",
      dutyStartedAt: new Date().toISOString(),
      trackingState: "UNAVAILABLE",
      nextStop: nextPendingStop(state.trip),
    };
    writeState(state);
    return state;
  },

  async endDuty(tripId: string): Promise<DutyResult> {
    void tripId;
    const state = readState();
    state.trip.status = "COMPLETED";
    state.liveStatus = {
      ...state.liveStatus,
      tripStatus: "COMPLETED",
      dutyEndedAt: new Date().toISOString(),
      trackingState: "ENDED",
      nextStop: undefined,
    };
    writeState(state);
    return state;
  },

  async updateStop(_tripId: string, stopId: string, action: StopAction): Promise<Trip> {
    const state = readState();
    const stop = state.trip.itinerary.find((item) => item.id === stopId);
    if (!stop) throw new Error("Checkpoint not found.");
    const now = new Date().toISOString();
    if (action === "arrive") {
      stop.status = "ARRIVED";
      stop.actualArrivalAt = now;
    } else {
      stop.status = "COMPLETED";
      stop.actualArrivalAt ||= now;
      stop.completedAt = now;
    }
    state.liveStatus.nextStop = nextPendingStop(state.trip);
    writeState(state);
    return state.trip;
  },

  async acknowledgeStop(_tripId: string, stopId: string): Promise<Trip> {
    const state = readState();
    const stop = state.trip.itinerary.find((item) => item.id === stopId);
    if (!stop) throw new Error("Checkpoint not found.");
    stop.teacherAcknowledgedAt = new Date().toISOString();
    writeState(state);
    return state.trip;
  },

  async sendLocationPoints(_tripId: string, points: LocationPoint[]): Promise<void> {
    if (!points.length) return;
    const state = readState();
    state.liveStatus.latestLocation = points.at(-1);
    state.liveStatus.trackingState = "LIVE";
    writeState(state);
  },

  async getMonitoring(tripId: string): Promise<MonitoringItem[]> {
    return readState().monitoring.filter((item) => item.tripId === tripId);
  },

  async updateMonitoringItem(_tripId: string, itemId: string, update: MonitoringUpdate): Promise<MonitoringItem> {
    const state = readState();
    const item = state.monitoring.find((candidate) => candidate.id === itemId);
    if (!item) throw new Error("Monitoring task not found.");
    item.status = update.status;
    item.notes = update.notes;
    item.score = update.score;
    item.submittedAt = new Date().toISOString();
    item.reviewedAt = undefined;
    item.reviewedBy = undefined;
    writeState(state);
    return item;
  },

  async uploadMonitoringEvidence(_tripId: string, itemId: string, file: File): Promise<MonitoringItem> {
    const state = readState();
    const item = state.monitoring.find((candidate) => candidate.id === itemId);
    if (!item) throw new Error("Monitoring task not found.");
    item.evidence.push({
      id: crypto.randomUUID(),
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "Demo user",
    });
    writeState(state);
    return item;
  },

  async reviewMonitoringItem(_tripId: string, itemId: string, review: MonitoringReview): Promise<MonitoringItem> {
    const state = readState();
    const item = state.monitoring.find((candidate) => candidate.id === itemId);
    if (!item) throw new Error("Monitoring task not found.");
    item.status = review.decision;
    item.notes = review.notes || item.notes;
    item.reviewedAt = new Date().toISOString();
    item.reviewedBy = "Demo reviewer";
    writeState(state);
    return item;
  },
};
