import React, { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import {
  Alert,
  AlertIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Icon,
  Input,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Tag,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  FiArrowLeft,
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiGlobe,
  FiMapPin,
  FiMessageCircle,
  FiPlus,
  FiShield,
  FiUsers,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/shared/AuthContext';
import { isConvexOrgId } from '../utils/accountingUtils';
import { mobilizationServiceCatalogue, type MobilizationService } from '../data/mobilizationServices';

type DemoRole = 'hr' | 'medical_provider' | 'document_agent' | 'travel_provider' | 'supplier' | 'candidate' | 'transport';
type HrPage = 'portfolio' | 'initiate' | 'suppliers' | 'case';
type TaskStatus = 'not_started' | 'in_progress' | 'candidate_reported' | 'verified';
type Stakeholder = 'candidate' | 'provider' | 'hr';
type ProviderFulfillment = 'direct' | 'subcontractor_identified' | 'subcontractor_pending' | 'unable';

type DemoSupplier = {
  id: string;
  name: string;
  country: string;
  serviceIds: string[];
};

type DemoSupplierRecord = {
  _id: string;
  name: string;
  country?: string;
  service_ids?: string[];
};

type ServiceTask = {
  id: string;
  name: string;
  description: string;
  owner: Stakeholder;
  provider: string;
  due: string;
  status: TaskStatus;
  candidateAction: boolean;
  providerFulfillment?: ProviderFulfillment;
  subcontractorName?: string;
  subcontractorCountry?: string;
  subcontractorContact?: string;
  subcontractorReview?: 'pending' | 'approved';
};

type DemoMessage = {
  id: number;
  from: string;
  role: Stakeholder | 'system';
  text: string;
  time: string;
};

const sampleCases = [
  { ref: 'MOB-2026-014', candidate: 'Demo Candidate', country: 'India', position: 'Mechanical Technician', supplier: 'CareBridge Medical Services', stage: 'Medical arrangement', arrival: '2026-10-26', services: ['Medical examination', 'GAMCA / Wafid medical', 'HRD / document attestation'] },
  { ref: 'MOB-2026-011', candidate: 'Candidate B', country: 'India', position: 'HVAC Engineer', supplier: 'Global Document Assist', stage: 'Visa stamping', arrival: '2026-11-02', services: ['HRD / document attestation', 'Visa stamping'] },
  { ref: 'MOB-2026-012', candidate: 'Candidate C', country: 'India', position: 'Warehouse Supervisor', supplier: 'SkyRoute Travel', stage: 'Ticket booking', arrival: '2026-10-18', services: ['Visa stamping', 'Flight booking'] },
  { ref: 'MOB-2026-008', candidate: 'Candidate D', country: 'Bangladesh', position: 'Electrician', supplier: 'MediPath Dhaka', stage: 'Medical arrangement', arrival: '2026-10-30', services: ['Medical examination', 'GAMCA / Wafid medical'] },
  { ref: 'MOB-2026-009', candidate: 'Candidate E', country: 'Bangladesh', position: 'Pipe Fitter', supplier: 'Global Document Assist', stage: 'HRD attestation', arrival: '2026-11-08', services: ['HRD / document attestation', 'Visa stamping'] },
  { ref: 'MOB-2026-006', candidate: 'Candidate F', country: 'Pakistan', position: 'Accountant', supplier: 'Global Document Assist', stage: 'Visa stamping', arrival: '2026-11-04', services: ['HRD / document attestation', 'Visa stamping', 'Flight booking'] },
  { ref: 'MOB-2026-004', candidate: 'Candidate G', country: 'Philippines', position: 'Registered Nurse', supplier: 'SkyRoute Travel', stage: 'Ticket booking', arrival: '2026-10-21', services: ['Medical examination', 'Visa stamping', 'Flight booking'] },
];

const pipelineStages = ['Candidate contact', 'Medical arrangement', 'HRD attestation', 'Visa stamping', 'Ticket booking', 'Arrived'];
const hiringCountries = ['India', 'Bangladesh', 'Pakistan', 'Philippines', 'Egypt', 'Jordan', 'Sudan', 'Syria'];
const formatArrivalDate = (isoDate: string) => new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const getDaysUntilArrival = (isoDate: string) => Math.ceil((new Date(`${isoDate}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);

const initialTasks: ServiceTask[] = [
  {
    id: 'medical',
    name: 'Medical examination',
    description: 'Attend the assigned medical appointment and share the completion receipt.',
    owner: 'candidate',
    provider: 'CareBridge Medical Services',
    due: '12 Oct 2026',
    status: 'candidate_reported',
    candidateAction: true,
  },
  {
    id: 'gamca',
    name: 'GAMCA / Wafid medical',
    description: 'Confirm appointment and upload the authorized provider receipt.',
    owner: 'provider',
    provider: 'CareBridge Medical Services',
    due: '13 Oct 2026',
    status: 'in_progress',
    candidateAction: true,
  },
  {
    id: 'attestation',
    name: 'HRD / document attestation',
    description: 'Verify qualification documents and report the attestation milestone.',
    owner: 'provider',
    provider: 'Global Document Assist',
    due: '16 Oct 2026',
    status: 'in_progress',
    candidateAction: false,
  },
  {
    id: 'visa-authorization',
    name: 'Visa authorization / issuance coordination',
    description: 'Coordinate visa authorization and issuance steps before visa stamping, where required.',
    owner: 'provider',
    provider: 'Global Document Assist',
    due: '18 Oct 2026',
    status: 'not_started',
    candidateAction: false,
  },
  {
    id: 'translation-legalization',
    name: 'Document translation and legalization',
    description: 'Arrange required document translation, notarization, and legalization based on local requirements.',
    owner: 'provider',
    provider: 'Global Document Assist',
    due: '18 Oct 2026',
    status: 'not_started',
    candidateAction: true,
  },
  {
    id: 'visa',
    name: 'Visa stamping',
    description: 'Prepare the visa submission and report the stamping status.',
    owner: 'provider',
    provider: 'Global Document Assist',
    due: '20 Oct 2026',
    status: 'not_started',
    candidateAction: false,
  },
  {
    id: 'pre-departure-orientation',
    name: 'Pre-departure orientation',
    description: 'Share a structured travel briefing, required documents, and arrival contact instructions.',
    owner: 'provider',
    provider: 'Global Document Assist',
    due: '22 Oct 2026',
    status: 'not_started',
    candidateAction: true,
  },
  {
    id: 'flight',
    name: 'Flight booking',
    description: 'Book the approved itinerary after HR confirms travel readiness.',
    owner: 'provider',
    provider: 'SkyRoute Travel',
    due: '24 Oct 2026',
    status: 'not_started',
    candidateAction: true,
  },
  {
    id: 'airport-transfer',
    name: 'Airport pickup and transfer',
    description: 'Arrange airport pickup and transfer to the agreed destination in Saudi Arabia.',
    owner: 'provider',
    provider: 'SkyRoute Travel',
    due: '26 Oct 2026',
    status: 'not_started',
    candidateAction: false,
  },
  {
    id: 'post-arrival-documents',
    name: 'Post-arrival documentation follow-up',
    description: 'Coordinate Saudi-side follow-up for required post-arrival medical, biometrics, and residence/work authorization steps.',
    owner: 'provider',
    provider: 'Global Document Assist',
    due: '28 Oct 2026',
    status: 'not_started',
    candidateAction: true,
  },
];

const initialMessages: DemoMessage[] = [
  { id: 1, from: 'Mobilization desk', role: 'system', text: 'Demo case started. Updates here are simulated and are not sent to WhatsApp.', time: '09:10' },
  { id: 2, from: 'CareBridge Medical Services', role: 'provider', text: 'Medical appointment is confirmed for 12 Oct. Candidate, reply with one option: 1 Attended  2 Reschedule needed  3 Need assistance.', time: '09:14' },
  { id: 3, from: 'Candidate', role: 'candidate', text: '1 — Attended. Receipt upload requested.', time: '10:02' },
  { id: 4, from: 'Mobilization desk', role: 'system', text: 'Candidate completion is awaiting provider verification.', time: '10:03' },
];

const roleOptions: { id: DemoRole; label: string }[] = [
  { id: 'hr', label: 'HR workspace' },
  { id: 'medical_provider', label: 'Medical provider' },
  { id: 'document_agent', label: 'Attestation & visa agent' },
  { id: 'travel_provider', label: 'Flight provider' },
  { id: 'supplier', label: 'Saved supplier' },
  { id: 'candidate', label: 'Candidate portal' },
  { id: 'transport', label: 'Transport coordinator' },
];

const statusLabel: Record<TaskStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  candidate_reported: 'Candidate reported complete',
  verified: 'Provider verified',
};

const statusColor: Record<TaskStatus, string> = {
  not_started: 'gray',
  in_progress: 'blue',
  candidate_reported: 'orange',
  verified: 'green',
};

const timeNow = () => new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());

export const InternationalHiringDemoScreen: React.FC = () => {
  const navigate = useNavigate();
  const { selectedOrganization } = useAuth();
  const supplierRecords = useQuery(
    api.suppliers.listSuppliers,
    isConvexOrgId(selectedOrganization) ? { organization_id: selectedOrganization } : 'skip',
  );
  const suppliers: DemoSupplier[] = ((supplierRecords || []) as DemoSupplierRecord[]).map((supplier) => ({
    id: supplier._id,
    name: supplier.name,
    country: supplier.country || '',
    serviceIds: supplier.service_ids || [],
  }));
  const [role, setRole] = useState<DemoRole>('hr');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [hrPage, setHrPage] = useState<HrPage>('portfolio');
  const [portfolioCases, setPortfolioCases] = useState(sampleCases);
  const [countryOptions, setCountryOptions] = useState(hiringCountries);
  const [services, setServices] = useState(mobilizationServiceCatalogue);
  const [tasks, setTasks] = useState(initialTasks);
  const [messages, setMessages] = useState(initialMessages);
  const [landed, setLanded] = useState(false);
  const [countryFilter, setCountryFilter] = useState('All countries');
  const [candidateName, setCandidateName] = useState('New demo candidate');
  const [candidateCountry, setCandidateCountry] = useState('India');
  const [candidatePosition, setCandidatePosition] = useState('');
  const [tentativeArrival, setTentativeArrival] = useState('2026-11-15');
  const [activeCandidate, setActiveCandidate] = useState({ name: 'Demo Candidate', country: 'India', position: 'Mechanical Technician', arrival: '26 Oct 2026' });
  const [reminderDaysBefore, setReminderDaysBefore] = useState(2);
  const [reminderIntervalDays, setReminderIntervalDays] = useState(2);
  const [selectedSetupServices, setSelectedSetupServices] = useState<string[]>(['medical', 'attestation', 'visa']);
  const [setupProviders, setSetupProviders] = useState<Record<string, string>>({
    medical: 'CareBridge Medical Services',
    gamca: 'CareBridge Medical Services',
    attestation: 'Global Document Assist',
    visa: 'Global Document Assist',
    flight: 'SkyRoute Travel',
  });
  const [subcontractorDrafts, setSubcontractorDrafts] = useState<Record<string, { name: string; country: string; contact: string }>>({});
  const [customServiceName, setCustomServiceName] = useState('');
  const [customServiceDescription, setCustomServiceDescription] = useState('');
  const [customCountryName, setCustomCountryName] = useState('');

  const selectedServices = useMemo(() => new Set(tasks.map((task) => task.id)), [tasks]);
  const selectedSupplier = suppliers.find((supplier) => supplier.id === selectedSupplierId);
  const assignedProvider = role === 'supplier'
    ? selectedSupplier?.name || null
    : role === 'medical_provider'
      ? 'CareBridge Medical Services'
      : role === 'document_agent'
        ? 'Global Document Assist'
        : role === 'travel_provider'
          ? 'SkyRoute Travel'
          : null;
  const visibleCases = portfolioCases.filter((item) => countryFilter === 'All countries' || item.country === countryFilter);
  const countries = Array.from(new Set([...countryOptions, ...portfolioCases.map((item) => item.country)]));
  const availableSuppliers = (serviceId: string) => suppliers.filter((supplier) =>
    supplier.serviceIds.includes(serviceId) && (supplier.country === 'Multi-country' || supplier.country === candidateCountry));
  const selectedSupplierForService = (serviceId: string) => {
    const choices = availableSuppliers(serviceId);
    return choices.find((supplier) => supplier.name === setupProviders[serviceId])?.name || choices[0]?.name || '';
  };
  const addCustomService = () => {
    const normalizedName = customServiceName.trim();
    if (!normalizedName || services.some((service) => service.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase())) return;
    const serviceId = `custom-${normalizedName.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    setServices((current) => [...current, {
      id: serviceId,
      name: normalizedName,
      description: customServiceDescription.trim() || `${normalizedName} service for candidate mobilization.`,
      provider: '',
    }]);
    setCustomServiceName('');
    setCustomServiceDescription('');
  };
  const addCustomCountry = () => {
    const normalizedName = customCountryName.trim().replace(/\s+/g, ' ');
    if (!normalizedName || countryOptions.some((country) => country.toLocaleLowerCase() === normalizedName.toLocaleLowerCase())) return;
    setCountryOptions((current) => [...current, normalizedName]);
    setCustomCountryName('');
  };
  const selectedServicesHaveSuppliers = selectedSetupServices.every((serviceId) => availableSuppliers(serviceId).length > 0);
  const nextArrival = portfolioCases
    .filter((item) => getDaysUntilArrival(item.arrival) >= 0)
    .sort((left, right) => left.arrival.localeCompare(right.arrival))[0];
  const startCase = () => {
    if (!candidatePosition.trim() || selectedSetupServices.length === 0 || !selectedServicesHaveSuppliers) return;
    const nextTasks = selectedSetupServices.map((id) => {
      const item = services.find((service) => service.id === id);
      const template = initialTasks.find((task) => task.id === id);
      if (!item) return null;
      return {
        ...(template || {
          id: item.id,
          description: item.description,
          owner: 'provider' as Stakeholder,
          provider: selectedSupplierForService(id),
          due: formatArrivalDate(tentativeArrival),
          status: 'not_started' as TaskStatus,
          candidateAction: false,
        }),
        name: item.name,
        description: item.description,
        provider: selectedSupplierForService(id) || item.provider,
        due: formatArrivalDate(tentativeArrival),
        status: 'not_started' as TaskStatus,
      };
    }).filter((task): task is ServiceTask => task !== null);
    setTasks(nextTasks);
    setActiveCandidate({
      name: candidateName,
      country: candidateCountry,
      position: candidatePosition,
      arrival: tentativeArrival,
    });
    const caseRef = `MOB-DEMO-${String(portfolioCases.length + 1).padStart(3, '0')}`;
    setPortfolioCases((current) => [{
      ref: caseRef,
      candidate: candidateName,
      country: candidateCountry,
      position: candidatePosition,
      supplier: nextTasks[0]?.provider || 'Unassigned',
      stage: 'Candidate contact',
      arrival: tentativeArrival,
      services: nextTasks.map((task) => task.name),
    }, ...current]);
    setMessages([
      { id: Date.now(), from: 'Mobilization desk', role: 'system', text: `Mobilization case created for ${candidateName} · ${candidateCountry} · ${candidatePosition}.`, time: timeNow() },
      { id: Date.now() + 1, from: 'Mobilization desk', role: 'system', text: `HR selected ${nextTasks.length} services. Candidate invitation asks: “Do you agree to proceed with mobilization?” Reply YES or NO. Provider assignment asks: “Do you accept this task?” Reply 1 Accept or 2 Decline. (Demo only)`, time: timeNow() },
      { id: Date.now() + 2, from: 'Mobilization desk', role: 'system', text: `Reminder plan: first reminder ${reminderDaysBefore} day(s) before due date, then every ${reminderIntervalDays} day(s) while overdue; stop when completed or paused.`, time: timeNow() },
    ]);
    setLanded(false);
    setRole('hr');
    setHrPage('case');
  };

  const appendMessage = (from: string, messageRole: Stakeholder | 'system', text: string) => {
    setMessages((current) => [...current, { id: Date.now() + Math.random(), from, role: messageRole, text, time: timeNow() }]);
  };

  const updateProviderFulfillment = (task: ServiceTask, fulfillment: ProviderFulfillment) => {
    setTasks((current) => current.map((item) => item.id === task.id
      ? { ...item, providerFulfillment: fulfillment, subcontractorName: undefined, subcontractorCountry: undefined, subcontractorContact: undefined, subcontractorReview: undefined }
      : item));
    const message = fulfillment === 'direct'
      ? `1 — Our organization will perform ${task.name} directly.`
      : fulfillment === 'subcontractor_identified'
        ? `2 — A subcontractor has been identified for ${task.name}. Please provide their details.`
        : fulfillment === 'subcontractor_pending'
          ? `3 — A subcontractor has not yet been identified for ${task.name}. We remain accountable and will update HR.`
          : `4 — We cannot provide ${task.name}. HR action is required.`;
    appendMessage(task.provider, 'provider', message);
    if (fulfillment === 'subcontractor_pending' || fulfillment === 'unable') {
      appendMessage('Mobilization desk', 'system', `${task.name}: HR has been notified that the supplier needs follow-up.`);
    }
  };

  const submitSubcontractorDetails = (task: ServiceTask) => {
    const details = subcontractorDrafts[task.id];
    if (!details?.name.trim() || !details.country.trim() || !details.contact.trim()) return;
    setTasks((current) => current.map((item) => item.id === task.id
      ? {
        ...item,
        providerFulfillment: 'subcontractor_identified',
        subcontractorName: details.name.trim(),
        subcontractorCountry: details.country.trim(),
        subcontractorContact: details.contact.trim(),
        subcontractorReview: 'pending',
      }
      : item));
    appendMessage(task.provider, 'provider', `Subcontractor details submitted for ${task.name}: ${details.name.trim()} · ${details.country.trim()} · ${details.contact.trim()}.`);
    appendMessage('Mobilization desk', 'system', `Subcontractor for ${task.name} is pending HR review. No access invitation has been sent.`);
  };

  const reviewSubcontractor = (task: ServiceTask, approved: boolean) => {
    setTasks((current) => current.map((item) => item.id === task.id
      ? { ...item, subcontractorReview: approved ? 'approved' : 'pending' }
      : item));
    appendMessage('Mobilization desk', 'system', approved
      ? `HR approved ${task.subcontractorName} for ${task.name}. Provider remains accountable.`
      : `HR requested clarification from ${task.provider} for the ${task.name} subcontractor.`);
  };

  const toggleService = (serviceId: string) => {
    const service = services.find((item) => item.id === serviceId);
    if (!service) return;
    if (selectedServices.has(serviceId)) {
      setTasks((current) => current.filter((task) => task.id !== serviceId));
      appendMessage('Mobilization desk', 'system', `${service.name} was removed from the selected services.`);
      return;
    }
    const serviceTask = services.find((item) => item.id === serviceId);
    if (!serviceTask) return;
    const taskTemplate = initialTasks.find((task) => task.id === serviceId);
    setTasks((current) => [...current, taskTemplate ? { ...taskTemplate } : {
      id: serviceTask.id,
      name: serviceTask.name,
      description: serviceTask.description,
      owner: 'provider',
      provider: setupProviders[serviceId] || '',
      due: formatArrivalDate(tentativeArrival),
      status: 'not_started',
      candidateAction: false,
    }]);
    appendMessage('Mobilization desk', 'system', `${service.name} was added. The responsible stakeholder will be notified.`);
  };

  const markCandidateComplete = (task: ServiceTask) => {
    setTasks((current) => current.map((item) => item.id === task.id && item.status !== 'verified'
      ? { ...item, status: 'candidate_reported' }
      : item));
    appendMessage('Candidate', 'candidate', `1 — Completed: ${task.name}. Evidence upload: Yes.`);
    appendMessage('Mobilization desk', 'system', `${task.name}: candidate update received; provider verification is pending.`);
  };

  const verifyTask = (task: ServiceTask) => {
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status: 'verified' } : item));
    appendMessage('Service provider', 'provider', `3 — Completed and verified: ${task.name}. Evidence attached: Yes.`);
    appendMessage('Mobilization desk', 'system', `${task.name} was verified by the assigned provider.`);
  };

  const sendReminder = (task: ServiceTask) => {
    const recipient = task.owner === 'candidate' ? 'Candidate' : task.provider;
    appendMessage('Mobilization desk', 'system', `Reminder queued for ${recipient}: ${task.name} is due ${task.due}. Reply with one option: 1 Complete  2 In progress  3 Blocked  4 Need assistance. (Demo only)`);
  };

  const sendClosedEndedCheckIn = () => {
    if (role === 'candidate') {
      appendMessage('Mobilization desk', 'system', 'Status check: Select one option for your next step: 1 Completed  2 Not completed  3 Appointment not scheduled  4 Need assistance.');
    } else if (assignedProvider) {
      appendMessage('Mobilization desk', 'system', 'Task check: Select one option: 1 Accepted  2 In progress  3 Completed  4 Blocked. If blocked, select: A Waiting for candidate  B Appointment unavailable  C Document issue  D Other predefined issue.');
    } else if (role === 'transport') {
      appendMessage('Mobilization desk', 'system', 'Pickup check: Select one option: 1 Accepted  2 Driver en route  3 Candidate picked up  4 Unable to collect.');
    } else {
      appendMessage('Mobilization desk', 'system', 'HR action required: Select one option: 1 Review evidence  2 Reassign provider  3 Pause case  4 Escalate blocker.');
    }
  };

  const simulateClosedEndedReply = (answer: string) => {
    const from = role === 'candidate'
      ? 'Candidate'
      : assignedProvider || (role === 'transport' ? 'Transport coordinator' : 'HR');
    const messageRole: Stakeholder | 'system' = role === 'candidate'
      ? 'candidate'
      : role === 'hr'
        ? 'system'
        : 'provider';
    appendMessage(from, messageRole, answer);
  };

  const reportArrival = () => {
    setLanded(true);
    appendMessage('Candidate', 'candidate', '1 — Landed at King Khalid International Airport. Pickup needed: Yes.');
    appendMessage('Mobilization desk', 'system', 'Arrival reported. Transport coordinator notified. Reply options: 1 Pickup accepted  2 Driver en route  3 Candidate picked up  4 Unable to collect. (Demo only)');
  };

  const visibleTasks = tasks.filter((task) => {
    if (role === 'supplier' && !assignedProvider) return false;
    if (assignedProvider) return task.provider === assignedProvider;
    if (role === 'candidate') return task.candidateAction;
    if (role === 'transport') return false;
    return true;
  });

  const titleByRole: Record<DemoRole, string> = {
    hr: 'International hiring overview',
    medical_provider: 'Medical services assigned to your agency',
    document_agent: 'Attestation and visa tasks assigned to you',
    travel_provider: 'Flight services assigned to your agency',
    supplier: 'Services assigned to your supplier',
    candidate: 'My onboarding journey',
    transport: 'Arrival and pickup coordination',
  };

  const roleDescription: Record<DemoRole, string> = {
    hr: 'Configure selected services, assignments, deadlines, and case follow-up.',
    medical_provider: 'This view is limited to tasks assigned to CareBridge Medical Services.',
    document_agent: 'This view is limited to tasks assigned to Global Document Assist.',
    travel_provider: 'This view is limited to tasks assigned to SkyRoute Travel.',
    supplier: 'Choose a saved supplier to see only its assigned services.',
    candidate: 'The candidate view is limited to this candidate’s own required actions.',
    transport: 'Transport sees arrival and pickup information only when assigned.',
  };
  const completedCount = tasks.filter((task) => task.status === 'verified').length;
  const providerVerifiedCount = visibleTasks.filter((task) => task.status === 'verified').length;
  const visibleProgress = visibleTasks.length ? Math.round((providerVerifiedCount / visibleTasks.length) * 100) : 0;
  const progressTitle = role === 'hr'
    ? 'Verified services'
    : role === 'candidate'
      ? 'Your required actions'
      : assignedProvider
        ? 'Your assigned tasks'
        : 'Pickup status';
  const progressDetail = role === 'hr'
    ? `${tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0}% provider-verified · Candidate reports require separate verification`
    : role === 'candidate'
      ? `${visibleTasks.length} actions for your employment case`
      : assignedProvider
        ? `${visibleProgress}% of your assigned services verified`
        : landed ? 'Candidate has reported landing' : 'Arrival not yet reported';
  const progressValue = role === 'hr' ? (tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0) : visibleProgress;

  return (
    <Box maxW="1500px" mx="auto" p={{ base: 3, md: 6 }}>
      <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={4} mb={5} direction={{ base: 'column', md: 'row' }}>
        <Box>
          <Button size="sm" variant="ghost" leftIcon={<FiArrowLeft />} onClick={() => navigate('/hr')} mb={2}>
            Back to HR
          </Button>
          <HStack spacing={3} flexWrap="wrap">
            <Heading size={{ base: 'md', md: 'lg' }}>International Hiring & Mobilization</Heading>
            <Badge colorScheme="purple" px={2} py={1}>INTERACTIVE DEMO</Badge>
          </HStack>
          <Text color="gray.600" mt={1}>A shared candidate case with separate role-based stakeholder views.</Text>
        </Box>
        <Box minW={{ base: 'full', md: '230px' }}>
          {role === 'hr' && hrPage === 'case' && <Button size="sm" variant="outline" mb={2} onClick={() => setHrPage('portfolio')}>Back to portfolio</Button>}
          <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>VIEW AS</Text>
          <Select value={role} onChange={(event) => setRole(event.target.value as DemoRole)} bg="white" aria-label="Switch demo stakeholder view">
            {roleOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </Select>
          {role === 'supplier' && (
            <FormControl mt={2}>
              <FormLabel fontSize="xs" mb={1}>Supplier account</FormLabel>
              <Select
                size="sm"
                value={selectedSupplierId}
                onChange={(event) => setSelectedSupplierId(event.target.value)}
                placeholder="Choose a saved supplier"
                bg="white"
              >
                {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
              </Select>
            </FormControl>
          )}
        </Box>
      </Flex>

      <Alert status="info" borderRadius="lg" mb={5}>
        <AlertIcon />
        <Text fontSize="sm"><b>Demo data only.</b> Role switching is for preview, not production access control. WhatsApp messages, reminders, and updates are simulated; nothing is sent or saved to the live HR records.</Text>
      </Alert>

      {role === 'hr' && hrPage !== 'case' ? (
        <VStack align="stretch" spacing={5}>
          <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3} direction={{ base: 'column', md: 'row' }}>
            <Box>
              <Heading size="md">{hrPage === 'portfolio' ? 'Mobilization portfolio' : hrPage === 'suppliers' ? 'Manage suppliers' : 'Initiate a candidate mobilization'}</Heading>
              <Text fontSize="sm" color="gray.600" mt={1}>
                {hrPage === 'portfolio'
                  ? 'Review country pipelines, supplier workloads, current stages, and estimated KSA arrivals.'
                  : hrPage === 'suppliers'
                    ? 'Add service providers to the demo directory and choose which services each provider offers.'
                    : 'Create a demo case, choose country-relevant services, assign providers, and set reminder rules.'}
              </Text>
            </Box>
            <HStack>
              {hrPage !== 'portfolio' && <Button variant="outline" onClick={() => setHrPage('portfolio')}>Back to portfolio</Button>}
              {hrPage === 'portfolio' && <Button variant="outline" leftIcon={<FiUsers />} onClick={() => setHrPage('suppliers')}>Manage suppliers</Button>}
              {hrPage === 'initiate' && <Button variant="outline" leftIcon={<FiUsers />} onClick={() => setHrPage('suppliers')}>Manage suppliers</Button>}
              <Button colorScheme="purple" leftIcon={<FiPlus />} onClick={() => setHrPage(hrPage === 'initiate' ? 'portfolio' : 'initiate')}>
                {hrPage === 'initiate' ? 'Portfolio' : 'Start mobilization'}
              </Button>
            </HStack>
          </Flex>

          {hrPage === 'portfolio' ? (
            <>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                <Card><CardBody><Text color="gray.500" fontSize="sm">Active candidates</Text><Heading size="lg">{portfolioCases.length}</Heading><Text fontSize="xs" color="gray.500">Across {countries.length} hiring countries</Text></CardBody></Card>
                <Card><CardBody><Text color="gray.500" fontSize="sm">Service partners</Text><Heading size="lg">{suppliers.length}</Heading><Text fontSize="xs" color="gray.500">Country and service coverage</Text></CardBody></Card>
                <Card><CardBody><Text color="gray.500" fontSize="sm">Next arrival</Text><Heading size="md">{nextArrival ? formatArrivalDate(nextArrival.arrival) : 'Not scheduled'}</Heading><Text fontSize="xs" color="gray.500">{nextArrival ? `${nextArrival.candidate} · ${nextArrival.country} · tentative` : 'No upcoming demo arrivals'}</Text></CardBody></Card>
                <Card><CardBody><Text color="gray.500" fontSize="sm">Needs HR attention</Text><Heading size="lg" color="orange.500">2</Heading><Text fontSize="xs" color="gray.500">Illustrative overdue/blocker count</Text></CardBody></Card>
              </SimpleGrid>

              <Card>
                <CardBody>
                  <Flex justify="space-between" align="center" gap={3} mb={4} wrap="wrap">
                    <Box><Heading size="sm">Country pipeline</Heading><Text fontSize="sm" color="gray.600">Select a country to filter candidates and their current mobilization stages.</Text></Box>
                    <Select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)} maxW="230px" aria-label="Filter by hiring country">
                      <option>All countries</option>
                      {countries.map((country) => <option key={country}>{country}</option>)}
                    </Select>
                  </Flex>
                  <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={3}>
                    {countries.filter((country) => countryFilter === 'All countries' || countryFilter === country).map((country) => {
                      const cases = portfolioCases.filter((item) => item.country === country);
                      return (
                        <Box key={country} borderWidth="1px" borderRadius="lg" p={3}>
                          <HStack justify="space-between" mb={3}><Text fontWeight="bold">{country}</Text><Badge colorScheme="blue">{cases.length} candidates</Badge></HStack>
                          <HStack spacing={1} align="stretch">
                            {pipelineStages.map((stage) => {
                              const count = cases.filter((item) => item.stage === stage).length;
                              return <Box key={stage} flex="1" minW={0} textAlign="center" borderRadius="md" p={2} bg={count ? 'purple.50' : 'gray.50'} title={stage}><Text fontSize="lg" fontWeight="bold">{count}</Text><Text fontSize="9px" noOfLines={2}>{stage}</Text></Box>;
                            })}
                          </HStack>
                          <Button mt={3} size="xs" variant="link" onClick={() => setCountryFilter(country)}>View {country} pipeline</Button>
                        </Box>
                      );
                    })}
                  </SimpleGrid>
                </CardBody>
              </Card>

              <Card>
                <CardBody p={2}>
                  <Flex justify="space-between" align="center" mb={1} gap={2} wrap="wrap">
                    <Box><Heading size="xs">All-candidate mobilization pipeline</Heading><Text fontSize="10px" color="gray.600">Candidate, current step, and estimated KSA arrival.</Text></Box>
                    {countryFilter !== 'All countries' && <Button size="xs" variant="ghost" onClick={() => setCountryFilter('All countries')}>Clear filter</Button>}
                  </Flex>
                  <Stack spacing={1}>
                    {visibleCases.map((item) => {
                      const activeStageIndex = Math.max(0, pipelineStages.indexOf(item.stage));
                      const daysUntil = getDaysUntilArrival(item.arrival);
                      return (
                        <Box key={item.ref} p={1.5} borderWidth="1px" borderRadius="md">
                          <Flex justify="space-between" align="center" gap={2} mb={1}>
                            <Box>
                              <HStack spacing={1} flexWrap="wrap">
                                <Text fontWeight="bold" fontSize="sm">{item.candidate}</Text>
                                <Badge fontSize="9px" colorScheme="blue" px={1}>{item.country}</Badge>
                                <Text fontSize="10px" color="gray.500">{item.ref}</Text>
                              </HStack>
                              <Text fontSize="xs" color="gray.600">{item.position}</Text>
                            </Box>
                            <Box textAlign="right">
                              <Text fontSize="9px" color="gray.500">EST. ARRIVAL · {formatArrivalDate(item.arrival)}</Text>
                              <Text fontSize="10px" color={daysUntil < 0 ? 'orange.600' : 'gray.500'}>
                                {daysUntil < 0 ? `${Math.abs(daysUntil)}d past` : daysUntil === 0 ? 'Today' : `~${daysUntil}d`}
                              </Text>
                            </Box>
                          </Flex>
                          <Box overflowX="auto">
                            <Flex minW="700px" align="flex-start">
                              {pipelineStages.map((stage, index) => {
                                const isComplete = index < activeStageIndex;
                                const isCurrent = index === activeStageIndex;
                                const color = isComplete ? 'green' : isCurrent ? 'purple' : 'gray';
                                return (
                                  <React.Fragment key={stage}>
                                    <VStack spacing={0} flex="1" minW="90px" textAlign="center">
                                      <Box
                                        w="18px"
                                        h="18px"
                                        borderRadius="full"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        bg={isComplete ? 'green.500' : isCurrent ? 'purple.600' : 'gray.100'}
                                        color={isComplete || isCurrent ? 'white' : 'gray.500'}
                                        borderWidth={isCurrent ? '3px' : '1px'}
                                        borderColor={isCurrent ? 'purple.200' : 'transparent'}
                                        fontWeight="bold"
                                        fontSize="10px"
                                      >
                                        {isComplete ? <FiCheck /> : index + 1}
                                      </Box>
                                      <Text fontSize="10px" lineHeight="shorter" fontWeight={isCurrent ? 'bold' : 'medium'} color={isCurrent ? 'purple.700' : isComplete ? 'green.700' : 'gray.500'}>{stage}</Text>
                                      {isCurrent && <Badge colorScheme={color} fontSize="8px" lineHeight="1" px={1}>NOW</Badge>}
                                    </VStack>
                                    {index < pipelineStages.length - 1 && (
                                      <Box flex="1" minW="16px" h="1px" mt="9px" bg={index < activeStageIndex ? 'green.400' : 'gray.200'} />
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </Flex>
                          </Box>
                          <Flex justify="space-between" align="center" mt={0.5} gap={1} wrap="wrap">
                            <Text fontSize="10px" color="gray.600">Now: <b>{item.stage}</b> · {item.services.join(', ')}</Text>
                            <Text fontSize="10px" color="gray.500">{item.supplier}</Text>
                          </Flex>
                        </Box>
                      );
                    })}
                    {visibleCases.length === 0 && <Text color="gray.500" textAlign="center" py={6}>No demo candidates for this country yet.</Text>}
                  </Stack>
                </CardBody>
              </Card>
            </>
          ) : hrPage === 'suppliers' ? (
            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5} alignItems="start">
              <Card>
                <CardBody>
                  <Heading size="sm" mb={1}>Supplier directory</Heading>
                  <Text fontSize="sm" color="gray.600" mb={4}>Supplier profiles and service coverage are managed in the shared ERP directory, not duplicated in this demo.</Text>
                  <Stack spacing={4}>
                    <Button colorScheme="purple" leftIcon={<FiUsers />} onClick={() => navigate('/suppliers')}>
                      Open ERP supplier directory
                    </Button>
                    <Divider />
                    <Box>
                      <Heading size="sm" mb={1}>Add a custom country</Heading>
                      <Text fontSize="sm" color="gray.600" mb={3}>The country will be available in supplier coverage, candidate cases, and country filters.</Text>
                      <HStack align="end">
                        <FormControl isRequired>
                          <FormLabel>Country name</FormLabel>
                          <Input value={customCountryName} onChange={(event) => setCustomCountryName(event.target.value)} placeholder="e.g. Nepal" />
                        </FormControl>
                        <Button
                          colorScheme="teal"
                          leftIcon={<FiPlus />}
                          onClick={addCustomCountry}
                          isDisabled={!customCountryName.trim() || countryOptions.some((country) => country.toLocaleLowerCase() === customCountryName.trim().replace(/\s+/g, ' ').toLocaleLowerCase())}
                        >
                          Add country
                        </Button>
                      </HStack>
                    </Box>
                    <Divider />
                    <Box>
                      <Heading size="sm" mb={1}>Add a custom service</Heading>
                      <Text fontSize="sm" color="gray.600" mb={3}>Add another mobilization service to the catalogue, then suppliers can offer it.</Text>
                      <Stack spacing={3}>
                        <FormControl isRequired>
                          <FormLabel>Service name</FormLabel>
                          <Input value={customServiceName} onChange={(event) => setCustomServiceName(event.target.value)} placeholder="e.g. Translation and notarization" />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Description / required action</FormLabel>
                          <Input value={customServiceDescription} onChange={(event) => setCustomServiceDescription(event.target.value)} placeholder="What should the assigned supplier complete?" />
                        </FormControl>
                        <Button
                          variant="outline"
                          colorScheme="teal"
                          leftIcon={<FiPlus />}
                          onClick={addCustomService}
                          isDisabled={!customServiceName.trim() || services.some((service) => service.name.toLocaleLowerCase() === customServiceName.trim().toLocaleLowerCase())}
                        >
                          Add custom service
                        </Button>
                      </Stack>
                    </Box>
                  </Stack>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <Heading size="sm" mb={3}>Service catalogue ({services.length})</Heading>
                  <Stack spacing={2} mb={5}>
                    {services.map((service) => (
                      <Box key={service.id} p={2} borderWidth="1px" borderRadius="md">
                        <Text fontWeight="semibold" fontSize="sm">{service.name}</Text>
                        <Text fontSize="xs" color="gray.600">{service.description}</Text>
                      </Box>
                    ))}
                  </Stack>
                  <Divider mb={4} />
                  <Heading size="sm" mb={3}>Saved suppliers ({suppliers.length})</Heading>
                  {supplierRecords === undefined
                    ? <Text fontSize="sm" color="gray.500">Loading saved suppliers…</Text>
                    : suppliers.length === 0
                      ? <Text fontSize="sm" color="gray.500">No active suppliers are saved for this organization yet. Add suppliers in the ERP supplier directory, then mark their mobilization services offered.</Text>
                      : <Stack spacing={3}>
                    {suppliers.map((supplier) => (
                      <Box key={supplier.id} p={3} borderWidth="1px" borderRadius="md">
                        <Flex justify="space-between" gap={3} align="start">
                          <Box>
                            <Text fontWeight="bold">{supplier.name}</Text>
                            <Text fontSize="sm" color="gray.600">{supplier.country}</Text>
                          </Box>
                          <Badge colorScheme="purple">{supplier.serviceIds.length} services</Badge>
                        </Flex>
                        <Text fontSize="xs" color="gray.500" mt={2}>
                          {supplier.serviceIds.map((serviceId) => services.find((service) => service.id === serviceId)?.name).filter(Boolean).join(', ')}
                        </Text>
                      </Box>
                    ))}
                  </Stack>}
                </CardBody>
              </Card>
            </SimpleGrid>
          ) : (
            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5} alignItems="start">
              <Card>
                <CardBody>
                  <Heading size="sm" mb={1}>1. Candidate and hiring details</Heading>
                  <Text fontSize="sm" color="gray.600" mb={4}>This sample form creates a local demo case only.</Text>
                  <Stack spacing={3}>
                    <FormControl isRequired><FormLabel>Candidate name</FormLabel><Input value={candidateName} onChange={(event) => setCandidateName(event.target.value)} /></FormControl>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                      <FormControl><FormLabel>Hiring country</FormLabel><Select value={candidateCountry} onChange={(event) => setCandidateCountry(event.target.value)}>{countryOptions.map((item) => <option key={item}>{item}</option>)}</Select></FormControl>
                      <FormControl isRequired><FormLabel>Position</FormLabel><Input value={candidatePosition} onChange={(event) => setCandidatePosition(event.target.value)} placeholder="e.g. Mechanical Technician" /></FormControl>
                    </SimpleGrid>
                    <FormControl><FormLabel>Tentative KSA arrival date</FormLabel><Input type="date" value={tentativeArrival} onChange={(event) => setTentativeArrival(event.target.value)} /></FormControl>
                  </Stack>
                  <Divider my={5} />
                  <Heading size="sm" mb={1}>2. Select applicable services and providers</Heading>
                  <Text fontSize="sm" color="gray.600" mb={3}>Choose only what this candidate needs. Supplier options are matched to the hiring country using the supplier’s recorded coverage.</Text>
                  <Stack spacing={3}>
                    {services.map((service) => {
                      const selected = selectedSetupServices.includes(service.id);
                      const choices = availableSuppliers(service.id);
                      return (
                        <Box key={service.id} p={3} borderWidth="1px" borderRadius="md">
                          <Checkbox isChecked={selected} onChange={(event) => setSelectedSetupServices((current) => event.target.checked ? [...current, service.id] : current.filter((id) => id !== service.id))}>
                            <Text fontWeight="semibold" fontSize="sm">{service.name}</Text>
                          </Checkbox>
                          <Text fontSize="xs" color="gray.600" ml={6}>{service.description}</Text>
                          {selected && (choices.length > 0
                            ? <HStack mt={2} ml={6}><Text fontSize="xs" minW="90px">Assign provider</Text><Select size="sm" value={selectedSupplierForService(service.id)} onChange={(event) => setSetupProviders((current) => ({ ...current, [service.id]: event.target.value }))}>{choices.map((supplier) => <option key={supplier.id} value={supplier.name}>{supplier.name} · {supplier.country}</option>)}</Select></HStack>
                            : <Text mt={2} ml={6} fontSize="xs" color="orange.600">No supplier offers this service yet. Add one in Manage suppliers.</Text>)}
                        </Box>
                      );
                    })}
                  </Stack>
                </CardBody>
              </Card>
              <VStack align="stretch" spacing={5}>
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={1}>3. Reminder and notification policy</Heading>
                    <Text fontSize="sm" color="gray.600" mb={4}>Proposed demo schedule. HR can tune it per case and pause reminders.</Text>
                    <SimpleGrid columns={2} spacing={3}>
                      <FormControl><FormLabel fontSize="sm">First reminder before due date (days)</FormLabel><Input type="number" min={0} value={reminderDaysBefore} onChange={(event) => setReminderDaysBefore(Math.max(0, Number(event.target.value)))} /></FormControl>
                      <FormControl><FormLabel fontSize="sm">Repeat overdue reminder every (days)</FormLabel><Input type="number" min={1} value={reminderIntervalDays} onChange={(event) => setReminderIntervalDays(Math.max(1, Number(event.target.value)))} /></FormControl>
                    </SimpleGrid>
                    <VStack align="stretch" spacing={2} mt={4} fontSize="sm">
                      <Text><b>On case start:</b> candidate confirms interest with YES/NO before secure registration; each assigned provider accepts or declines with 1/2; HR receives the case summary.</Text>
                      <Text><b>On task updates:</b> candidate and provider receive numbered status choices; HR receives structured completion, blocker, or conflicting-report alerts.</Text>
                      <Text><b>Reminders:</b> first at the configured lead time, repeat at the configured interval while overdue; stop when verified, paused, or cancelled. Escalate to HR after 2 missed reminders.</Text>
                    </VStack>
                    <Divider my={4} />
                    <Heading size="xs" mb={3}>Message previews by recipient</Heading>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                      <Box p={3} bg="teal.50" borderRadius="md">
                        <Text fontSize="xs" fontWeight="bold" color="teal.700">CANDIDATE · CASE START</Text>
                        <Text fontSize="sm" mt={1}>Do you agree to proceed with the {candidatePosition || 'employment'} opportunity in KSA? Reply YES or NO. After YES, we’ll send a secure registration link. Tentative arrival: {tentativeArrival || 'to be confirmed'}.</Text>
                      </Box>
                      <Box p={3} bg="purple.50" borderRadius="md">
                        <Text fontSize="xs" fontWeight="bold" color="purple.700">EACH SERVICE PROVIDER</Text>
                        <Text fontSize="sm" mt={1}>New {candidateCountry} service task assigned. Accept this assignment? Reply 1 Accept or 2 Decline. If accepted, choose a target completion date from the secure task link. Status replies: 1 Accepted  2 In progress  3 Completed  4 Blocked.</Text>
                      </Box>
                      <Box p={3} bg="blue.50" borderRadius="md">
                        <Text fontSize="xs" fontWeight="bold" color="blue.700">HR · CASE SUMMARY / EXCEPTION</Text>
                        <Text fontSize="sm" mt={1}>Case started with {selectedSetupServices.length} services. You’ll be notified when a provider accepts, an update needs review, a task is overdue, or an arrival date changes.</Text>
                      </Box>
                    </SimpleGrid>
                    <Text fontSize="xs" color="gray.500" mt={3}>Candidate and provider messages contain only the assigned person’s relevant action. Real WhatsApp templates, opt-in, quiet hours, and delivery rules must be configured before production use.</Text>
                  </CardBody>
                </Card>
                <Card borderColor="purple.200" borderWidth="1px">
                  <CardBody>
                    <Heading size="sm">Review before starting</Heading>
                    <Text fontSize="sm" color="gray.600" mt={2}>{candidateName || 'Candidate'} · {candidateCountry} · {candidatePosition || 'Position not entered'}</Text>
                    <Text fontSize="sm" mt={2}>{selectedSetupServices.length} selected services · tentative arrival {tentativeArrival || 'not set'}</Text>
                    <Text fontSize="xs" color="gray.500" mt={2}>The selected providers receive separate task notices; the candidate receives only candidate-facing actions.</Text>
                    <Button mt={4} width="full" colorScheme="purple" leftIcon={<FiCheck />} isDisabled={!candidateName.trim() || !candidatePosition.trim() || selectedSetupServices.length === 0 || !selectedServicesHaveSuppliers} onClick={startCase}>Start demo mobilization</Button>
                    {!selectedServicesHaveSuppliers && <Text fontSize="xs" color="orange.600" mt={2}>Assign a supplier to every selected service before starting this demo case.</Text>}
                  </CardBody>
                </Card>
              </VStack>
            </SimpleGrid>
          )}
        </VStack>
      ) : (
      <>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={5}>
        <Card><CardBody>
          {role === 'transport' ? (
            <>
              <HStack justify="space-between"><Box><Text fontSize="sm" color="gray.500">Pickup assignment</Text><Heading size="md">RUH · Demo</Heading></Box><Icon as={FiMapPin} color="blue.500" boxSize={6} /></HStack>
              <Text mt={2} fontWeight="semibold">King Khalid International Airport</Text>
              <Text fontSize="sm" color="gray.600">{landed ? 'Candidate is ready for pickup' : 'Expected arrival · 26 Oct · 18:40'}</Text>
            </>
          ) : (
            <>
              <HStack justify="space-between"><Box><Text fontSize="sm" color="gray.500">{role === 'candidate' ? 'My case' : assignedProvider ? 'Assigned candidate' : 'Candidate case'}</Text><Heading size="md">{role === 'transport' ? 'Pickup · RUH' : 'MOB-2026-014'}</Heading></Box><Avatar name="Demo Candidate" size="md" bg="teal.500" /></HStack>
              <Text mt={2} fontWeight="semibold">{activeCandidate.name}</Text>
              <Text fontSize="sm" color="gray.600">{role === 'hr' || role === 'candidate' ? `${activeCandidate.country} · ${activeCandidate.position} · Riyadh` : 'Candidate assigned to your service'}</Text>
            </>
          )}
        </CardBody></Card>
        <Card><CardBody>
          <HStack justify="space-between" mb={3}><Text fontSize="sm" color="gray.500">{progressTitle}</Text><Text fontWeight="bold">{role === 'hr' ? `${completedCount}/${tasks.length}` : assignedProvider ? `${providerVerifiedCount}/${visibleTasks.length}` : role === 'candidate' ? visibleTasks.length : landed ? 'Ready' : 'Pending'}</Text></HStack>
          <Progress value={progressValue} colorScheme="teal" borderRadius="full" mb={2} />
          <Text fontSize="sm" color="gray.600">{progressDetail}</Text>
        </CardBody></Card>
        <Card><CardBody>
          <HStack mb={2}><Icon as={FiShield} color="green.500" /><Text fontWeight="semibold">Scoped demo view</Text></HStack>
          <Text fontSize="sm" color="gray.600">{role === 'hr' ? 'HR can review the full case and control service selection.' : role === 'candidate' ? 'You can see and update only your own candidate actions.' : role === 'transport' ? 'Only arrival and pickup information is shown.' : 'Only tasks assigned to your agency are shown.'}</Text>
        </CardBody></Card>
      </SimpleGrid>

      <Heading size="md" mb={1}>{titleByRole[role]}</Heading>
      <Text color="gray.600" fontSize="sm" mb={4}>{roleDescription[role]}</Text>

      {role === 'hr' && (
        <Card mb={5} borderColor="purple.200" borderWidth="1px">
          <CardBody>
            <Flex justify="space-between" align={{ base: 'start', md: 'center' }} gap={3} direction={{ base: 'column', md: 'row' }}>
              <Box>
                <Heading size="sm">Choose services for this candidate</Heading>
                <Text fontSize="sm" color="gray.600" mt={1}>Select any combination; only selected work appears in the case.</Text>
              </Box>
              <Tag colorScheme="purple">{tasks.length} selected</Tag>
            </Flex>
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={3} mt={4}>
              {services.map((service) => (
                <Checkbox key={service.id} isChecked={selectedServices.has(service.id)} onChange={() => toggleService(service.id)} alignItems="start" p={3} borderWidth="1px" borderRadius="md">
                  <Box ml={2}>
                    <Text fontWeight="semibold" fontSize="sm">{service.name}</Text>
                    <Text fontSize="xs" color="gray.600" whiteSpace="normal">{service.description}</Text>
                  </Box>
                </Checkbox>
              ))}
            </SimpleGrid>
          </CardBody>
        </Card>
      )}

      <SimpleGrid columns={{ base: 1, xl: role === 'transport' ? 1 : 2 }} spacing={5} alignItems="start">
        {role === 'transport' ? (
          <Card>
            <CardBody>
              <HStack mb={2}><Icon as={FiGlobe} color="blue.500" /><Heading size="sm">Arrival board</Heading></HStack>
              <Text color="gray.600" fontSize="sm" mb={4}>Only arrival and pickup details are displayed to the assigned transport role.</Text>
              <Box p={4} bg="gray.50" borderRadius="lg" borderWidth="1px">
                <HStack justify="space-between" flexWrap="wrap">
                  <Box><Text fontWeight="bold">{activeCandidate.name}</Text><Text fontSize="sm" color="gray.600">King Khalid International Airport · RUH</Text></Box>
                  <Badge colorScheme={landed ? 'orange' : 'blue'}>{landed ? 'Landed · pickup needed' : `Expected ${activeCandidate.arrival} · 18:40`}</Badge>
                </HStack>
                {landed && <Alert status="warning" mt={4} borderRadius="md"><AlertIcon />Candidate reported landing. Please acknowledge pickup and confirm handover.</Alert>}
                <HStack mt={4} spacing={3}>
                  <Button colorScheme="blue" leftIcon={<FiCheck />} onClick={() => appendMessage('Transport coordinator', 'provider', 'Pickup acknowledged. Driver is on the way.')}>Acknowledge pickup</Button>
                  <Button variant="outline" isDisabled={!landed} onClick={() => appendMessage('Transport coordinator', 'provider', 'Candidate pickup and handover confirmed.')}>Confirm handover</Button>
                </HStack>
              </Box>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              <Flex justify="space-between" align="center" mb={4}>
                <Box><Heading size="sm">{role === 'candidate' ? 'Your required actions' : assignedProvider ? 'Your assigned tasks' : 'Case service checklist'}</Heading><Text fontSize="sm" color="gray.600">Updates are tracked by reporter and verification status.</Text></Box>
                <Icon as={role === 'candidate' ? FiUsers : FiFileText} color="blue.500" boxSize={5} />
              </Flex>
              {visibleTasks.length === 0 ? <Text color="gray.500">No services are currently selected for this view.</Text> : (
                <Stack spacing={3}>
                  {visibleTasks.map((task) => (
                    <Box key={task.id} p={4} borderWidth="1px" borderRadius="lg">
                      <Flex justify="space-between" align="start" gap={3}>
                        <Box>
                          <Text fontWeight="bold">{task.name}</Text>
                          <Text fontSize="sm" color="gray.600" mt={1}>{task.description}</Text>
                        </Box>
                        <Badge colorScheme={statusColor[task.status]} whiteSpace="nowrap">{statusLabel[task.status]}</Badge>
                      </Flex>
                      <HStack mt={3} spacing={3} wrap="wrap" fontSize="xs" color="gray.600">
                        <HStack><FiClock /><Text>Due {task.due}</Text></HStack>
                        {role !== 'candidate' && <Text>Assigned to {task.provider}</Text>}
                      </HStack>
                      {assignedProvider && (
                        <Box mt={3} p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
                          <FormControl>
                            <FormLabel fontSize="xs" mb={1}>Who will perform this service?</FormLabel>
                            <Select
                              size="sm"
                              value={task.providerFulfillment || ''}
                              placeholder="Choose a closed-ended response"
                              onChange={(event) => updateProviderFulfillment(task, event.target.value as ProviderFulfillment)}
                            >
                              <option value="direct">1 · Our organization</option>
                              <option value="subcontractor_identified">2 · Subcontractor identified</option>
                              <option value="subcontractor_pending">3 · Subcontractor not yet identified</option>
                              <option value="unable">4 · We cannot provide this service</option>
                            </Select>
                          </FormControl>
                          {task.providerFulfillment === 'subcontractor_identified' && !task.subcontractorName && (
                            <Stack spacing={2} mt={3}>
                              <Text fontSize="xs" color="gray.600">Enter the downstream agent details. They will be sent to HR for review; no account or case access is granted yet.</Text>
                              <Input
                                size="sm"
                                placeholder="Subcontractor / agent name"
                                value={subcontractorDrafts[task.id]?.name || ''}
                                onChange={(event) => setSubcontractorDrafts((current) => ({ ...current, [task.id]: { name: event.target.value, country: current[task.id]?.country || '', contact: current[task.id]?.contact || '' } }))}
                              />
                              <Select
                                size="sm"
                                placeholder="Subcontractor country"
                                value={subcontractorDrafts[task.id]?.country || ''}
                                onChange={(event) => setSubcontractorDrafts((current) => ({ ...current, [task.id]: { name: current[task.id]?.name || '', country: event.target.value, contact: current[task.id]?.contact || '' } }))}
                              >
                                {countryOptions.map((country) => <option key={country}>{country}</option>)}
                              </Select>
                              <Input
                                size="sm"
                                placeholder="Business WhatsApp / contact"
                                value={subcontractorDrafts[task.id]?.contact || ''}
                                onChange={(event) => setSubcontractorDrafts((current) => ({ ...current, [task.id]: { name: current[task.id]?.name || '', country: current[task.id]?.country || '', contact: event.target.value } }))}
                              />
                              <Button
                                size="sm"
                                colorScheme="purple"
                                onClick={() => submitSubcontractorDetails(task)}
                                isDisabled={!subcontractorDrafts[task.id]?.name.trim() || !subcontractorDrafts[task.id]?.country || !subcontractorDrafts[task.id]?.contact.trim()}
                              >
                                Submit details to HR
                              </Button>
                            </Stack>
                          )}
                          {task.subcontractorName && (
                            <Box mt={3}>
                              <Text fontSize="sm" fontWeight="semibold">{task.subcontractorName}</Text>
                              <Text fontSize="xs" color="gray.600">{task.subcontractorCountry} · {task.subcontractorContact}</Text>
                              <Badge mt={2} colorScheme={task.subcontractorReview === 'approved' ? 'green' : 'orange'}>
                                {task.subcontractorReview === 'approved' ? 'HR approved' : 'Awaiting HR review'}
                              </Badge>
                            </Box>
                          )}
                        </Box>
                      )}
                      {role === 'hr' && task.subcontractorName && (
                        <Box mt={3} p={3} bg={task.subcontractorReview === 'approved' ? 'green.50' : 'orange.50'} borderRadius="md">
                          <Text fontSize="xs" fontWeight="bold">SUBCONTRACTOR REVIEW</Text>
                          <Text fontSize="sm" fontWeight="semibold">{task.subcontractorName}</Text>
                          <Text fontSize="xs" color="gray.600">{task.subcontractorCountry} · {task.subcontractorContact} · Service: {task.name}</Text>
                          <Text fontSize="xs" color="gray.600">Accountable supplier: {task.provider}. Subcontractor access remains off until separately invited and verified.</Text>
                          {task.subcontractorReview !== 'approved' && (
                            <HStack mt={2}>
                              <Button size="xs" colorScheme="green" onClick={() => reviewSubcontractor(task, true)}>Approve details</Button>
                              <Button size="xs" variant="outline" onClick={() => reviewSubcontractor(task, false)}>Request clarification</Button>
                            </HStack>
                          )}
                        </Box>
                      )}
                      {role === 'candidate' && task.candidateAction && task.status !== 'verified' && (
                        <Button size="sm" mt={3} colorScheme="teal" leftIcon={<FiCheck />} onClick={() => markCandidateComplete(task)}>
                          Mark my part complete
                        </Button>
                      )}
                      {(assignedProvider || role === 'hr') && task.status !== 'verified' && (
                        <HStack mt={3} spacing={2}>
                          {assignedProvider && <Button size="sm" colorScheme="green" leftIcon={<FiCheckCircle />} onClick={() => verifyTask(task)}>Verify / update complete</Button>}
                          {role === 'hr' && <>
                            <Button size="sm" variant="outline" leftIcon={<FiBell />} onClick={() => sendReminder(task)}>Send reminder</Button>
                            {task.status === 'candidate_reported' && <Button size="sm" colorScheme="green" onClick={() => verifyTask(task)}>Record provider verification</Button>}
                          </>}
                        </HStack>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
              {role === 'candidate' && (
                <Box mt={4} p={4} bg="blue.50" borderRadius="lg">
                  <HStack mb={2}><Icon as={FiMapPin} color="blue.500" /><Text fontWeight="bold">Arrival check-in</Text></HStack>
                  <Text fontSize="sm" color="gray.700" mb={3}>After landing in Saudi Arabia, tell the company transport team you have arrived.</Text>
                  <Button size="sm" colorScheme="blue" leftIcon={<FiMapPin />} onClick={reportArrival} isDisabled={landed}>
                    {landed ? 'Arrival reported' : 'I have landed'}
                  </Button>
                </Box>
              )}
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody>
            <HStack justify="space-between" mb={3}>
              <Box><HStack><Icon as={FaWhatsapp} color="green.500" /><Heading size="sm">WhatsApp conversation</Heading></HStack><Text fontSize="xs" color="gray.500" mt={1}>Interactive simulator · not connected to WhatsApp</Text></Box>
              <Badge colorScheme="green">SIMULATED</Badge>
            </HStack>
            <Divider mb={3} />
            <VStack align="stretch" spacing={3} maxH="420px" overflowY="auto" bg="#f4f7f4" p={3} borderRadius="lg">
              {messages.map((message) => (
                <Box key={message.id} alignSelf={message.role === 'candidate' ? 'flex-end' : 'flex-start'} maxW="90%" bg={message.role === 'system' ? 'blue.50' : message.role === 'candidate' ? 'green.100' : 'white'} borderWidth="1px" borderColor="blackAlpha.100" borderRadius="lg" px={3} py={2}>
                  <Text fontSize="xs" fontWeight="bold" color="gray.600">{message.from}</Text>
                  <Text fontSize="sm">{message.text}</Text>
                  <Text textAlign="right" fontSize="10px" color="gray.500">{message.time}</Text>
                </Box>
              ))}
            </VStack>
            <HStack mt={3} flexWrap="wrap">
              {role === 'hr' && tasks.filter((task) => task.status !== 'verified').slice(0, 2).map((task) => (
                <Button key={task.id} size="xs" variant="outline" leftIcon={<FiBell />} onClick={() => sendReminder(task)}>Remind: {task.name}</Button>
              ))}
              {assignedProvider && visibleTasks.filter((task) => task.status !== 'verified').slice(0, 1).map((task) => (
                <Button key={task.id} size="xs" colorScheme="green" variant="outline" onClick={() => verifyTask(task)}>Verify {task.name}</Button>
              ))}
              {role === 'candidate' && visibleTasks.filter((task) => task.candidateAction && task.status !== 'verified').slice(0, 1).map((task) => (
                <Button key={task.id} size="xs" colorScheme="teal" variant="outline" onClick={() => markCandidateComplete(task)}>Reply: completed</Button>
              ))}
              {role === 'transport' && <Button size="xs" variant="outline" onClick={() => appendMessage('Transport coordinator', 'provider', 'Pickup acknowledged. Driver is on the way.')}>Simulate pickup update</Button>}
              <Button size="xs" variant="ghost" leftIcon={<FiPlus />} onClick={sendClosedEndedCheckIn}>Send closed-ended check-in</Button>
              {role === 'candidate' && <>
                <Button size="xs" colorScheme="teal" variant="outline" onClick={() => simulateClosedEndedReply('YES — I agree to proceed.')}>Reply: YES</Button>
                <Button size="xs" variant="outline" onClick={() => simulateClosedEndedReply('2 — Not completed.')}>Reply: Not completed</Button>
                <Button size="xs" variant="outline" onClick={() => simulateClosedEndedReply('4 — Need assistance.')}>Reply: Need assistance</Button>
              </>}
              {assignedProvider && <>
                <Button size="xs" colorScheme="green" variant="outline" onClick={() => simulateClosedEndedReply('1 — Assignment accepted.')}>Reply: Accept</Button>
                <Button size="xs" variant="outline" onClick={() => simulateClosedEndedReply('2 — In progress.')}>Reply: In progress</Button>
                <Button size="xs" variant="outline" onClick={() => simulateClosedEndedReply('4 — Blocked: appointment unavailable.')}>Reply: Blocked</Button>
              </>}
              {role === 'transport' && <>
                <Button size="xs" variant="outline" onClick={() => simulateClosedEndedReply('1 — Pickup accepted.')}>Reply: Accept pickup</Button>
                <Button size="xs" variant="outline" onClick={() => simulateClosedEndedReply('2 — Driver en route.')}>Reply: En route</Button>
              </>}
              {role === 'hr' && <>
                <Button size="xs" variant="outline" onClick={() => simulateClosedEndedReply('1 — Evidence review selected.')}>Review evidence</Button>
                <Button size="xs" variant="outline" onClick={() => simulateClosedEndedReply('3 — Case paused.')}>Pause case</Button>
              </>}
            </HStack>
            <HStack mt={3} color="gray.500" fontSize="xs"><Icon as={FiMessageCircle} /><Text>Message history is part of this local demo only.</Text></HStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card mt={5}>
        <CardBody>
          <HStack mb={3}><Icon as={FiGlobe} color="purple.500" /><Heading size="sm">Case activity</Heading></HStack>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
            <HStack align="start"><Avatar size="xs" name="HR" /><Box><Text fontSize="sm" fontWeight="semibold">HR controls service scope</Text><Text fontSize="xs" color="gray.600">Add or remove services for this candidate.</Text></Box></HStack>
            <HStack align="start"><Avatar size="xs" name="Provider" bg="orange.500" /><Box><Text fontSize="sm" fontWeight="semibold">Providers report their work</Text><Text fontSize="xs" color="gray.600">Provider verification is separate from candidate self-report.</Text></Box></HStack>
            <HStack align="start"><Avatar size="xs" name="Reminder" bg="blue.500" /><Box><Text fontSize="sm" fontWeight="semibold">Follow-ups stay visible</Text><Text fontSize="xs" color="gray.600">Simulated reminders are appended to the conversation.</Text></Box></HStack>
          </SimpleGrid>
        </CardBody>
      </Card>
      </>
      )}
    </Box>
  );
};

export default InternationalHiringDemoScreen;
