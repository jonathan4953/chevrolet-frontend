import React, { useState, useEffect, useMemo } from "react";
import { api } from "./api";

// ============================================================
// OmniRH.jsx — Módulo Completo de Gestão de RH (MODO CLARO)
// ============================================================

const formatBRL = (n) => Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

// Sub-tab button
const Tab = ({ active, label, icon, onClick }) => (
  <button onClick={onClick} style={{
    padding: '8px 16px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer',
    border: active ? '1px solid #F26B25' : '1px solid #E5E7EB', transition: 'all 0.2s',
    background: active ? '#F26B25' : '#F9FAFB',
    color: active ? '#FFFFFF' : '#636466',
    boxShadow: active ? '0 4px 12px rgba(242, 107, 37, 0.25)' : 'none',
  }}>
    <span style={{ marginRight: 6 }}>{icon}</span>{label}
  </button>
);

// KPI card
const KPI = ({ icon, label, value, color = '#F26B25' }) => (
  <div style={{
    background: '#FFFFFF', border: '1px solid #E5E7EB',
    borderRadius: 16, padding: '20px 18px', flex: 1, minWidth: 160,
    borderLeft: `3px solid ${color}`, boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
  }}>
    <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color: '#2A2B2D' }}>{value}</div>
    <div style={{ fontSize: 10, color: '#8E9093', textTransform: 'uppercase', fontWeight: 700, marginTop: 4 }}>{label}</div>
  </div>
);

// Data table row cell
const Td = ({ children, w }) => (
  <td style={{ padding: '10px 12px', fontSize: 12, color: '#3D3E40', width: w }}>{children}</td>
);

const Th = ({ children }) => (
  <th style={{ padding: '8px 12px', fontSize: 10, color: '#636466', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 700, textTransform: 'uppercase' }}>{children}</th>
);

const Badge = ({ text, color = '#636466' }) => (
  <span style={{
    padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700,
    background: `${color}15`, color, border: `1px solid ${color}33`
  }}>{text}</span>
);

const Card = ({ children, style = {} }) => (
  <div style={{
    background: '#FFFFFF', border: '1px solid #E5E7EB',
    borderRadius: 16, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', ...style
  }}>{children}</div>
);

const SectionTitle = ({ icon, text }) => (
  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#F26B25', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
    {icon} {text}
  </h3>
);

const Btn = ({ children, onClick, color = '#F26B25', disabled = false, small = false }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: small ? '6px 14px' : '10px 20px', borderRadius: 10, fontWeight: 700,
    fontSize: small ? 10 : 12, border: 'none', cursor: disabled ? 'default' : 'pointer',
    background: color, color: '#FFFFFF',
    opacity: disabled ? 0.5 : 1, boxShadow: disabled ? 'none' : `0 4px 12px ${color}44`,
  }}>{children}</button>
);

const Input = ({ label, value, onChange, type = 'text', placeholder = '', required = false }) => (
  <div style={{ marginBottom: 10 }}>
    <label style={{ fontSize: 10, color: '#8E9093', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      required={required}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 12,
        background: '#FFFFFF', border: '1px solid #D4D5D6',
        color: '#2A2B2D', outline: 'none', boxSizing: 'border-box'
      }} />
  </div>
);

const Select = ({ label, value, onChange, options, placeholder = 'Selecione...' }) => (
  <div style={{ marginBottom: 10 }}>
    <label style={{ fontSize: 10, color: '#8E9093', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 12,
      background: '#FFFFFF', border: '1px solid #D4D5D6',
      color: '#2A2B2D', outline: 'none', boxSizing: 'border-box'
    }}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);


export default function OmniRH({ styles, currentUser, showToast, logAction }) {
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // Data
  const [kpis, setKpis] = useState({});
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [feed, setFeed] = useState([]);
  const [orgchart, setOrgchart] = useState({ tree: [], flat: [] });
  const [promotions, setPromotions] = useState([]);

  // Filters
  const [searchEmp, setSearchEmp] = useState('');
  const [payrollMonth, setPayrollMonth] = useState('');
  const [attendanceMonth, setAttendanceMonth] = useState('');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [vacationStatus, setVacationStatus] = useState('');
  const [vacationSearch, setVacationSearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  const [trainingSearch, setTrainingSearch] = useState('');

  // Formulários de registro
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [attForm, setAttForm] = useState({ employee_id: '', date: new Date().toISOString().split('T')[0], check_in: '', check_out: '' });
  const [showVacationForm, setShowVacationForm] = useState(false);
  const [vacForm, setVacForm] = useState({ employee_id: '', start_date: '', end_date: '', notes: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [revForm, setRevForm] = useState({ employee_id: '', reviewer_id: '', period: '', score: '', feedback: '', goals: '' });
  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const [trnForm, setTrnForm] = useState({ name: '', provider: '', duration: '', description: '' });

  // Forms
  const [empForm, setEmpForm] = useState({ name: '', cpf: '', email: '', phone: '', hire_date: '', salary: '', department_id: '', position_id: '', employment_type: 'CLT', status: 'Ativo', birth_date: '', gender: '', address: '', photo_url: '' });
  const [deptForm, setDeptForm] = useState({ name: '', cost_center: '' });
  const [posForm, setPosForm] = useState({ name: '', department_id: '', level: 'Pleno' });
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Organograma: nós expandidos + busca
  const [expandedNodes, setExpandedNodes] = useState({});
  const [orgSearch, setOrgSearch] = useState('');
  const [orgHighlight, setOrgHighlight] = useState(null);

  // Foto: preview antes de salvar
  const [photoPreview, setPhotoPreview] = useState(null);

  // Edição inline
  const [editingEmp, setEditingEmp] = useState(null);
  const [editingDept, setEditingDept] = useState(null);
  const [editingPos, setEditingPos] = useState(null);
  const [editingAtt, setEditingAtt] = useState(null);
  const [editingVac, setEditingVac] = useState(null);
  const [editingRev, setEditingRev] = useState(null);
  const [editingTrn, setEditingTrn] = useState(null);

  const empId = currentUser?.empresa_id || 1;

  // ============================================================
  // LOADERS
  // ============================================================
  const load = async (endpoint, setter, params = '') => {
    try { const r = await api.get(`/rh/${endpoint}?empresa_id=${empId}${params}`); setter(r.data); } catch (e) { console.error(e); }
  };

  const loadDashboard = () => {
    load('dashboard', setKpis);
    load('events/feed', setFeed);
  };

  useEffect(() => {
    if (tab === 'dashboard') loadDashboard();
    if (tab === 'employees') { load('employees', setEmployees); load('departments', setDepartments); load('positions', setPositions); }
    if (tab === 'orgchart') { load('orgchart', setOrgchart); load('departments', setDepartments); }
    if (tab === 'payroll') load('payroll', setPayrolls, payrollMonth ? `&reference_month=${payrollMonth}` : '');
    if (tab === 'attendance') load('attendance', setAttendance, (attendanceMonth ? `&month=${attendanceMonth}` : ''));
    if (tab === 'vacations') load('vacations', setVacations, (vacationStatus ? `&status=${vacationStatus}` : ''));
    if (tab === 'performance') load('performance', setReviews);
    if (tab === 'trainings') load('trainings', setTrainings);
    if (tab === 'recruitment') load('jobs', setJobs);
    if (tab === 'insights') { load('events/feed', setFeed); load('promotions', setPromotions); }
    if (tab === 'structure') { load('departments', setDepartments); load('positions', setPositions); }
  }, [tab, payrollMonth, attendanceMonth, vacationStatus]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const createEmployee = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/rh/employees', { ...empForm, empresa_id: empId, salary: Number(empForm.salary) || 0, department_id: empForm.department_id ? Number(empForm.department_id) : null, position_id: empForm.position_id ? Number(empForm.position_id) : null });
      showToast?.('Colaborador cadastrado!', 'success');
      logAction?.('OmniRH', `Cadastrou colaborador: ${empForm.name}`);
      setShowEmpForm(false);
      setPhotoPreview(null);
      setEmpForm({ name: '', cpf: '', email: '', phone: '', hire_date: '', salary: '', department_id: '', position_id: '', employment_type: 'CLT', status: 'Ativo', birth_date: '', gender: '', address: '', photo_url: '' });
      load('employees', setEmployees);
    } catch (er) { showToast?.('Erro ao cadastrar colaborador', 'error'); }
    finally { setLoading(false); }
  };

  const createDepartment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rh/departments', { ...deptForm, empresa_id: empId });
      showToast?.('Departamento criado!', 'success');
      setDeptForm({ name: '', cost_center: '' });
      load('departments', setDepartments);
    } catch (er) { showToast?.('Erro ao criar departamento', 'error'); }
  };

  const createPosition = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rh/positions', { ...posForm, empresa_id: empId, department_id: posForm.department_id ? Number(posForm.department_id) : null });
      showToast?.('Cargo criado!', 'success');
      setPosForm({ name: '', department_id: '', level: 'Pleno' });
      load('positions', setPositions);
    } catch (er) { showToast?.('Erro ao criar cargo', 'error'); }
  };

  const generatePayroll = async () => {
    if (!payrollMonth) { showToast?.('Informe o mês de referência', 'warning'); return; }
    setLoading(true);
    try {
      const r = await api.post('/rh/payroll/generate', { reference_month: payrollMonth, empresa_id: empId });
      showToast?.(`Folha gerada! ${r.data.generated} holerites processados.`, 'success');
      load('payroll', setPayrolls, `&reference_month=${payrollMonth}`);
    } catch (e) { showToast?.('Erro ao gerar folha', 'error'); }
    finally { setLoading(false); }
  };

  const downloadPayslip = async (payrollId) => {
    try {
      const r = await api.get(`/rh/payroll/pdf/${payrollId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a'); a.href = url; a.download = `holerite_${payrollId}.pdf`; a.click();
    } catch (e) { showToast?.('Erro ao gerar PDF', 'error'); }
  };

  // --- REGISTRAR PONTO ---
  const registerAttendance = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rh/attendance', { ...attForm, employee_id: Number(attForm.employee_id), empresa_id: empId });
      showToast?.('Ponto registrado!', 'success');
      setShowAttendanceForm(false);
      setAttForm({ employee_id: '', date: new Date().toISOString().split('T')[0], check_in: '', check_out: '' });
      load('attendance', setAttendance, attendanceMonth ? `&month=${attendanceMonth}` : '');
    } catch (er) { showToast?.('Erro ao registrar ponto', 'error'); }
  };

  // --- SOLICITAR FÉRIAS ---
  const requestVacation = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rh/vacations', { ...vacForm, employee_id: Number(vacForm.employee_id), empresa_id: empId });
      showToast?.('Férias solicitadas!', 'success');
      setShowVacationForm(false);
      setVacForm({ employee_id: '', start_date: '', end_date: '', notes: '' });
      load('vacations', setVacations, vacationStatus ? `&status=${vacationStatus}` : '');
    } catch (er) { showToast?.('Erro ao solicitar férias', 'error'); }
  };

  // --- APROVAR/REJEITAR FÉRIAS ---
  const approveVacation = async (id) => {
    try {
      await api.put(`/rh/vacations/${id}/approve?approved_by=${currentUser?.id || 0}`);
      showToast?.('Férias aprovadas!', 'success');
      load('vacations', setVacations, vacationStatus ? `&status=${vacationStatus}` : '');
    } catch (er) { showToast?.('Erro', 'error'); }
  };
  const rejectVacation = async (id) => {
    try {
      await api.put(`/rh/vacations/${id}/reject`);
      showToast?.('Férias rejeitadas', 'success');
      load('vacations', setVacations, vacationStatus ? `&status=${vacationStatus}` : '');
    } catch (er) { showToast?.('Erro', 'error'); }
  };

  // --- REGISTRAR AVALIAÇÃO ---
  const createReview = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rh/performance', { ...revForm, employee_id: Number(revForm.employee_id), reviewer_id: revForm.reviewer_id ? Number(revForm.reviewer_id) : null, score: Number(revForm.score), empresa_id: empId });
      showToast?.('Avaliação registrada!', 'success');
      setShowReviewForm(false);
      setRevForm({ employee_id: '', reviewer_id: '', period: '', score: '', feedback: '', goals: '' });
      load('performance', setReviews);
    } catch (er) { showToast?.('Erro ao registrar avaliação', 'error'); }
  };

  // --- REGISTRAR TREINAMENTO ---
  const createTraining = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rh/trainings', { ...trnForm, empresa_id: empId });
      showToast?.('Treinamento cadastrado!', 'success');
      setShowTrainingForm(false);
      setTrnForm({ name: '', provider: '', duration: '', description: '' });
      load('trainings', setTrainings);
    } catch (er) { showToast?.('Erro ao cadastrar treinamento', 'error'); }
  };

  // --- EXCLUIR PONTO ---
  const deleteAttendance = async (id) => {
    if (!window.confirm('Excluir este registro de ponto?')) return;
    try { await api.delete(`/rh/attendance/${id}`); showToast?.('Ponto excluído', 'success'); load('attendance', setAttendance, attendanceMonth ? `&month=${attendanceMonth}` : ''); } catch(e) { showToast?.('Erro', 'error'); }
  };

  // --- EDITAR PONTO ---
  const saveEditAttendance = async () => {
    if (!editingAtt) return;
    try {
      await api.put(`/rh/attendance/${editingAtt.id}`, { employee_id: editingAtt.employee_id, date: editingAtt.date, check_in: editingAtt.check_in, check_out: editingAtt.check_out, status: editingAtt.status, empresa_id: empId });
      showToast?.('Ponto atualizado!', 'success');
      setEditingAtt(null);
      load('attendance', setAttendance, attendanceMonth ? `&month=${attendanceMonth}` : '');
    } catch(e) { showToast?.('Erro ao salvar', 'error'); }
  };

  // --- EXCLUIR FÉRIAS ---
  const deleteVacation = async (id) => {
    if (!window.confirm('Excluir esta solicitação de férias?')) return;
    try { await api.delete(`/rh/vacations/${id}`); showToast?.('Férias excluídas', 'success'); load('vacations', setVacations, vacationStatus ? `&status=${vacationStatus}` : ''); } catch(e) { showToast?.('Erro', 'error'); }
  };

  // --- EDITAR FÉRIAS ---
  const saveEditVacation = async () => {
    if (!editingVac) return;
    try {
      await api.post('/rh/vacations', { employee_id: editingVac.employee_id, start_date: editingVac.start_date, end_date: editingVac.end_date, notes: editingVac.notes, empresa_id: empId });
      await api.delete(`/rh/vacations/${editingVac.id}`);
      showToast?.('Férias atualizadas!', 'success');
      setEditingVac(null);
      load('vacations', setVacations, vacationStatus ? `&status=${vacationStatus}` : '');
    } catch(e) { showToast?.('Erro ao salvar', 'error'); }
  };

  // --- EXCLUIR AVALIAÇÃO ---
  const deleteReview = async (id) => {
    if (!window.confirm('Excluir esta avaliação de desempenho?')) return;
    try { await api.delete(`/rh/performance/${id}`); showToast?.('Avaliação excluída', 'success'); load('performance', setReviews); } catch(e) { showToast?.('Erro', 'error'); }
  };

  // --- EDITAR AVALIAÇÃO ---
  const saveEditReview = async () => {
    if (!editingRev) return;
    try {
      await api.put(`/rh/performance/${editingRev.id}`, { employee_id: editingRev.employee_id, reviewer_id: editingRev.reviewer_id, period: editingRev.period, score: Number(editingRev.score), feedback: editingRev.feedback, goals: editingRev.goals, empresa_id: empId });
      showToast?.('Avaliação atualizada!', 'success');
      setEditingRev(null);
      load('performance', setReviews);
    } catch(e) { showToast?.('Erro ao salvar', 'error'); }
  };

  // --- EXCLUIR TREINAMENTO ---
  const deleteTraining = async (id) => {
    if (!window.confirm('Desativar este treinamento?')) return;
    try { await api.delete(`/rh/trainings/${id}`); showToast?.('Treinamento desativado', 'success'); load('trainings', setTrainings); } catch(e) { showToast?.('Erro', 'error'); }
  };

  // --- EDITAR TREINAMENTO ---
  const saveEditTraining = async () => {
    if (!editingTrn) return;
    try {
      await api.put(`/rh/trainings/${editingTrn.id}`, { name: editingTrn.name, provider: editingTrn.provider, duration: editingTrn.duration, description: editingTrn.description, empresa_id: empId });
      showToast?.('Treinamento atualizado!', 'success');
      setEditingTrn(null);
      load('trainings', setTrainings);
    } catch(e) { showToast?.('Erro ao salvar', 'error'); }
  };

  // --- EXCLUIR HOLERITE ---
  const deletePayroll = async (id) => {
    if (!window.confirm('Excluir este holerite e todos os eventos associados?')) return;
    try { await api.delete(`/rh/payroll/${id}`); showToast?.('Holerite excluído', 'success'); load('payroll', setPayrolls, payrollMonth ? `&reference_month=${payrollMonth}` : ''); } catch(e) { showToast?.('Erro', 'error'); }
  };

  const viewEmployee = async (id) => {
    try {
      const r = await api.get(`/rh/employees/${id}`);
      setSelectedEmployee(r.data);
    } catch (e) { showToast?.('Erro ao carregar perfil', 'error'); }
  };

  // --- EDIÇÃO DE COLABORADOR ---
  const startEditEmployee = (emp) => {
    setEditingEmp({
      ...emp,
      department_id: emp.department_id || '',
      position_id: emp.position_id || '',
      manager_id: emp.manager_id || '',
      salary: emp.salary || 0,
      birth_date: emp.birth_date || '',
      hire_date: emp.hire_date || '',
    });
    setPhotoPreview(emp.photo_url || null);
  };

  const saveEditEmployee = async () => {
    if (!editingEmp) return;
    setLoading(true);
    try {
      await api.put(`/rh/employees/${editingEmp.id}`, {
        ...editingEmp, empresa_id: empId,
        salary: Number(editingEmp.salary) || 0,
        department_id: editingEmp.department_id ? Number(editingEmp.department_id) : null,
        position_id: editingEmp.position_id ? Number(editingEmp.position_id) : null,
        manager_id: editingEmp.manager_id ? Number(editingEmp.manager_id) : null,
      });
      showToast?.('Colaborador atualizado!', 'success');
      logAction?.('OmniRH', `Editou colaborador: ${editingEmp.name}`);
      setEditingEmp(null);
      setPhotoPreview(null);
      load('employees', setEmployees);
    } catch (e) { showToast?.('Erro ao salvar edição', 'error'); }
    finally { setLoading(false); }
  };

  const terminateEmployee = async (id, name) => {
    if (!window.confirm(`Desligar o colaborador "${name}"? Esta ação muda o status para Desligado.`)) return;
    try {
      await api.delete(`/rh/employees/${id}`);
      showToast?.('Colaborador desligado!', 'success');
      load('employees', setEmployees);
    } catch (e) { showToast?.('Erro ao desligar colaborador', 'error'); }
  };

  // --- EDIÇÃO DE DEPARTAMENTO ---
  const startEditDept = (d) => setEditingDept({ ...d });
  const saveEditDept = async () => {
    if (!editingDept) return;
    try {
      await api.put(`/rh/departments/${editingDept.id}`, { ...editingDept, empresa_id: empId });
      showToast?.('Departamento atualizado!', 'success');
      setEditingDept(null);
      load('departments', setDepartments);
    } catch (e) { showToast?.('Erro ao salvar', 'error'); }
  };
  const deleteDept = async (id, name) => {
    if (!window.confirm(`Excluir departamento "${name}"?`)) return;
    try {
      await api.delete(`/rh/departments/${id}`);
      showToast?.('Departamento excluído!', 'success');
      load('departments', setDepartments);
    } catch (e) { showToast?.('Erro ao excluir', 'error'); }
  };

  // --- EDIÇÃO DE CARGO ---
  const startEditPos = (p) => setEditingPos({ ...p, department_id: p.department_id || '' });
  const saveEditPos = async () => {
    if (!editingPos) return;
    try {
      await api.put(`/rh/positions/${editingPos.id}`, { ...editingPos, empresa_id: empId, department_id: editingPos.department_id ? Number(editingPos.department_id) : null });
      showToast?.('Cargo atualizado!', 'success');
      setEditingPos(null);
      load('positions', setPositions);
    } catch (e) { showToast?.('Erro ao salvar', 'error'); }
  };

  const filteredEmployees = useMemo(() => {
    if (!searchEmp) return employees;
    const s = searchEmp.toLowerCase();
    return employees.filter(e => e.name?.toLowerCase().includes(s) || e.cpf?.includes(s) || e.email?.toLowerCase().includes(s));
  }, [employees, searchEmp]);

  // ============================================================
  // ORGANOGRAMA: Cores e ícones por nível hierárquico
  // ============================================================
  const levelConfig = {
    'Diretor':      { color: '#F26B25', bg: 'rgba(242, 107, 37, 0.08)', border: 'rgba(242, 107, 37, 0.3)', icon: '👑' },
    'Gerente':      { color: '#1A73E8', bg: 'rgba(26, 115, 232, 0.08)', border: 'rgba(26, 115, 232, 0.3)', icon: '🎯' },
    'Coordenador':  { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)', border: 'rgba(139, 92, 246, 0.3)', icon: '📋' },
    'Supervisor':   { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.08)', border: 'rgba(236, 72, 153, 0.3)', icon: '🔧' },
    'Pleno':        { color: '#22A06B', bg: 'rgba(34, 160, 107, 0.08)', border: 'rgba(34, 160, 107, 0.3)', icon: '💼' },
    'Sênior':       { color: '#22A06B', bg: 'rgba(34, 160, 107, 0.08)', border: 'rgba(34, 160, 107, 0.3)', icon: '💼' },
    'Júnior':       { color: '#636466', bg: 'rgba(99, 100, 102, 0.08)', border: 'rgba(99, 100, 102, 0.3)', icon: '🔹' },
    'Assistente':   { color: '#636466', bg: 'rgba(99, 100, 102, 0.08)', border: 'rgba(99, 100, 102, 0.3)', icon: '📎' },
    'Auxiliar':     { color: '#8E9093', bg: 'rgba(142, 144, 147, 0.08)', border: 'rgba(142, 144, 147, 0.3)', icon: '📌' },
    'Estagiário':   { color: '#8E9093', bg: 'rgba(142, 144, 147, 0.08)', border: 'rgba(142, 144, 147, 0.3)', icon: '🎓' },
  };

  const getLevelConfig = (posName) => {
    if (!posName) return levelConfig['Pleno'];
    for (const [key, val] of Object.entries(levelConfig)) {
      if (posName.toLowerCase().includes(key.toLowerCase())) return val;
    }
    return levelConfig['Pleno'];
  };

  // Toggle expandir/recolher nó
  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Expandir todos os nós
  const expandAll = (nodes) => {
    const ids = {};
    const walk = (list) => {
      list.forEach(n => { ids[n.id] = true; if (n.subordinates) walk(n.subordinates); });
    };
    walk(nodes);
    setExpandedNodes(ids);
  };

  // Recolher todos
  const collapseAll = () => setExpandedNodes({});

  // Buscar no organograma
  const searchOrgChart = (term) => {
    setOrgSearch(term);
    if (!term.trim()) { setOrgHighlight(null); return; }
    const flat = orgchart.flat || [];
    const found = flat.find(e => e.name?.toLowerCase().includes(term.toLowerCase()));
    if (!found) { setOrgHighlight(null); return; }
    setOrgHighlight(found.id);
    const idsToExpand = { ...expandedNodes };
    let current = found;
    while (current) {
      idsToExpand[current.id] = true;
      const parent = flat.find(e => e.id === current.manager_id);
      if (parent) idsToExpand[parent.id] = true;
      current = parent;
    }
    setExpandedNodes(idsToExpand);
  };

  // Renderizar avatar com foto ou iniciais
  const Avatar = ({ name, photoUrl, size = 36, fontSize = 14 }) => {
    if (photoUrl) {
      return (
        <img src={photoUrl} alt={name} style={{
          width: size, height: size, borderRadius: '50%', objectFit: 'cover',
          border: '2px solid rgba(242, 107, 37, 0.3)', flexShrink: 0
        }} />
      );
    }
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', background: 'rgba(242, 107, 37, 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize, fontWeight: 700, color: '#F26B25', flexShrink: 0
      }}>
        {name?.[0]?.toUpperCase() || '?'}
      </div>
    );
  };

  // Renderizar nó da árvore (fallback lateral)
  const renderOrgNode = (node, level = 0) => {
    const hasSubs = node.subordinates?.length > 0;
    const isExpanded = expandedNodes[node.id] !== false;
    const isFirstLoad = expandedNodes[node.id] === undefined;
    const showChildren = isFirstLoad ? level < 2 : isExpanded;
    const lc = getLevelConfig(node.position_name || node.position_level);
    const isHighlighted = orgHighlight === node.id;

    return (
      <div key={node.id} style={{ marginLeft: level * 24, marginBottom: 4 }}>
        <div onClick={() => hasSubs && toggleNode(node.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12,
            background: isHighlighted ? 'rgba(242, 107, 37, 0.1)' : lc.bg,
            border: `1px solid ${isHighlighted ? '#F26B25' : lc.border}`,
            cursor: hasSubs ? 'pointer' : 'default', transition: 'all 0.2s',
            boxShadow: isHighlighted ? '0 0 12px rgba(242, 107, 37, 0.2)' : 'none', marginBottom: 2,
          }}>
          <div style={{ width: 18, textAlign: 'center', fontSize: 10, color: lc.color, flexShrink: 0 }}>
            {hasSubs ? (showChildren ? '▼' : '▶') : <span style={{ fontSize: 8 }}>{lc.icon}</span>}
          </div>
          <Avatar name={node.name} photoUrl={node.photo_url} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: isHighlighted ? '#F26B25' : '#2A2B2D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</div>
            <div style={{ fontSize: 10, color: '#636466' }}><span style={{ color: lc.color, fontWeight: 600 }}>{node.position_name || '—'}</span> • {node.department_name || '—'}</div>
          </div>
          {hasSubs && <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 9, fontWeight: 700, background: '#FFFFFF', border: '1px solid #D4D5D6', color: '#8E9093' }}>{node.subordinates.length}</span>}
        </div>
        {hasSubs && showChildren && (
          <div style={{ borderLeft: '1px dashed #D4D5D6', marginLeft: 9, paddingLeft: 8, marginTop: 2 }}>
            {node.subordinates.map(s => renderOrgNode(s, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Renderizar nó da árvore VISUAL TOP-DOWN
  const renderOrgTreeNode = (node, level = 0) => {
    const hasSubs = node.subordinates?.length > 0;
    const isExpanded = expandedNodes[node.id] !== false;
    const isFirstLoad = expandedNodes[node.id] === undefined;
    const showChildren = isFirstLoad ? level < 3 : isExpanded;
    const lc = getLevelConfig(node.position_name || node.position_level);
    const isHighlighted = orgHighlight === node.id;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          onClick={() => hasSubs && toggleNode(node.id)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: hasSubs ? 'pointer' : 'default',
            padding: '10px 12px', borderRadius: 14, minWidth: 120, maxWidth: 160, textAlign: 'center',
            background: isHighlighted ? 'rgba(242, 107, 37, 0.05)' : '#FFFFFF',
            border: `2px solid ${isHighlighted ? '#F26B25' : lc.border}`,
            boxShadow: isHighlighted ? '0 0 16px rgba(242, 107, 37, 0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'all 0.2s', position: 'relative',
          }}
        >
          <div style={{
            width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', marginBottom: 6,
            border: `3px solid ${lc.color}`, boxShadow: `0 2px 10px ${lc.color}33`,
            background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {node.photo_url ? (
              <img src={node.photo_url} alt={node.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 20, fontWeight: 700, color: lc.color }}>{node.name?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#2A2B2D', lineHeight: 1.2, marginBottom: 2, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {node.name}
          </div>
          <div style={{ fontSize: 9, color: lc.color, fontWeight: 600 }}>
            {lc.icon} {node.position_name || '—'}
          </div>
          <div style={{ fontSize: 8, color: '#8E9093', marginTop: 1 }}>{node.department_name || ''}</div>
          {hasSubs && (
            <div style={{ fontSize: 8, color: '#636466', marginTop: 4 }}>
              {showChildren ? '▼' : '▶'} {node.subordinates.length} {node.subordinates.length === 1 ? 'subordinado' : 'subordinados'}
            </div>
          )}
        </div>

        {hasSubs && showChildren && (
          <>
            <div style={{ width: 2, height: 16, background: `${lc.color}55` }} />
            <div style={{ display: 'flex', gap: 0, justifyContent: 'center', position: 'relative' }}>
              {node.subordinates.length > 1 && (
                <div style={{
                  position: 'absolute', top: 0, left: 40, right: 40,
                  height: 2, background: '#D4D5D6',
                }} />
              )}
              {node.subordinates.map(s => (
                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 6px' }}>
                  <div style={{ width: 2, height: 14, background: '#D4D5D6' }} />
                  {renderOrgTreeNode(s, level + 1)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  // ============================================================
  // EMPLOYEE 360 MODAL
  // ============================================================
  const renderEmployee360 = () => {
    if (!selectedEmployee) return null;
    const emp = selectedEmployee;
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(42, 43, 45, 0.7)', backdropFilter: 'blur(4px)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#FFFFFF', borderRadius: 20, width: '90%', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto', border: '1px solid #E5E7EB', padding: 30, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F26B25', margin: 0 }}>👤 {emp.name}</h2>
            <button onClick={() => setSelectedEmployee(null)} style={{ background: 'none', border: 'none', color: '#8E9093', fontSize: 20, cursor: 'pointer' }}>✕</button>
          </div>
          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              ['CPF', emp.cpf], ['E-mail', emp.email], ['Telefone', emp.phone],
              ['Nascimento', formatDate(emp.birth_date)], ['Admissão', formatDate(emp.hire_date)], ['Salário', `R$ ${formatBRL(emp.salary)}`],
              ['Departamento', emp.department_name], ['Cargo', emp.position_name], ['Gestor', emp.manager_name],
              ['Vínculo', emp.employment_type], ['Status', emp.status], ['Gênero', emp.gender],
            ].map(([l, v], i) => (
              <div key={i} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '10px 14px', borderRadius: 10 }}>
                <div style={{ fontSize: 9, color: '#8E9093', fontWeight: 700, textTransform: 'uppercase' }}>{l}</div>
                <div style={{ fontSize: 13, color: '#2A2B2D', fontWeight: 600, marginTop: 2 }}>{v || '—'}</div>
              </div>
            ))}
          </div>
          {/* Profile */}
          {emp.profile && (
            <Card style={{ marginBottom: 14 }}>
              <SectionTitle icon="📝" text="Perfil" />
              <p style={{ fontSize: 12, color: '#636466' }}>{emp.profile.bio || 'Sem bio'}</p>
              {emp.profile.skills && <div style={{ fontSize: 11, color: '#636466', marginTop: 6 }}>Skills: {emp.profile.skills}</div>}
              {emp.profile.emergency_contact && <div style={{ fontSize: 11, color: '#D93025', marginTop: 6 }}>Emergência: {emp.profile.emergency_contact}</div>}
            </Card>
          )}
          {/* Education */}
          {emp.education?.length > 0 && (
            <Card style={{ marginBottom: 14 }}>
              <SectionTitle icon="🎓" text={`Formação Acadêmica (${emp.education.length})`} />
              {emp.education.map((ed, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #E5E7EB', fontSize: 12, color: '#3D3E40' }}>
                  <strong>{ed.course}</strong> — {ed.institution} ({ed.degree}) {ed.status}
                </div>
              ))}
            </Card>
          )}
          {/* Experience */}
          {emp.experience?.length > 0 && (
            <Card style={{ marginBottom: 14 }}>
              <SectionTitle icon="💼" text={`Experiência (${emp.experience.length})`} />
              {emp.experience.map((ex, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #E5E7EB', fontSize: 12, color: '#3D3E40' }}>
                  <strong>{ex.position}</strong> — {ex.company} ({formatDate(ex.start_date)} → {formatDate(ex.end_date)})
                </div>
              ))}
            </Card>
          )}
          {/* Promotions */}
          {emp.promotions?.length > 0 && (
            <Card>
              <SectionTitle icon="🏆" text={`Promoções (${emp.promotions.length})`} />
              {emp.promotions.map((pr, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #E5E7EB', fontSize: 12, color: '#3D3E40' }}>
                  {pr.old_position_name} → <strong style={{ color: '#22A06B' }}>{pr.new_position_name}</strong> em {formatDate(pr.promotion_date)}
                  {pr.notes && <span style={{ color: '#8E9093' }}> — {pr.notes}</span>}
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    );
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div>
      {renderEmployee360()}

      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 32 }}>👔</span>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: '#2A2B2D', fontWeight: 700 }}>OmniRH — Gestão de Pessoas</h2>
          <p style={{ margin: 0, fontSize: 11, color: '#8E9093' }}>Módulo completo de Recursos Humanos</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'dashboard', label: 'Dashboard', icon: '📊' },
          { key: 'employees', label: 'Colaboradores', icon: '🧑‍💼' },
          { key: 'structure', label: 'Estrutura', icon: '🏛️' },
          { key: 'orgchart', label: 'Organograma', icon: '🌳' },
          { key: 'payroll', label: 'Folha', icon: '💵' },
          { key: 'attendance', label: 'Ponto', icon: '⏰' },
          { key: 'vacations', label: 'Férias', icon: '🏖️' },
          { key: 'performance', label: 'Desempenho', icon: '⭐' },
          { key: 'trainings', label: 'Treinamentos', icon: '🎓' },
          { key: 'recruitment', label: 'Recrutamento', icon: '📋' },
          { key: 'insights', label: 'People Insights', icon: '🎉' },
        ].map(t => <Tab key={t.key} active={tab === t.key} label={t.label} icon={t.icon} onClick={() => setTab(t.key)} />)}
      </div>

      {/* ============================================================ */}
      {/* DASHBOARD */}
      {/* ============================================================ */}
      {tab === 'dashboard' && (
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <KPI icon="👥" label="Colaboradores Ativos" value={kpis.total_employees || 0} />
            <KPI icon="🌟" label="Admissões (30d)" value={kpis.new_hires_30d || 0} color="#22A06B" />
            <KPI icon="📤" label="Desligamentos (30d)" value={kpis.terminations_30d || 0} color="#D93025" />
            <KPI icon="💵" label="Custo Folha" value={`R$ ${formatBRL(kpis.payroll_cost)}`} color="#1A73E8" />
            <KPI icon="🏖️" label="Em Férias" value={kpis.on_vacation || 0} color="#F26B25" />
            <KPI icon="⏱️" label="HE no Mês" value={`${kpis.overtime_hours || 0}h`} color="#8b5cf6" />
            <KPI icon="📋" label="Vagas Abertas" value={kpis.open_jobs || 0} color="#ec4899" />
          </div>
          {/* Feed */}
          <Card>
            <SectionTitle icon="🎉" text="Mural de Celebrações" />
            {feed.length === 0 && <p style={{ fontSize: 12, color: '#8E9093' }}>Nenhum evento hoje</p>}
            {feed.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: 24 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: 13, color: '#2A2B2D', fontWeight: 600 }}>{f.message}</div>
                  <div style={{ fontSize: 10, color: '#8E9093' }}>{f.type}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* COLABORADORES */}
      {/* ============================================================ */}
      {tab === 'employees' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input placeholder="Buscar por nome, CPF ou e-mail..." value={searchEmp} onChange={e => setSearchEmp(e.target.value)}
                style={{ padding: '9px 16px', borderRadius: 10, fontSize: 12, background: '#FFFFFF', border: '1px solid #D4D5D6', color: '#2A2B2D', width: 300, outline: 'none' }} />
              <span style={{ fontSize: 11, color: '#8E9093' }}>{filteredEmployees.length} resultados</span>
            </div>
            <Btn onClick={() => setShowEmpForm(!showEmpForm)}>{showEmpForm ? '✕ Fechar' : '➕ Novo Colaborador'}</Btn>
          </div>

          {showEmpForm && (
            <Card style={{ marginBottom: 16 }}>
              <SectionTitle icon="➕" text="Cadastrar Colaborador" />
              <form onSubmit={createEmployee}>
                {/* Foto upload */}
                <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 90, height: 90, borderRadius: '50%', overflow: 'hidden',
                      background: '#F9FAFB', border: '2px dashed rgba(242, 107, 37, 0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', position: 'relative',
                    }} onClick={() => document.getElementById('photoInput')?.click()}>
                      {(photoPreview || empForm.photo_url) ? (
                        <img src={photoPreview || empForm.photo_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 28, color: '#D4D5D6' }}>📷</span>
                      )}
                    </div>
                    <input id="photoInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) { const reader = new FileReader(); reader.onloadend = () => { setPhotoPreview(reader.result); setEmpForm({ ...empForm, photo_url: reader.result }); }; reader.readAsDataURL(file); }
                      }} />
                    <span style={{ fontSize: 9, color: '#8E9093', marginTop: 4, display: 'block' }}>Clique para<br/>adicionar foto</span>
                  </div>
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    <Input label="Nome Completo" value={empForm.name} onChange={v => setEmpForm({ ...empForm, name: v })} required />
                    <Input label="CPF" value={empForm.cpf} onChange={v => setEmpForm({ ...empForm, cpf: v })} />
                    <Input label="E-mail" value={empForm.email} onChange={v => setEmpForm({ ...empForm, email: v })} type="email" />
                    <Input label="Telefone" value={empForm.phone} onChange={v => setEmpForm({ ...empForm, phone: v })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  <Input label="Data Nascimento" value={empForm.birth_date} onChange={v => setEmpForm({ ...empForm, birth_date: v })} type="date" />
                  <Input label="Data Admissão" value={empForm.hire_date} onChange={v => setEmpForm({ ...empForm, hire_date: v })} type="date" required />
                  <Input label="Salário (R$)" value={empForm.salary} onChange={v => setEmpForm({ ...empForm, salary: v })} type="number" />
                  <Select label="Gênero" value={empForm.gender} onChange={v => setEmpForm({ ...empForm, gender: v })}
                    options={[{ value: 'Masculino', label: 'Masculino' }, { value: 'Feminino', label: 'Feminino' }, { value: 'Outro', label: 'Outro' }]} />
                  <Select label="Departamento" value={empForm.department_id} onChange={v => setEmpForm({ ...empForm, department_id: v })}
                    options={departments.map(d => ({ value: d.id, label: d.name }))} />
                  <Select label="Cargo" value={empForm.position_id} onChange={v => setEmpForm({ ...empForm, position_id: v })}
                    options={positions.map(p => ({ value: p.id, label: `${p.name} (${p.level || ''})` }))} />
                  <Select label="Tipo Vínculo" value={empForm.employment_type} onChange={v => setEmpForm({ ...empForm, employment_type: v })}
                    options={[{ value: 'CLT', label: 'CLT' }, { value: 'PJ', label: 'PJ' }, { value: 'Estágio', label: 'Estágio' }, { value: 'Temporário', label: 'Temporário' }]} />
                  <Select label="Gestor" value={empForm.manager_id || ''} onChange={v => setEmpForm({ ...empForm, manager_id: v })}
                    options={employees.filter(e => e.id !== selectedEmployee?.id).map(e => ({ value: e.id, label: e.name }))} placeholder="Sem gestor direto" />
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <Btn disabled={loading}>{loading ? '⌛ Salvando...' : '💾 Salvar'}</Btn>
                  </div>
                </div>
              </form>
            </Card>
          )}

          <Card>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><Th></Th><Th>Nome</Th><Th>CPF</Th><Th>Departamento</Th><Th>Cargo</Th><Th>Admissão</Th><Th>Salário</Th><Th>Status</Th><Th>Ações</Th></tr></thead>
              <tbody>
                {filteredEmployees.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <Td w="45px">
                      {e.photo_url ? (
                        <img src={e.photo_url} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(242, 107, 37, 0.3)' }} />
                      ) : (
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(242, 107, 37, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#F26B25' }}>
                          {e.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </Td>
                    <Td><span style={{ fontWeight: 600, color: '#2A2B2D', cursor: 'pointer' }} onClick={() => viewEmployee(e.id)}>{e.name}</span></Td>
                    <Td>{e.cpf || '—'}</Td>
                    <Td>{e.department_name || '—'}</Td>
                    <Td>{e.position_name || '—'}</Td>
                    <Td>{formatDate(e.hire_date)}</Td>
                    <Td>R$ {formatBRL(e.salary)}</Td>
                    <Td><Badge text={e.status} color={e.status === 'Ativo' ? '#22A06B' : '#D93025'} /></Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => viewEmployee(e.id)} style={{ background: 'none', border: 'none', color: '#1A73E8', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>👤</button>
                        <button onClick={() => startEditEmployee(e)} style={{ background: 'none', border: 'none', color: '#F26B25', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>✏️</button>
                        {e.status === 'Ativo' && (
                          <button onClick={() => terminateEmployee(e.id, e.name)} style={{ background: 'none', border: 'none', color: '#D93025', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>🚪</button>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* MODAL DE EDIÇÃO DE COLABORADOR */}
          {editingEmp && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(42, 43, 45, 0.7)', backdropFilter: 'blur(4px)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#FFFFFF', borderRadius: 20, width: '90%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto', border: '1px solid #E5E7EB', padding: 30, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F26B25', margin: 0 }}>✏️ Editar — {editingEmp.name}</h2>
                  <button onClick={() => { setEditingEmp(null); setPhotoPreview(null); }} style={{ background: 'none', border: 'none', color: '#8E9093', fontSize: 20, cursor: 'pointer' }}>✕</button>
                </div>
                {/* Foto */}
                <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', background: '#F9FAFB', border: '2px dashed rgba(242, 107, 37, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      onClick={() => document.getElementById('editPhotoInput')?.click()}>
                      {(photoPreview || editingEmp.photo_url) ? (
                        <img src={photoPreview || editingEmp.photo_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 24, color: '#D4D5D6' }}>📷</span>
                      )}
                    </div>
                    <input id="editPhotoInput" type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={(ev) => { const file = ev.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setPhotoPreview(reader.result); setEditingEmp({ ...editingEmp, photo_url: reader.result }); }; reader.readAsDataURL(file); } }} />
                  </div>
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <Input label="Nome" value={editingEmp.name} onChange={v => setEditingEmp({ ...editingEmp, name: v })} required />
                    <Input label="CPF" value={editingEmp.cpf || ''} onChange={v => setEditingEmp({ ...editingEmp, cpf: v })} />
                    <Input label="E-mail" value={editingEmp.email || ''} onChange={v => setEditingEmp({ ...editingEmp, email: v })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  <Input label="Telefone" value={editingEmp.phone || ''} onChange={v => setEditingEmp({ ...editingEmp, phone: v })} />
                  <Input label="Nascimento" value={editingEmp.birth_date || ''} onChange={v => setEditingEmp({ ...editingEmp, birth_date: v })} type="date" />
                  <Input label="Admissão" value={editingEmp.hire_date || ''} onChange={v => setEditingEmp({ ...editingEmp, hire_date: v })} type="date" />
                  <Input label="Salário" value={editingEmp.salary} onChange={v => setEditingEmp({ ...editingEmp, salary: v })} type="number" />
                  <Select label="Departamento" value={editingEmp.department_id} onChange={v => setEditingEmp({ ...editingEmp, department_id: v })}
                    options={departments.map(d => ({ value: d.id, label: d.name }))} />
                  <Select label="Cargo" value={editingEmp.position_id} onChange={v => setEditingEmp({ ...editingEmp, position_id: v })}
                    options={positions.map(p => ({ value: p.id, label: `${p.name} (${p.level || ''})` }))} />
                  <Select label="Gestor" value={editingEmp.manager_id} onChange={v => setEditingEmp({ ...editingEmp, manager_id: v })}
                    options={employees.filter(x => x.id !== editingEmp.id).map(x => ({ value: x.id, label: x.name }))} placeholder="Nenhum" />
                  <Select label="Vínculo" value={editingEmp.employment_type} onChange={v => setEditingEmp({ ...editingEmp, employment_type: v })}
                    options={[{ value: 'CLT', label: 'CLT' }, { value: 'PJ', label: 'PJ' }, { value: 'Estágio', label: 'Estágio' }, { value: 'Temporário', label: 'Temporário' }]} />
                  <Select label="Status" value={editingEmp.status} onChange={v => setEditingEmp({ ...editingEmp, status: v })}
                    options={[{ value: 'Ativo', label: 'Ativo' }, { value: 'Desligado', label: 'Desligado' }, { value: 'Afastado', label: 'Afastado' }]} />
                  <Input label="Endereço" value={editingEmp.address || ''} onChange={v => setEditingEmp({ ...editingEmp, address: v })} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                  <Btn onClick={() => { setEditingEmp(null); setPhotoPreview(null); }} color="#8E9093">Cancelar</Btn>
                  <Btn onClick={saveEditEmployee} disabled={loading}>{loading ? '⌛...' : '💾 Salvar Alterações'}</Btn>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* ESTRUTURA ORGANIZACIONAL */}
      {/* ============================================================ */}
      {tab === 'structure' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* DEPARTAMENTOS */}
          <Card>
            <SectionTitle icon="🏢" text={`Departamentos (${departments.length})`} />
            <form onSubmit={createDepartment} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input placeholder="Nome do departamento" value={deptForm.name} onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} required
                style={{ flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: 12, background: '#FFFFFF', border: '1px solid #D4D5D6', color: '#2A2B2D', outline: 'none' }} />
              <input placeholder="Centro de custo" value={deptForm.cost_center} onChange={e => setDeptForm({ ...deptForm, cost_center: e.target.value })}
                style={{ width: 120, padding: '9px 12px', borderRadius: 10, fontSize: 12, background: '#FFFFFF', border: '1px solid #D4D5D6', color: '#2A2B2D', outline: 'none' }} />
              <Btn small>➕</Btn>
            </form>
            {departments.map(d => (
              <div key={d.id} style={{ padding: '10px 14px', borderBottom: '1px solid #E5E7EB' }}>
                {editingDept?.id === d.id ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input value={editingDept.name} onChange={e => setEditingDept({ ...editingDept, name: e.target.value })}
                      style={{ flex: 1, padding: '7px 10px', borderRadius: 8, fontSize: 12, background: '#FFFFFF', border: '1px solid #F26B25', color: '#2A2B2D', outline: 'none' }} />
                    <input value={editingDept.cost_center || ''} onChange={e => setEditingDept({ ...editingDept, cost_center: e.target.value })} placeholder="CC"
                      style={{ width: 90, padding: '7px 10px', borderRadius: 8, fontSize: 12, background: '#FFFFFF', border: '1px solid #F26B25', color: '#2A2B2D', outline: 'none' }} />
                    <button onClick={saveEditDept} style={{ background: '#22A06B', border: 'none', color: '#FFFFFF', borderRadius: 8, padding: '6px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>💾</button>
                    <button onClick={() => setEditingDept(null)} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#8E9093', borderRadius: 8, padding: '6px 12px', fontSize: 10, cursor: 'pointer' }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#2A2B2D' }}>{d.name}</span>
                      {d.cost_center && <span style={{ fontSize: 10, color: '#8E9093', marginLeft: 8 }}>CC: {d.cost_center}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => startEditDept(d)} style={{ background: 'none', border: 'none', color: '#F26B25', cursor: 'pointer', fontSize: 12 }}>✏️</button>
                      <button onClick={() => deleteDept(d.id, d.name)} style={{ background: 'none', border: 'none', color: '#D93025', cursor: 'pointer', fontSize: 12 }}>🗑️</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </Card>

          {/* CARGOS */}
          <Card>
            <SectionTitle icon="💼" text={`Cargos (${positions.length})`} />
            <form onSubmit={createPosition} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input placeholder="Nome do cargo" value={posForm.name} onChange={e => setPosForm({ ...posForm, name: e.target.value })} required
                style={{ flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: 12, background: '#FFFFFF', border: '1px solid #D4D5D6', color: '#2A2B2D', outline: 'none' }} />
              <select value={posForm.department_id} onChange={e => setPosForm({ ...posForm, department_id: e.target.value })}
                style={{ width: 140, padding: '9px 12px', borderRadius: 10, fontSize: 12, background: '#FFFFFF', border: '1px solid #D4D5D6', color: '#2A2B2D' }}>
                <option value="">Departamento</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select value={posForm.level} onChange={e => setPosForm({ ...posForm, level: e.target.value })}
                style={{ width: 130, padding: '9px 12px', borderRadius: 10, fontSize: 12, background: '#FFFFFF', border: '1px solid #D4D5D6', color: '#2A2B2D' }}>
                {['Diretor','Gerente','Coordenador','Supervisor','Sênior','Pleno','Júnior','Assistente','Auxiliar','Estagiário'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <Btn small>➕</Btn>
            </form>
            {positions.map(p => (
              <div key={p.id} style={{ padding: '10px 14px', borderBottom: '1px solid #E5E7EB' }}>
                {editingPos?.id === p.id ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input value={editingPos.name} onChange={e => setEditingPos({ ...editingPos, name: e.target.value })}
                      style={{ flex: 1, minWidth: 120, padding: '7px 10px', borderRadius: 8, fontSize: 12, background: '#FFFFFF', border: '1px solid #F26B25', color: '#2A2B2D', outline: 'none' }} />
                    <select value={editingPos.department_id} onChange={e => setEditingPos({ ...editingPos, department_id: e.target.value })}
                      style={{ width: 130, padding: '7px 10px', borderRadius: 8, fontSize: 12, background: '#FFFFFF', border: '1px solid #F26B25', color: '#2A2B2D' }}>
                      <option value="">Dept.</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <select value={editingPos.level || 'Pleno'} onChange={e => setEditingPos({ ...editingPos, level: e.target.value })}
                      style={{ width: 120, padding: '7px 10px', borderRadius: 8, fontSize: 12, background: '#FFFFFF', border: '1px solid #F26B25', color: '#2A2B2D' }}>
                      {['Diretor','Gerente','Coordenador','Supervisor','Sênior','Pleno','Júnior','Assistente','Auxiliar','Estagiário'].map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    <button onClick={saveEditPos} style={{ background: '#22A06B', border: 'none', color: '#FFFFFF', borderRadius: 8, padding: '6px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>💾</button>
                    <button onClick={() => setEditingPos(null)} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#8E9093', borderRadius: 8, padding: '6px 12px', fontSize: 10, cursor: 'pointer' }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#2A2B2D' }}>{p.name}</span>
                      <span style={{ fontSize: 10, color: '#8E9093', marginLeft: 8 }}>{p.department_name || '—'}</span>
                      <Badge text={p.level || 'Pleno'} color={getLevelConfig(p.level || p.name).color} />
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => startEditPos(p)} style={{ background: 'none', border: 'none', color: '#F26B25', cursor: 'pointer', fontSize: 12 }}>✏️</button>
                      <button onClick={async () => { if (!window.confirm(`Excluir cargo "${p.name}"?`)) return; try { await api.delete(`/rh/positions/${p.id}`); showToast?.('Cargo excluído', 'success'); load('positions', setPositions); } catch(e) { showToast?.('Erro', 'error'); } }} style={{ background: 'none', border: 'none', color: '#D93025', cursor: 'pointer', fontSize: 12 }}>🗑️</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* ORGANOGRAMA — ÁRVORE VISUAL TIPO FAMILY TREE */}
      {/* ============================================================ */}
      {tab === 'orgchart' && (
        <div>
          {/* Barra de busca e controles */}
          <Card style={{ marginBottom: 16, padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 250, position: 'relative' }}>
                <input
                  placeholder="🔍 Buscar colaborador no organograma..."
                  value={orgSearch}
                  onChange={e => searchOrgChart(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 16px', borderRadius: 12, fontSize: 13,
                    background: '#FFFFFF', border: '1px solid #D4D5D6',
                    color: '#2A2B2D', outline: 'none', boxSizing: 'border-box'
                  }}
                />
                {orgSearch && !orgHighlight && (
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#D93025' }}>
                    Não encontrado
                  </span>
                )}
              </div>
              <Btn onClick={() => expandAll(orgchart.tree || [])} color="#1A73E8" small>⊞ Expandir Todos</Btn>
              <Btn onClick={collapseAll} color="#8E9093" small>⊟ Recolher Todos</Btn>
              <span style={{ fontSize: 10, color: '#8E9093' }}>
                {orgchart.flat?.length || 0} colaboradores
              </span>
            </div>
            {/* Legenda de níveis */}
            <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
              {Object.entries(levelConfig).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: val.color }} />
                  <span style={{ color: val.color, fontWeight: 600 }}>{key}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Árvore visual — Empresa como raiz central no topo */}
          <Card style={{ overflowX: 'auto', padding: '30px 20px' }}>
            {/* NÓ RAIZ: EMPRESA */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                background: '#FDECE3',
                border: '2px solid #F26B25', borderRadius: 16, padding: '16px 30px',
                textAlign: 'center', marginBottom: 8, boxShadow: '0 4px 20px rgba(242, 107, 37, 0.15)',
              }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>🏢</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#F26B25' }}>{currentUser?.empresa_nome || 'Empresa'}</div>
                <div style={{ fontSize: 10, color: '#636466' }}>{orgchart.flat?.length || 0} colaboradores</div>
              </div>

              {/* Linha vertical do topo */}
              {orgchart.tree?.length > 0 && (
                <div style={{ width: 2, height: 24, background: 'rgba(242, 107, 37, 0.3)' }} />
              )}

              {/* Ramos lateralizados */}
              {orgchart.tree?.length > 0 && (
                <div style={{ display: 'flex', gap: 0, justifyContent: 'center', position: 'relative' }}>
                  {/* Linha horizontal conectando os ramos */}
                  {orgchart.tree.length > 1 && (
                    <div style={{
                      position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                      width: `calc(100% - 80px)`, height: 2, background: 'rgba(242, 107, 37, 0.2)',
                    }} />
                  )}
                  {orgchart.tree.map((node, idx) => (
                    <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 160, padding: '0 8px' }}>
                      {/* Linha vertical para cada ramo */}
                      <div style={{ width: 2, height: 20, background: 'rgba(242, 107, 37, 0.2)' }} />
                      {renderOrgTreeNode(node, 0)}
                    </div>
                  ))}
                </div>
              )}

              {orgchart.tree?.length === 0 && (
                <p style={{ color: '#8E9093', fontSize: 12, textAlign: 'center', padding: 30, marginTop: 10 }}>
                  Nenhum colaborador com hierarquia definida.<br />
                  <span style={{ fontSize: 11 }}>Defina o campo "Gestor" no cadastro para montar a árvore.</span>
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* FOLHA DE PAGAMENTO */}
      {/* ============================================================ */}
      {tab === 'payroll' && (
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <Input label="Mês de Referência" value={payrollMonth} onChange={setPayrollMonth} type="month" />
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: 10 }}>
              <Btn onClick={generatePayroll} disabled={loading}>{loading ? '⌛ Gerando...' : '⚡ Gerar Folha'}</Btn>
              <Btn onClick={() => load('payroll', setPayrolls, payrollMonth ? `&reference_month=${payrollMonth}` : '')} color="#1A73E8" small>🔄 Atualizar</Btn>
            </div>
          </div>
          <Card>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><Th>Colaborador</Th><Th>Competência</Th><Th>Salário Base</Th><Th>INSS</Th><Th>IRRF</Th><Th>FGTS</Th><Th>Líquido</Th><Th>Status</Th><Th>Ações</Th></tr></thead>
              <tbody>
                {payrolls.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <Td><span style={{ fontWeight: 600, color: '#2A2B2D' }}>{p.employee_name}</span></Td>
                    <Td>{p.reference_month}</Td>
                    <Td>R$ {formatBRL(p.base_salary)}</Td>
                    <Td>R$ {formatBRL(p.inss)}</Td>
                    <Td>R$ {formatBRL(p.irrf)}</Td>
                    <Td>R$ {formatBRL(p.fgts)}</Td>
                    <Td><span style={{ fontWeight: 700, color: '#22A06B' }}>R$ {formatBRL(p.net_salary)}</span></Td>
                    <Td><Badge text={p.status} color={p.status === 'Gerada' ? '#22A06B' : '#F26B25'} /></Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => downloadPayslip(p.id)} style={{ background: 'none', border: 'none', color: '#1A73E8', cursor: 'pointer', fontSize: 12 }} title="Baixar PDF">📄</button>
                        <button onClick={() => deletePayroll(p.id)} style={{ background: 'none', border: 'none', color: '#D93025', cursor: 'pointer', fontSize: 12 }} title="Excluir">🗑️</button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payrolls.length === 0 && <p style={{ textAlign: 'center', padding: 30, color: '#8E9093', fontSize: 12 }}>Selecione um mês e clique em "Gerar Folha"</p>}
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* PONTO */}
      {/* ============================================================ */}
      {tab === 'attendance' && (
        <div>
          <Card style={{ marginBottom: 16, padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <Input label="Mês" value={attendanceMonth} onChange={v => { setAttendanceMonth(v); }} type="month" />
              <div style={{ flex: 1 }}>
                <Input label="Buscar colaborador" value={attendanceSearch} onChange={setAttendanceSearch} placeholder="Nome..." />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: 10 }}>
                <Btn onClick={() => load('attendance', setAttendance, attendanceMonth ? `&month=${attendanceMonth}` : '')} color="#1A73E8" small>🔍 Buscar</Btn>
                <Btn onClick={() => { setShowAttendanceForm(!showAttendanceForm); if (!employees.length) load('employees', setEmployees); }} small>{showAttendanceForm ? '✕' : '➕ Registrar Ponto'}</Btn>
              </div>
            </div>
          </Card>
          {showAttendanceForm && (
            <Card style={{ marginBottom: 16 }}>
              <SectionTitle icon="➕" text="Registrar Ponto" />
              <form onSubmit={registerAttendance} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                <Select label="Colaborador" value={attForm.employee_id} onChange={v => setAttForm({ ...attForm, employee_id: v })} options={employees.map(e => ({ value: e.id, label: e.name }))} />
                <Input label="Data" value={attForm.date} onChange={v => setAttForm({ ...attForm, date: v })} type="date" required />
                <Input label="Entrada" value={attForm.check_in} onChange={v => setAttForm({ ...attForm, check_in: v })} type="time" />
                <Input label="Saída" value={attForm.check_out} onChange={v => setAttForm({ ...attForm, check_out: v })} type="time" />
                <div style={{ display: 'flex', alignItems: 'flex-end' }}><Btn disabled={loading}>💾 Salvar</Btn></div>
              </form>
            </Card>
          )}
          <Card>
            <SectionTitle icon="⏰" text={`Controle de Ponto (${attendance.length})`} />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><Th>Colaborador</Th><Th>Data</Th><Th>Entrada</Th><Th>Saída</Th><Th>Total (h)</Th><Th>HE</Th><Th>Status</Th><Th>Ações</Th></tr></thead>
              <tbody>
                {attendance.filter(a => !attendanceSearch || a.employee_name?.toLowerCase().includes(attendanceSearch.toLowerCase())).map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <Td><span style={{ fontWeight: 600, color: '#2A2B2D' }}>{a.employee_name}</span></Td>
                    <Td>{formatDate(a.date)}</Td>
                    <Td>{a.check_in || '—'}</Td><Td>{a.check_out || '—'}</Td>
                    <Td>{a.total_hours}h</Td>
                    <Td>{a.overtime > 0 ? <span style={{ color: '#F26B25', fontWeight: 700 }}>{a.overtime}h</span> : '—'}</Td>
                    <Td><Badge text={a.status} color={a.status === 'Normal' ? '#22A06B' : a.status === 'Falta' ? '#D93025' : '#F26B25'} /></Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setEditingAtt({ ...a })} style={{ background: 'none', border: 'none', color: '#F26B25', cursor: 'pointer', fontSize: 12 }} title="Editar">✏️</button>
                        <button onClick={() => deleteAttendance(a.id)} style={{ background: 'none', border: 'none', color: '#D93025', cursor: 'pointer', fontSize: 12 }} title="Excluir">🗑️</button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {attendance.length === 0 && <p style={{ textAlign: 'center', padding: 30, color: '#8E9093', fontSize: 12 }}>Selecione um mês e clique "Buscar"</p>}
          </Card>
          {/* Modal edição ponto */}
          {editingAtt && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(42, 43, 45, 0.7)', backdropFilter: 'blur(4px)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#FFFFFF', borderRadius: 20, width: 500, border: '1px solid #E5E7EB', padding: 30, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F26B25', margin: 0 }}>✏️ Editar Ponto — {editingAtt.employee_name}</h3>
                  <button onClick={() => setEditingAtt(null)} style={{ background: 'none', border: 'none', color: '#8E9093', fontSize: 18, cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Input label="Entrada" value={editingAtt.check_in || ''} onChange={v => setEditingAtt({ ...editingAtt, check_in: v })} type="time" />
                  <Input label="Saída" value={editingAtt.check_out || ''} onChange={v => setEditingAtt({ ...editingAtt, check_out: v })} type="time" />
                  <Select label="Status" value={editingAtt.status} onChange={v => setEditingAtt({ ...editingAtt, status: v })} options={[
                    { value: 'Normal', label: 'Normal' }, { value: 'Falta', label: 'Falta' }, { value: 'Atraso', label: 'Atraso' }, { value: 'Saída Antecipada', label: 'Saída Antecipada' }]} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                  <Btn onClick={() => setEditingAtt(null)} color="#8E9093">Cancelar</Btn>
                  <Btn onClick={saveEditAttendance}>💾 Salvar</Btn>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* FÉRIAS */}
      {/* ============================================================ */}
      {tab === 'vacations' && (
        <div>
          <Card style={{ marginBottom: 16, padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <Select label="Status" value={vacationStatus} onChange={setVacationStatus} options={[
                { value: '', label: 'Todos' }, { value: 'Solicitada', label: 'Solicitadas' },
                { value: 'Aprovada Gestor', label: 'Aprovada Gestor' },
                { value: 'Aprovada', label: 'Aprovadas (RH)' }, { value: 'Rejeitada', label: 'Rejeitadas' }
              ]} />
              <div style={{ flex: 1 }}>
                <Input label="Buscar colaborador" value={vacationSearch} onChange={setVacationSearch} placeholder="Nome..." />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: 10 }}>
                <Btn onClick={() => load('vacations', setVacations, vacationStatus ? `&status=${vacationStatus}` : '')} color="#1A73E8" small>🔍 Buscar</Btn>
                <Btn onClick={() => { setShowVacationForm(!showVacationForm); if (!employees.length) load('employees', setEmployees); }} small>{showVacationForm ? '✕' : '🏖️ Solicitar Férias'}</Btn>
              </div>
            </div>
          </Card>
          {showVacationForm && (
            <Card style={{ marginBottom: 16 }}>
              <SectionTitle icon="🏖️" text="Solicitar Férias" />
              <form onSubmit={requestVacation} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <Select label="Colaborador" value={vacForm.employee_id} onChange={v => setVacForm({ ...vacForm, employee_id: v })} options={employees.map(e => ({ value: e.id, label: e.name }))} />
                <Input label="Início" value={vacForm.start_date} onChange={v => setVacForm({ ...vacForm, start_date: v })} type="date" required />
                <Input label="Fim" value={vacForm.end_date} onChange={v => setVacForm({ ...vacForm, end_date: v })} type="date" required />
                <Input label="Observação" value={vacForm.notes} onChange={v => setVacForm({ ...vacForm, notes: v })} placeholder="Opcional" />
                <div style={{ display: 'flex', alignItems: 'flex-end' }}><Btn disabled={loading}>💾 Solicitar</Btn></div>
              </form>
            </Card>
          )}
          <Card>
            <SectionTitle icon="🏖️" text={`Gestão de Férias (${vacations.length})`} />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><Th>Colaborador</Th><Th>Início</Th><Th>Fim</Th><Th>Dias</Th><Th>Status</Th><Th>Aprovado por</Th><Th>Ações</Th></tr></thead>
              <tbody>
                {vacations.filter(v => !vacationSearch || v.employee_name?.toLowerCase().includes(vacationSearch.toLowerCase())).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <Td><span style={{ fontWeight: 600, color: '#2A2B2D' }}>{v.employee_name}</span></Td>
                    <Td>{formatDate(v.start_date)}</Td><Td>{formatDate(v.end_date)}</Td>
                    <Td>{v.days}d</Td>
                    <Td><Badge text={v.status} color={v.status === 'Aprovada' ? '#22A06B' : v.status === 'Aprovada Gestor' ? '#1A73E8' : v.status === 'Rejeitada' ? '#D93025' : '#F26B25'} /></Td>
                    <Td>{v.approved_by_name || '—'}</Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {v.status === 'Solicitada' && (
                          <>
                            <button onClick={() => approveVacation(v.id)} style={{ background: 'rgba(34, 160, 107, 0.1)', border: '1px solid rgba(34, 160, 107, 0.3)', color: '#22A06B', borderRadius: 6, padding: '4px 8px', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>✅ Aprovar (Gestor)</button>
                            <button onClick={() => rejectVacation(v.id)} style={{ background: 'rgba(217, 48, 37, 0.1)', border: '1px solid rgba(217, 48, 37, 0.3)', color: '#D93025', borderRadius: 6, padding: '4px 8px', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>❌ Rejeitar</button>
                          </>
                        )}
                        {v.status === 'Aprovada Gestor' && (
                          <>
                            <button onClick={() => approveVacation(v.id)} style={{ background: 'rgba(26, 115, 232, 0.1)', border: '1px solid rgba(26, 115, 232, 0.3)', color: '#1A73E8', borderRadius: 6, padding: '4px 8px', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>✅ Confirmar (RH)</button>
                            <button onClick={() => rejectVacation(v.id)} style={{ background: 'rgba(217, 48, 37, 0.1)', border: '1px solid rgba(217, 48, 37, 0.3)', color: '#D93025', borderRadius: 6, padding: '4px 8px', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>❌ Rejeitar</button>
                          </>
                        )}
                        <button onClick={() => setEditingVac({ ...v })} style={{ background: 'none', border: 'none', color: '#F26B25', cursor: 'pointer', fontSize: 12 }} title="Editar">✏️</button>
                        <button onClick={() => deleteVacation(v.id)} style={{ background: 'none', border: 'none', color: '#D93025', cursor: 'pointer', fontSize: 12 }} title="Excluir">🗑️</button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {vacations.length === 0 && <p style={{ textAlign: 'center', padding: 30, color: '#8E9093', fontSize: 12 }}>Nenhuma solicitação de férias</p>}
          </Card>
          {/* Modal edição férias */}
          {editingVac && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(42, 43, 45, 0.7)', backdropFilter: 'blur(4px)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#FFFFFF', borderRadius: 20, width: 500, border: '1px solid #E5E7EB', padding: 30, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F26B25', margin: 0 }}>✏️ Editar Férias — {editingVac.employee_name}</h3>
                  <button onClick={() => setEditingVac(null)} style={{ background: 'none', border: 'none', color: '#8E9093', fontSize: 18, cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Input label="Início" value={editingVac.start_date || ''} onChange={v => setEditingVac({ ...editingVac, start_date: v })} type="date" />
                  <Input label="Fim" value={editingVac.end_date || ''} onChange={v => setEditingVac({ ...editingVac, end_date: v })} type="date" />
                  <div style={{ gridColumn: 'span 2' }}>
                    <Input label="Observação" value={editingVac.notes || ''} onChange={v => setEditingVac({ ...editingVac, notes: v })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                  <Btn onClick={() => setEditingVac(null)} color="#8E9093">Cancelar</Btn>
                  <Btn onClick={saveEditVacation}>💾 Salvar</Btn>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* DESEMPENHO */}
      {/* ============================================================ */}
      {tab === 'performance' && (
        <div>
          <Card style={{ marginBottom: 16, padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <Input label="Buscar colaborador ou avaliador" value={reviewSearch} onChange={setReviewSearch} placeholder="Nome..." />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: 10 }}>
                <Btn onClick={() => load('performance', setReviews)} color="#1A73E8" small>🔍 Atualizar</Btn>
                <Btn onClick={() => { setShowReviewForm(!showReviewForm); if (!employees.length) load('employees', setEmployees); }} small>{showReviewForm ? '✕' : '⭐ Nova Avaliação'}</Btn>
              </div>
            </div>
          </Card>
          {showReviewForm && (
            <Card style={{ marginBottom: 16 }}>
              <SectionTitle icon="⭐" text="Nova Avaliação de Desempenho" />
              <form onSubmit={createReview}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <Select label="Colaborador" value={revForm.employee_id} onChange={v => setRevForm({ ...revForm, employee_id: v })} options={employees.map(e => ({ value: e.id, label: e.name }))} />
                  <Select label="Avaliador" value={revForm.reviewer_id} onChange={v => setRevForm({ ...revForm, reviewer_id: v })} options={employees.map(e => ({ value: e.id, label: e.name }))} placeholder="Opcional" />
                  <Input label="Período" value={revForm.period} onChange={v => setRevForm({ ...revForm, period: v })} placeholder="Ex: 2026-S1" />
                  <Input label="Nota (0-10)" value={revForm.score} onChange={v => setRevForm({ ...revForm, score: v })} type="number" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                  <div>
                    <label style={{ fontSize: 10, color: '#8E9093', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Feedback</label>
                    <textarea value={revForm.feedback} onChange={e => setRevForm({ ...revForm, feedback: e.target.value })} rows={3}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 12, background: '#FFFFFF', border: '1px solid #D4D5D6', color: '#2A2B2D', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: '#8E9093', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Metas</label>
                    <textarea value={revForm.goals} onChange={e => setRevForm({ ...revForm, goals: e.target.value })} rows={3}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 12, background: '#FFFFFF', border: '1px solid #D4D5D6', color: '#2A2B2D', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}><Btn disabled={loading}>💾 Salvar Avaliação</Btn></div>
              </form>
            </Card>
          )}
          <Card>
            <SectionTitle icon="⭐" text={`Avaliações de Desempenho (${reviews.length})`} />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><Th>Colaborador</Th><Th>Avaliador</Th><Th>Período</Th><Th>Nota</Th><Th>Feedback</Th><Th>Metas</Th><Th>Ações</Th></tr></thead>
              <tbody>
                {reviews.filter(r => !reviewSearch || r.employee_name?.toLowerCase().includes(reviewSearch.toLowerCase()) || r.reviewer_name?.toLowerCase().includes(reviewSearch.toLowerCase())).map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <Td><span style={{ fontWeight: 600, color: '#2A2B2D' }}>{r.employee_name}</span></Td>
                    <Td>{r.reviewer_name || '—'}</Td>
                    <Td><Badge text={r.period || '—'} color="#1A73E8" /></Td>
                    <Td>
                      <span style={{ fontWeight: 800, fontSize: 16, color: r.score >= 8 ? '#22A06B' : r.score >= 5 ? '#F26B25' : '#D93025' }}>
                        {r.score}
                      </span>
                    </Td>
                    <Td><span style={{ fontSize: 11, lineHeight: 1.4, display: 'block', maxWidth: 250, color: '#3D3E40' }}>{r.feedback?.substring(0, 100) || '—'}{r.feedback?.length > 100 ? '...' : ''}</span></Td>
                    <Td><span style={{ fontSize: 11, color: '#636466', display: 'block', maxWidth: 200 }}>{r.goals?.substring(0, 80) || '—'}{r.goals?.length > 80 ? '...' : ''}</span></Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setEditingRev({ ...r })} style={{ background: 'none', border: 'none', color: '#F26B25', cursor: 'pointer', fontSize: 12 }} title="Editar">✏️</button>
                        <button onClick={() => deleteReview(r.id)} style={{ background: 'none', border: 'none', color: '#D93025', cursor: 'pointer', fontSize: 12 }} title="Excluir">🗑️</button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reviews.length === 0 && <p style={{ textAlign: 'center', padding: 30, color: '#8E9093', fontSize: 12 }}>Nenhuma avaliação registrada</p>}
          </Card>
          {/* Modal edição desempenho */}
          {editingRev && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(42, 43, 45, 0.7)', backdropFilter: 'blur(4px)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#FFFFFF', borderRadius: 20, width: 600, maxHeight: '90vh', overflowY: 'auto', border: '1px solid #E5E7EB', padding: 30, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F26B25', margin: 0 }}>✏️ Editar Avaliação — {editingRev.employee_name}</h3>
                  <button onClick={() => setEditingRev(null)} style={{ background: 'none', border: 'none', color: '#8E9093', fontSize: 18, cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Input label="Período" value={editingRev.period || ''} onChange={v => setEditingRev({ ...editingRev, period: v })} />
                  <Input label="Nota (0-10)" value={editingRev.score} onChange={v => setEditingRev({ ...editingRev, score: v })} type="number" />
                </div>
                <div style={{ marginTop: 10 }}>
                  <label style={{ fontSize: 10, color: '#8E9093', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Feedback</label>
                  <textarea value={editingRev.feedback || ''} onChange={e => setEditingRev({ ...editingRev, feedback: e.target.value })} rows={3}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 12, background: '#FFFFFF', border: '1px solid #D4D5D6', color: '#2A2B2D', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginTop: 10 }}>
                  <label style={{ fontSize: 10, color: '#8E9093', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Metas</label>
                  <textarea value={editingRev.goals || ''} onChange={e => setEditingRev({ ...editingRev, goals: e.target.value })} rows={3}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 12, background: '#FFFFFF', border: '1px solid #D4D5D6', color: '#2A2B2D', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                  <Btn onClick={() => setEditingRev(null)} color="#8E9093">Cancelar</Btn>
                  <Btn onClick={saveEditReview}>💾 Salvar</Btn>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TREINAMENTOS */}
      {/* ============================================================ */}
      {tab === 'trainings' && (
        <div>
          <Card style={{ marginBottom: 16, padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <Input label="Buscar treinamento" value={trainingSearch} onChange={setTrainingSearch} placeholder="Nome ou provedor..." />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: 10 }}>
                <Btn onClick={() => load('trainings', setTrainings)} color="#1A73E8" small>🔍 Atualizar</Btn>
                <Btn onClick={() => setShowTrainingForm(!showTrainingForm)} small>{showTrainingForm ? '✕' : '🎓 Novo Treinamento'}</Btn>
              </div>
            </div>
          </Card>
          {showTrainingForm && (
            <Card style={{ marginBottom: 16 }}>
              <SectionTitle icon="🎓" text="Cadastrar Treinamento" />
              <form onSubmit={createTraining} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <Input label="Nome" value={trnForm.name} onChange={v => setTrnForm({ ...trnForm, name: v })} required />
                <Input label="Provedor" value={trnForm.provider} onChange={v => setTrnForm({ ...trnForm, provider: v })} placeholder="Ex: SENAI" />
                <Input label="Duração" value={trnForm.duration} onChange={v => setTrnForm({ ...trnForm, duration: v })} placeholder="Ex: 40 horas" />
                <Input label="Descrição" value={trnForm.description} onChange={v => setTrnForm({ ...trnForm, description: v })} />
                <div style={{ display: 'flex', alignItems: 'flex-end' }}><Btn disabled={loading}>💾 Cadastrar</Btn></div>
              </form>
            </Card>
          )}
          <Card>
            <SectionTitle icon="🎓" text={`Treinamentos (${trainings.length})`} />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><Th>Treinamento</Th><Th>Provedor</Th><Th>Duração</Th><Th>Descrição</Th><Th>Status</Th><Th>Ações</Th></tr></thead>
              <tbody>
                {trainings.filter(t => !trainingSearch || t.name?.toLowerCase().includes(trainingSearch.toLowerCase()) || t.provider?.toLowerCase().includes(trainingSearch.toLowerCase())).map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <Td><span style={{ fontWeight: 600, color: '#2A2B2D' }}>{t.name}</span></Td>
                    <Td>{t.provider || '—'}</Td>
                    <Td><Badge text={t.duration || '—'} color="#1A73E8" /></Td>
                    <Td><span style={{ fontSize: 11, color: '#3D3E40' }}>{t.description?.substring(0, 80) || '—'}</span></Td>
                    <Td><Badge text={t.active ? 'Ativo' : 'Inativo'} color={t.active ? '#22A06B' : '#D93025'} /></Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setEditingTrn({ ...t })} style={{ background: 'none', border: 'none', color: '#F26B25', cursor: 'pointer', fontSize: 12 }} title="Editar">✏️</button>
                        <button onClick={() => deleteTraining(t.id)} style={{ background: 'none', border: 'none', color: '#D93025', cursor: 'pointer', fontSize: 12 }} title="Desativar">🗑️</button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {trainings.length === 0 && <p style={{ textAlign: 'center', padding: 30, color: '#8E9093', fontSize: 12 }}>Nenhum treinamento cadastrado</p>}
          </Card>
          {/* Modal edição treinamento */}
          {editingTrn && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(42, 43, 45, 0.7)', backdropFilter: 'blur(4px)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#FFFFFF', borderRadius: 20, width: 500, border: '1px solid #E5E7EB', padding: 30, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F26B25', margin: 0 }}>✏️ Editar Treinamento</h3>
                  <button onClick={() => setEditingTrn(null)} style={{ background: 'none', border: 'none', color: '#8E9093', fontSize: 18, cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Input label="Nome" value={editingTrn.name} onChange={v => setEditingTrn({ ...editingTrn, name: v })} />
                  <Input label="Provedor" value={editingTrn.provider || ''} onChange={v => setEditingTrn({ ...editingTrn, provider: v })} />
                  <Input label="Duração" value={editingTrn.duration || ''} onChange={v => setEditingTrn({ ...editingTrn, duration: v })} />
                  <Input label="Descrição" value={editingTrn.description || ''} onChange={v => setEditingTrn({ ...editingTrn, description: v })} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                  <Btn onClick={() => setEditingTrn(null)} color="#8E9093">Cancelar</Btn>
                  <Btn onClick={saveEditTraining}>💾 Salvar</Btn>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* RECRUTAMENTO */}
      {/* ============================================================ */}
      {tab === 'recruitment' && (
        <Card>
          <SectionTitle icon="📋" text="Vagas e Recrutamento" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Vaga</Th><Th>Departamento</Th><Th>Faixa Salarial</Th><Th>Candidatos</Th><Th>Status</Th></tr></thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <Td><span style={{ fontWeight: 600, color: '#2A2B2D' }}>{j.title}</span></Td>
                  <Td>{j.department_name || '—'}</Td><Td>{j.salary_range || '—'}</Td>
                  <Td><span style={{ fontWeight: 700, color: '#1A73E8' }}>{j.applications_count || 0}</span></Td>
                  <Td><Badge text={j.status} color={j.status === 'Aberta' ? '#22A06B' : '#8E9093'} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobs.length === 0 && <p style={{ textAlign: 'center', padding: 30, color: '#8E9093', fontSize: 12 }}>Nenhuma vaga cadastrada</p>}
        </Card>
      )}

      {/* ============================================================ */}
      {/* PEOPLE INSIGHTS */}
      {/* ============================================================ */}
      {tab === 'insights' && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <SectionTitle icon="🎉" text="Mural de Celebrações" />
            {feed.length === 0 && <p style={{ fontSize: 12, color: '#8E9093' }}>Nenhum evento no momento</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {feed.map((f, i) => (
                <div key={i} style={{
                  padding: '16px 18px', borderRadius: 14,
                  background: f.type === 'birthday' ? 'rgba(242, 107, 37, 0.05)' : f.type === 'new_hire' ? 'rgba(34, 160, 107, 0.05)' : '#F9FAFB',
                  border: `1px solid ${f.type === 'birthday' ? 'rgba(242, 107, 37, 0.2)' : f.type === 'new_hire' ? 'rgba(34, 160, 107, 0.2)' : '#E5E7EB'}`,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 28 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, color: '#2A2B2D', fontWeight: 600 }}>{f.message}</div>
                    <div style={{ fontSize: 10, color: '#8E9093', marginTop: 2, textTransform: 'uppercase' }}>{f.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          {promotions.length > 0 && (
            <Card>
              <SectionTitle icon="🏆" text="Promoções Recentes" />
              {promotions.slice(0, 10).map((pr, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #E5E7EB', fontSize: 12, color: '#3D3E40' }}>
                  <strong style={{ color: '#2A2B2D' }}>{pr.employee_name}</strong>: {pr.old_position_name || '—'} → <span style={{ color: '#22A06B', fontWeight: 700 }}>{pr.new_position_name || '—'}</span>
                  <span style={{ color: '#8E9093', marginLeft: 8 }}>{formatDate(pr.promotion_date)}</span>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}