export type OperationsRole = "GUIDE" | "TEACHER" | "ADMIN";
export type TripStatus = "READY" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type StopStatus = "PENDING" | "ARRIVED" | "COMPLETED";

export type Person = {
  id: string;
  name: string;
  phone?: string;
};

export type ItineraryStop = {
  id: string;
  sequence: number;
  name: string;
  address: string;
  scheduledArrivalAt: string;
  scheduledDepartureAt: string;
  status: StopStatus;
  actualArrivalAt?: string;
  completedAt?: string;
  teacherAcknowledgedAt?: string;
};

export type Trip = {
  id: string;
  title: string;
  schoolName: string;
  meetingPoint: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: TripStatus;
  guide: Person;
  leadTeacher: Person;
  students: number;
  itinerary: ItineraryStop[];
};

export type LocationPoint = {
  id: string;
  recordedAt: string;
  latitude: number;
  longitude: number;
  accuracyM: number;
  altitudeM: number | null;
  headingDeg: number | null;
  speedMps: number | null;
  sequence: number;
  source: "browser_geolocation";
};

export type LiveStatus = {
  tripId: string;
  tripStatus: TripStatus;
  dutyStartedAt?: string;
  dutyEndedAt?: string;
  latestLocation?: LocationPoint;
  trackingState: "NOT_STARTED" | "LIVE" | "STALE" | "ENDED" | "UNAVAILABLE";
  nextStop?: ItineraryStop;
};

export type DutyResult = {
  trip: Trip;
  liveStatus: LiveStatus;
};

export type StopAction = "arrive" | "complete";

export type MonitoringStage = "PRE_TOUR" | "DURING_TOUR" | "AFTER_TOUR";
export type MonitoringCategory = "BUS" | "DRIVER" | "TOUR_GUIDE" | "FOOD";
export type MonitoringStatus = "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED" | "NOT_APPLICABLE";

export type MonitoringEvidence = {
  id: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  url?: string;
};

export type MonitoringItem = {
  id: string;
  tripId: string;
  stage: MonitoringStage;
  category: MonitoringCategory;
  title: string;
  description: string;
  ownerRole: OperationsRole;
  verifierRole: "TEACHER" | "ADMIN";
  requiredEvidence: boolean;
  status: MonitoringStatus;
  notes?: string;
  score?: number;
  evidence: MonitoringEvidence[];
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

export type MonitoringUpdate = {
  notes?: string;
  score?: number;
  status: "SUBMITTED" | "NOT_APPLICABLE";
};

export type MonitoringReview = {
  decision: "APPROVED" | "REJECTED";
  notes?: string;
};

export type CommercialStatus = "AWAITING_CONFIRMATION" | "QUOTATION_ACCEPTED" | "AGREEMENT_SIGNED" | "DEPOSIT_PAID";

export type CommercialProgress = {
  proposalNumber: string;
  status: CommercialStatus;
  quotationTotal: number;
  depositAmount: number;
  acceptedAt?: string;
  agreementSignedAt?: string;
  signedBy?: string;
  paidAt?: string;
  paymentReference?: string;
};
