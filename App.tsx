
import React, { useState, useRef, useEffect } from 'react';
import { 
  FilePlus, 
  ClipboardCheck, 
  Printer, 
  LayoutDashboard, 
  Settings,
  Plus,
  Trash2,
  Edit,
  Save,
  Wand2,
  ArrowLeft,
  GraduationCap,
  Check,
  Download,
  School,
  User,
  Info,
  FileText,
  FileUp,
  X,
  Scale
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { ViewState, Exam, CorrectionResult, Question, UserSettings } from './types';
import { generateExamWithAI, correctExamWithAI } from './services/gemini';
import { ExamPaper } from './components/ExamPaper';

const DEFAULT_SETTINGS: UserSettings = {
  teacherName: '',
  schoolName: '',
  defaultInstructions: '1. Leia atentamente todas as questões.\n2. Utilize caneta azul ou preta.\n3. Não é permitido o uso de corretor líquido.\n4. Revisar as respostas antes de entregar.'
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [exams, setExams] = useState<Exam[]>([]);
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(false);
  const [correction, setCorrection] = useState<CorrectionResult | null>(null);
  const [isEditingCorrection, setIsEditingCorrection] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [saveStatus, setSaveStatus] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{ name: string, data: string } | null>(null);
  
  const examRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedExams = localStorage.getItem('iaeduca_exams');
    if (savedExams) setExams(JSON.parse(savedExams));

    const savedSettings = localStorage.getItem('iaeduca_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  useEffect(() => {
    localStorage.setItem('iaeduca_exams', JSON.stringify(exams));
  }, [exams]);

  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    grade: '',
    count: 5,
    difficulty: 'Média',
    modelReference: ''
  });

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setSelectedPdf({ name: file.name, data: base64 });
      };
      reader.readAsDataURL(file);
    } else if (file) {
      alert("Por favor, selecione apenas arquivos PDF.");
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      const newExam = await generateExamWithAI({
        ...formData,
        pdfData: selectedPdf?.data
      });
      
      const augmentedExam: Exam = {
        ...newExam,
        teacherName: settings.teacherName || "Nome do Professor",
        schoolName: settings.schoolName || "Nome da Instituição",
        instructions: newExam.instructions || settings.defaultInstructions
      };

      setExams([augmentedExam, ...exams]);
      setCurrentExam(augmentedExam);
      setView('edit');
    } catch (error) {
      console.error("Erro ao gerar prova:", error);
      alert("Houve um erro ao gerar sua prova. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('iaeduca_settings', JSON.stringify(settings));
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 3000);
  };

  const handleCorrect = async (studentText: string) => {
    if (!currentExam) return;
    try {
      setLoading(true);
      const res = await correctExamWithAI(currentExam, studentText);
      setCorrection(res);
      setIsEditingCorrection(false);
    } catch (error) {
      console.error("Erro na correção:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = examRef.current;
    if (!element || !currentExam) return;
    
    try {
      setIsExporting(true);
      const opt = {
        margin: 10,
        filename: `${currentExam.title.replace(/\s+/g, '_') || 'prova'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      // Fix for "html2pdf is not a function" when using ESM bundles
      const exporter = (html2pdf as any).default || html2pdf;
      if (typeof exporter !== 'function') {
        throw new Error('PDF exporter library could not be initialized as a function.');
      }
      
      await exporter().set(opt).from(element).save();
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      alert("Houve um problema ao gerar o PDF. Por favor, tente imprimir usando as opções nativas do seu navegador (Ctrl+P ou Cmd+P).");
    } finally {
      setIsExporting(false);
    }
  };

  const updateCorrectionField = (field: keyof CorrectionResult, value: any) => {
    if (correction) {
      setCorrection({ ...correction, [field]: value });
    }
  };

  const updateDetailedCorrectionComment = (index: number, comment: string) => {
    if (correction) {
      const newDetailed = [...correction.detailedCorrection];
      newDetailed[index] = { ...newDetailed[index], comment };
      setCorrection({ ...correction, detailedCorrection: newDetailed });
    }
  };

  const deleteExam = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta prova?")) {
      setExams(exams.filter(e => e.id !== id));
    }
  };

  const updateCurrentExam = (updates: Partial<Exam>) => {
    if (currentExam) {
      setCurrentExam({ ...currentExam, ...updates });
    }
  };

  const NavItem = ({ icon: Icon, label, active, onClick, color = "blue" }: any) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full ${
        active 
          ? `bg-${color}-600 text-white shadow-lg` 
          : `text-slate-600 hover:bg-slate-100`
      }`}
    >
      <Icon size={20} />
      <span className="font-medium whitespace-nowrap">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="no-print w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 shrink-0">
        <div className="flex items-center gap-2 px-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <GraduationCap size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight text-blue-900">IAEduca</span>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <NavItem icon={FilePlus} label="Criar Prova" active={view === 'create'} onClick={() => setView('create')} />
          <NavItem icon={ClipboardCheck} label="Corrigir" active={view === 'correct'} onClick={() => {
            if (exams.length > 0) {
              if (!currentExam) setCurrentExam(exams[0]);
              setView('correct');
            } else {
              alert("Crie uma prova primeiro!");
            }
          }} />
          <NavItem icon={Settings} label="Configurações" active={view === 'settings'} onClick={() => setView('settings')} />
        </nav>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <p className="text-xs font-semibold text-blue-600 uppercase mb-1 tracking-wider">Status</p>
          <p className="text-sm text-blue-900 font-bold">Plano Premium</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-4 md:p-10">
        {/* DASHBOARD */}
        {view === 'dashboard' && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Minhas Avaliações</h1>
                <p className="text-slate-500">Acesse e gerencie suas provas inteligentes.</p>
              </div>
              <button onClick={() => setView('create')} className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-bold">
                <Plus size={20} /> Nova Prova
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FilePlus className="text-slate-400" size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Sua lista está vazia</h3>
                  <p className="text-slate-500 mb-6 px-4">Utilize nossa IA para gerar provas personalizadas em segundos.</p>
                  <button onClick={() => setView('create')} className="bg-blue-50 text-blue-600 px-6 py-2 rounded-full font-bold hover:bg-blue-100 transition">Começar agora</button>
                </div>
              ) : (
                exams.map(exam => (
                  <div key={exam.id} className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-xl transition-all group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{exam.subject}</div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setCurrentExam(exam); setView('edit'); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar"><Edit size={16} /></button>
                        <button onClick={() => deleteExam(exam.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Excluir"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight">{exam.title}</h3>
                    <p className="text-xs text-slate-500 mb-4">{exam.grade} • {exam.date}</p>
                    <div className="flex gap-2 pt-4 border-t border-slate-100">
                      <button onClick={() => { setCurrentExam(exam); setView('print'); }} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-slate-200 text-sm font-bold transition"><Printer size={14} /> Imprimir</button>
                      <button onClick={() => { setCurrentExam(exam); setView('correct'); }} className="flex-1 bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-blue-700 text-sm font-bold transition shadow-sm"><ClipboardCheck size={14} /> Corrigir</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* CREATE VIEW */}
        {view === 'create' && (
          <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
            <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-bold transition">
              <ArrowLeft size={20} /> Painel Geral
            </button>
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-blue-600 p-8 text-white">
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  <Wand2 className="text-blue-200" /> Criar Prova com IA
                </h1>
                <p className="text-blue-100 mt-2 opacity-90">Preencha os dados e deixe a IA cuidar da estrutura para você.</p>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h2 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center gap-2"><FileText size={18} className="text-blue-600" /> Parâmetros</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Disciplina</label>
                        <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Ex: Matemática" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Conteúdo</label>
                        <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} placeholder="Ex: Equações de 2º Grau" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Série/Ano</label>
                        <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} placeholder="Ex: 9º Ano" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Qtd Questões</label>
                        <input type="number" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" value={formData.count} onChange={e => setFormData({...formData, count: parseInt(e.target.value) || 0})} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Dificuldade</label>
                        <div className="flex gap-2">
                          {['Fácil', 'Média', 'Difícil'].map(lvl => (
                            <button key={lvl} onClick={() => setFormData({...formData, difficulty: lvl})} className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${formData.difficulty === lvl ? 'bg-blue-600 text-white shadow-md border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}>{lvl}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h2 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2"><School size={18} className="text-blue-600" /> Modelo de Prova</div>
                      <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:text-blue-800 transition bg-blue-50 px-2 py-1 rounded"><FileUp size={14} /> Carregar PDF</button>
                    </h2>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handlePdfUpload} />
                    {selectedPdf && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText size={16} className="text-blue-600 shrink-0" />
                          <span className="text-xs font-bold text-blue-900 truncate">{selectedPdf.name}</span>
                        </div>
                        <button onClick={() => setSelectedPdf(null)} className="text-blue-400 hover:text-red-500"><X size={16} /></button>
                      </div>
                    )}
                    <textarea className="w-full h-56 px-4 py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Cole aqui seu texto de referência ou carregue um PDF..." value={formData.modelReference} onChange={e => setFormData({...formData, modelReference: e.target.value})} />
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <button onClick={handleCreate} disabled={loading || !formData.subject || !formData.topic} className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition shadow-xl ${loading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 active:scale-[0.99]'}`}>
                    {loading ? (<><div className="animate-spin rounded-full h-6 w-6 border-4 border-slate-300 border-t-blue-600"></div> Gerando Prova...</>) : (<><Wand2 size={24} /> GERAR PROVA COM IA</>)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EDIT VIEW */}
        {view === 'edit' && currentExam && (
          <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-300">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-600"><ArrowLeft size={24} /></button>
                <h1 className="text-2xl font-bold text-slate-900">Editar Prova</h1>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setView('print')} className="bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-50 font-bold transition shadow-sm">
                  <Printer size={18} /> Visualizar
                </button>
                <button onClick={() => {
                  const newExams = exams.map(e => e.id === currentExam.id ? currentExam : e);
                  setExams(newExams);
                  alert("Alterações salvas com sucesso!");
                }} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 font-bold shadow-lg shadow-blue-100 transition active:scale-95">
                  <Save size={18} /> Salvar
                </button>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <aside className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                  <h3 className="font-bold text-lg text-slate-900 border-b pb-2">Informações da Prova</h3>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Título</label>
                    <input className="w-full bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg mt-1 font-bold text-slate-900 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500" value={currentExam.title} onChange={e => updateCurrentExam({ title: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Instituição</label>
                    <input className="w-full bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg mt-1 text-slate-900 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500" value={currentExam.schoolName} onChange={e => updateCurrentExam({ schoolName: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Instruções aos Alunos</label>
                    <textarea className="w-full bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg mt-1 text-sm h-48 resize-none text-slate-900 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500" value={currentExam.instructions} onChange={e => updateCurrentExam({ instructions: e.target.value })} />
                  </div>
                </div>
              </aside>

              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="font-bold text-lg text-slate-900">Questões do Exame</h3>
                    <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase">{currentExam.questions.length} Questões</span>
                  </div>
                  
                  <div className="space-y-8">
                    {currentExam.questions.map((q, idx) => (
                      <div key={q.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-5 relative group transition hover:border-blue-200">
                        <div className="absolute top-4 right-4 flex gap-2">
                          <button 
                            onClick={() => {
                              if(confirm("Deseja realmente excluir esta questão?")) {
                                const newQs = currentExam.questions.filter(qu => qu.id !== q.id);
                                updateCurrentExam({ questions: newQs });
                              }
                            }}
                            className="bg-white border border-red-100 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold"
                          >
                            <Trash2 size={16} /> Excluir
                          </button>
                        </div>
                        <div className="flex gap-4">
                          <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 mt-1">{idx + 1}</div>
                          <div className="flex-1 space-y-4">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Enunciado</label>
                            <textarea className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium leading-relaxed text-sm outline-none focus:ring-2 focus:ring-blue-500" value={q.question} onChange={e => {
                              const newQs = currentExam.questions.map(qu => qu.id === q.id ? { ...qu, question: e.target.value } : qu);
                              updateCurrentExam({ questions: newQs });
                            }} rows={3} />
                          </div>
                        </div>

                        {q.type === 'multiple' && q.options && (
                          <div className="ml-12 space-y-3">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Alternativas</label>
                            <div className="grid grid-cols-1 gap-3">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-3">
                                  <span className="text-xs font-black text-slate-400 w-5 flex justify-center">{String.fromCharCode(65 + oIdx)}</span>
                                  <input className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 outline-none focus:ring-1 focus:ring-blue-500" value={opt} onChange={e => {
                                    const newOptions = [...q.options!];
                                    newOptions[oIdx] = e.target.value;
                                    const newQs = currentExam.questions.map(qu => qu.id === q.id ? { ...qu, options: newOptions } : qu);
                                    updateCurrentExam({ questions: newQs });
                                  }} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="ml-12 flex flex-wrap gap-6 pt-5 border-t border-slate-200/50">
                          <div className="flex-1 min-w-[200px] space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Gabarito / Resposta Correta</label>
                            <div className="flex items-center gap-2">
                              <span className="bg-green-100 text-green-700 p-1.5 rounded-lg"><Check size={14} /></span>
                              <input className="flex-1 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-500" value={q.correctAnswer} onChange={e => {
                                const newQs = currentExam.questions.map(qu => qu.id === q.id ? { ...qu, correctAnswer: e.target.value } : qu);
                                updateCurrentExam({ questions: newQs });
                              }} />
                            </div>
                          </div>
                          <div className="w-36 space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Peso da Questão</label>
                            <div className="flex items-center gap-2">
                              <span className="bg-amber-100 text-amber-700 p-1.5 rounded-lg"><Scale size={14} /></span>
                              <input type="number" step="0.1" className="w-full bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-900 text-center outline-none focus:ring-2 focus:ring-blue-500" value={q.weight || 1.0} onChange={e => {
                                const newQs = currentExam.questions.map(qu => qu.id === q.id ? { ...qu, weight: parseFloat(e.target.value) || 0 } : qu);
                                updateCurrentExam({ questions: newQs });
                              }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => {
                    const newQ: Question = {
                      id: Math.random().toString(36).substr(2, 9),
                      type: 'open',
                      question: 'Escreva aqui o enunciado da sua nova questão...',
                      correctAnswer: 'Escreva o gabarito esperado...',
                      weight: 1.0
                    };
                    updateCurrentExam({ questions: [...currentExam.questions, newQ] });
                  }} className="w-full mt-10 py-5 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2 bg-slate-50/50 hover:bg-blue-50/30">
                    <Plus size={24} /> Adicionar Nova Questão Manualmente
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRINT VIEW */}
        {view === 'print' && currentExam && (
          <div className="max-w-5xl mx-auto animate-in fade-in duration-300">
            <div className="no-print flex flex-col sm:flex-row items-center justify-between mb-8 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm gap-4">
              <div className="flex items-center gap-4">
                <button onClick={() => setView('edit')} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-600"><ArrowLeft size={24} /></button>
                <div>
                   <h1 className="text-xl font-bold text-slate-900">Pré-visualização Final</h1>
                   <p className="text-xs text-slate-400">Verifique a formatação antes de exportar.</p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={handleDownloadPDF} disabled={isExporting} className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-700 px-8 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 font-bold transition active:scale-95 disabled:opacity-50">
                  {isExporting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-400"></div> : <Download size={20} />} PDF
                </button>
                <button onClick={() => window.print()} className="flex-1 sm:flex-none bg-blue-600 text-white px-10 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition active:scale-95">
                  <Printer size={20} /> Imprimir
                </button>
              </div>
            </div>
            <div ref={examRef} className="print:m-0">
              <ExamPaper exam={currentExam} />
            </div>
          </div>
        )}

        {/* SETTINGS VIEW */}
        {view === 'settings' && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-left-4 duration-500">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Configurações da Conta</h1>
              <p className="text-slate-500">Personalize o cabeçalho padrão das suas provas.</p>
            </header>
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-6 shadow-sm">
                <h3 className="text-xl font-bold flex items-center gap-2"><User size={22} className="text-blue-600" /> Identificação Docente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Seu Nome Completo</label>
                    <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" value={settings.teacherName} onChange={e => setSettings({...settings, teacherName: e.target.value})} placeholder="Ex: Prof. Maria Oliveira" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Instituição Principal</label>
                    <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" value={settings.schoolName} onChange={e => setSettings({...settings, schoolName: e.target.value})} placeholder="Ex: Colégio Objetivo" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-6 shadow-sm">
                <h3 className="text-xl font-bold flex items-center gap-2"><School size={22} className="text-blue-600" /> Instruções Gerais Padrão</h3>
                <textarea className="w-full h-48 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={settings.defaultInstructions} onChange={e => setSettings({...settings, defaultInstructions: e.target.value})} placeholder="Escreva as regras gerais que aparecem no cabeçalho..." />
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={handleSaveSettings} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-700 transition flex items-center gap-3 shadow-xl shadow-blue-100 active:scale-95">
                  {saveStatus ? <><Check size={20} /> Configurações Salvas!</> : <><Save size={20} /> Salvar Alterações</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CORRECT VIEW */}
        {view === 'correct' && currentExam && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-right-4 duration-500">
             <header className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-600"><ArrowLeft size={24} /></button>
                <h1 className="text-2xl font-bold text-slate-900">Correção Inteligente</h1>
              </div>
            </header>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-8 shadow-sm">
              <div className="flex items-center gap-4 p-6 bg-blue-50 rounded-[2rem] border border-blue-100">
                <div className="bg-white p-4 rounded-2xl shadow-sm text-blue-600"><FilePlus /></div>
                <div className="flex-1">
                  <h3 className="font-bold text-blue-900 text-lg leading-tight">{currentExam.title}</h3>
                  <p className="text-sm text-blue-700 opacity-80">{currentExam.questions.length} Questões identificadas</p>
                </div>
                {!correction && (
                  <select className="bg-white border border-blue-200 text-sm font-bold px-5 py-3 rounded-2xl text-blue-900 outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => {
                    const ex = exams.find(ex => ex.id === e.target.value);
                    if (ex) setCurrentExam(ex);
                  }} value={currentExam.id}>
                    {exams.map(e => (<option key={e.id} value={e.id}>{e.title}</option>))}
                  </select>
                )}
              </div>
              {!correction ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Respostas do Aluno</label>
                    <p className="text-xs text-slate-400 mb-2">Cole aqui a transcrição das respostas do aluno (Ex: 1. A, 2. B...)</p>
                    <textarea id="studentAnswers" className="w-full h-80 p-6 rounded-[2rem] border border-slate-200 bg-white text-slate-900 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-blue-500" placeholder="Digite ou cole as respostas aqui..." />
                  </div>
                  <button onClick={() => {
                    const text = (document.getElementById('studentAnswers') as HTMLTextAreaElement).value;
                    if (!text.trim()) return alert("Por favor, insira as respostas do aluno antes de prosseguir.");
                    handleCorrect(text);
                  }} disabled={loading} className="w-full py-6 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-4 shadow-xl shadow-green-100 transition active:scale-[0.98]">
                    {loading ? (<><div className="animate-spin rounded-full h-7 w-7 border-4 border-white/30 border-t-white"></div> Analisando...</>) : (<><ClipboardCheck size={28} /> PROCESSAR CORREÇÃO</>)}
                  </button>
                </div>
              ) : (
                <div className="space-y-8 animate-in zoom-in-95">
                  <div className="text-center p-12 bg-green-50 rounded-[3rem] border border-green-200 shadow-inner">
                    <div className="text-8xl font-black text-green-700 tracking-tighter">{correction.score.toFixed(1)}<span className="text-3xl text-green-400 font-bold">/10</span></div>
                    <div className="mt-6 bg-white/60 p-6 rounded-2xl border border-green-100 max-w-2xl mx-auto">
                      <p className="text-sm text-green-800 italic leading-relaxed">"{correction.feedback}"</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900 px-2 flex items-center gap-2"><Info size={18} className="text-blue-500" /> Relatório por Item</h4>
                    {correction.detailedCorrection.map((item, idx) => (
                      <div key={idx} className={`p-6 rounded-[2rem] border-2 transition ${item.isCorrect ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                        <div className="flex items-center justify-between mb-4">
                           <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${item.isCorrect ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                             Item {item.questionIndex + 1}
                           </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                          <div className="bg-white/80 p-4 rounded-2xl border border-white">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Aluno</p>
                            <p className="font-medium text-slate-800">{item.studentAnswer || '(Vazio)'}</p>
                          </div>
                          <div className="bg-white/80 p-4 rounded-2xl border border-white">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Gabarito</p>
                            <p className="font-bold text-blue-900">{item.correctAnswer}</p>
                          </div>
                        </div>
                        <div className="mt-4 p-4 bg-white/40 rounded-xl">
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Análise da IA</p>
                          <p className="text-xs text-slate-600 italic leading-relaxed">{item.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setCorrection(null)} className="w-full py-5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-2xl font-black transition active:scale-95 shadow-sm border border-slate-200">RECORRIGIR OU NOVA PROVA</button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
