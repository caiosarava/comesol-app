import React, { useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';

/*
  IMPORTANT: Paste this file as src/App.tsx in a React + Vite + TS project.
  Install dependencies:
  npm install @supabase/supabase-js react-router-dom react-hook-form zod

  Set env:
  VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
*/

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

/* --- Utils: simple validation helpers (CPF, CEP, email) --- */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cepRegex = /^\d{5}-?\d{3}$/;
const cpfDigits = (cpf: string) => cpf.replace(/\D/g, '');
function validateCPF(cpf: string) {
  const s = cpfDigits(cpf);
  if (!/^\d{11}$/.test(s)) return false;
  // basic algorithm
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(s[i]) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(s[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(s[i]) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(s[10])) return false;
  return true;
}

/* --- Connection check --- */
async function checkSupabaseConnection() {
  try {
    // lightweight check
    const { data, error } = await supabase.from('groups').select('id').limit(1);
    if (error) throw error;
    return true;
  } catch (err) {
    return false;
  }
}

/* --- App wrapper with routing --- */
export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-emerald-50 text-slate-800">
        <header className="max-w-4xl mx-auto p-6 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-emerald-700">Cadastramento Anual — COMESOL</h1>
          <AuthInfo />
        </header>

        <main className="max-w-4xl mx-auto p-6">
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<Protected><CadastroPage /></Protected>} />
            <Route path="/visualizacao" element={<Protected><VisualizacaoPage /></Protected>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

/* --- Simple auth info in header --- */
function AuthInfo() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const s = supabase.auth.getSession().then(r => setSession((r as any).data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => sub?.subscription.unsubscribe?.();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (!session) return <a href="/login" className="text-sky-700">Entrar</a>;
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm">{session.user.email}</span>
      <button onClick={handleLogout} className="bg-emerald-600 text-white px-3 py-1 rounded">Sair</button>
    </div>
  );
}

/* --- Protected wrapper: redirects to login if no session --- */
function Protected({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = (data as any).session;
      if (!session) {
        navigate('/login');
        return;
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-6 bg-white rounded shadow">Carregando...</div>;
  return <>{children}</>;
}

/* --- Login Page --- */
function LoginPage() {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if ((data as any).session) {
        // user already logged in -> check group
        await redirectAfterAuth(navigate);
      }
    })();
  }, []);

  const onEmail = async (vals: any) => {
    setChecking(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: vals.email, password: vals.password });
      if (error) throw error;
      await redirectAfterAuth(navigate);
    } catch (err: any) {
      alert('Erro ao logar: ' + err.message);
    } finally { setChecking(false); }
  };

  const onGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/login' } });
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow">
      <h2 className="text-xl font-semibold mb-4">Entrar</h2>
      <form onSubmit={handleSubmit(onEmail)} className="space-y-3">
        <input {...register('email')} placeholder="Email" className="w-full border rounded p-2" />
        <input {...register('password')} type="password" placeholder="Senha" className="w-full border rounded p-2" />
        <button type="submit" className="w-full bg-sky-600 text-white rounded py-2">Entrar</button>
      </form>

      <div className="my-4 text-center text-sm text-gray-500">ou</div>
      <button onClick={onGoogle} className="w-full border rounded py-2 flex items-center justify-center gap-2">
        Continuar com Google
      </button>

      <div className="mt-4 text-xs text-gray-500">Observação: ao efetuar login, você será direcionado para o cadastro ou para a visualização existente.</div>
    </div>
  );
}

async function redirectAfterAuth(navigate: any) {
  const { data } = await supabase.auth.getSession();
  const session = (data as any).session;
  if (!session) { navigate('/login'); return; }
  const userId = session.user.id;
  const { data: groups } = await supabase.from('groups').select('*').eq('user_id', userId).limit(1);
  if (groups && (groups as any).length > 0) {
    navigate('/visualizacao');
  } else {
    navigate('/cadastro');
  }
}

/* --- Cadastro Page (Group + Members) --- */
function CadastroPage() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [groupSaved, setGroupSaved] = useState<any | null>(null);

  const { register, handleSubmit, watch, control, setValue } = useForm({ defaultValues: { has_headquarters: false } });
  const hasHQ = watch('has_headquarters');

  useEffect(() => { (async () => setConnected(await checkSupabaseConnection()))(); }, []);

  const onAddMemberLocally = (member: any) => {
    setPendingMembers(prev => [...prev, { ...member, _id: cryptoRandomId() }]);
  };

  const onRemovePending = (id: string) => setPendingMembers(prev => prev.filter(m => m._id !== id));

  const onSaveGroup = async (vals: any) => {
    if (!connected) { alert('Sem conexão com o Supabase.'); return; }
    try {
      const { data, error } = await supabase.from('groups').insert([{ user_id: (await getUserId()), name: vals.name, representative_name: vals.representative_name, contact_email: vals.contact_email, has_headquarters: vals.has_headquarters, address: vals.has_headquarters ? { address_line: vals.address_line, cep: vals.cep } : null }]).select().single();
      if (error) throw error;
      setGroupSaved(data);
      // save members
      for (const m of pendingMembers) {
        const { error: err2 } = await supabase.from('members').insert([{ ...m, group_id: data.id }]);
        if (err2) throw err2;
      }
      alert('Cadastro salvo com sucesso');
      // redirect to visualizacao
      window.location.href = '/visualizacao';
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    }
  };

  if (connected === null) return <div className="p-6 bg-white rounded shadow">Verificando conexão...</div>;
  if (!connected) return (
    <div className="p-6 bg-white rounded shadow">
      <h3 className="font-semibold">Sem conexão com o Supabase</h3>
      <p className="text-sm text-gray-600">Verifique suas variáveis de ambiente e a disponibilidade do serviço.</p>
      <button onClick={() => window.location.reload()} className="mt-4 bg-emerald-600 text-white px-3 py-1 rounded">Tentar novamente</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow">
        <h3 className="text-lg font-semibold">Informações do Grupo</h3>
        <form onSubmit={handleSubmit(onSaveGroup)} className="space-y-3 mt-4">
          <input {...register('name', { required: true })} placeholder="Nome do grupo/empreendimento" className="w-full border rounded p-2" />
          <input {...register('representative_name', { required: true })} placeholder="Nome do representante" className="w-full border rounded p-2" />
          <input {...register('contact_email', { required: true, pattern: emailRegex })} placeholder="E-mail de contato" className="w-full border rounded p-2" />

          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('has_headquarters')} /> Possui sede própria?
          </label>
          {hasHQ && (
            <div className="space-y-2">
              <input {...register('address_line')} placeholder="Endereço completo" className="w-full border rounded p-2" />
              <input {...register('cep')} placeholder="CEP (00000-000)" className="w-full border rounded p-2" />
            </div>
          )}

          <div className="mt-4">
            <button type="submit" className={`bg-emerald-600 text-white px-4 py-2 rounded ${pendingMembers.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={pendingMembers.length === 0}>Salvar Cadastro do Grupo</button>
            <span className="ml-3 text-sm text-gray-600">(Habilitado com pelo menos 1 membro)</span>
          </div>
        </form>
      </div>

      <MemberForm onAdd={onAddMemberLocally} />

      <MembersPreview members={pendingMembers} onRemove={onRemovePending} />
    </div>
  );
}

/* --- Visualização Page --- */
function VisualizacaoPage() {
  const [group, setGroup] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => { (async () => setConnected(await checkSupabaseConnection()))(); }, []);

  useEffect(() => {
    (async () => {
      const uid = await getUserId();
      const { data: g } = await supabase.from('groups').select('*').eq('user_id', uid).limit(1);
      if (g && (g as any).length > 0) {
        setGroup((g as any)[0]);
        const { data: ms } = await supabase.from('members').select('*').eq('group_id', (g as any)[0].id);
        setMembers(ms || []);
      } else {
        // redirect to cadastro if none
        window.location.href = '/cadastro';
      }
    })();
  }, []);

  const onDeleteMember = async (id: string) => {
    if (!confirm('Confirmar exclusão do membro?')) return;
    await supabase.from('members').delete().eq('id', id);
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const onSaveAll = async () => {
    // for brevity, only updates group's updated_at. In real app update changed fields as well.
    await supabase.from('groups').update({ updated_at: new Date() }).eq('id', group.id);
    alert('Cadastro atualizado com sucesso');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow">
        <h3 className="text-lg font-semibold">Visualização do Cadastro</h3>
        {group ? (
          <div className="mt-4">
            <p><strong>Grupo:</strong> {group.name}</p>
            <p><strong>Representante:</strong> {group.representative_name}</p>
            <p><strong>Email contato:</strong> {group.contact_email}</p>
          </div>
        ) : <p>Carregando...</p>}

        <div className="mt-4">
          <button onClick={onSaveAll} className="bg-sky-600 text-white px-3 py-1 rounded">Salvar o Cadastro</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow">
        <h4 className="font-semibold">Membros</h4>
        <div className="mt-3 space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between border rounded p-3">
              <div>
                <div className="font-medium">{m.full_name}</div>
                <div className="text-sm text-gray-600">Função: {m.role_in_group} • Renda: {m.monthly_income_range}</div>
              </div>
              <div className="flex gap-2">
                <button className="text-emerald-600" onClick={() => alert('Implementar edição inline ou modal')}>Editar</button>
                <button className="text-red-600" onClick={() => onDeleteMember(m.id)}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --- Member Form component (local add) --- */
function MemberForm({ onAdd }: { onAdd: (m: any) => void }) {
  const { register, handleSubmit, watch } = useForm();
  const developsOther = watch('develops_other');

  const submit = (vals: any) => {
    // minimal validation
    if (!vals.full_name) { alert('Nome requerido'); return; }
    if (!vals.cpf || !validateCPF(vals.cpf)) { alert('CPF inválido'); return; }
    onAdd({
      full_name: vals.full_name,
      birth_date: vals.birth_date,
      mother_name: vals.mother_name,
      address: { line: vals.address_line, cep: vals.cep },
      cep: vals.cep,
      cpf: vals.cpf,
      phone: vals.phone,
      email: vals.email,
      rg: vals.rg,
      mei_cnpj: vals.mei_cnpj,
      gender: vals.gender,
      ethnicity: vals.ethnicity,
      education: vals.education,
      household_count: vals.household_count,
      role_in_group: vals.role_in_group,
      products_services: vals.products_services,
      raw_materials: vals.raw_materials,
      monthly_income_range: vals.monthly_income_range,
      solidarity_involvement: vals.solidarity_involvement,
      other_occupation: developsOther ? vals.other_occupation : null,
    });
    // reset minimal fields
    (document.querySelectorAll('input') as NodeListOf<HTMLInputElement>).forEach(i => i.value = '');
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow">
      <h3 className="text-lg font-semibold">Cadastro dos Membros</h3>
      <form onSubmit={handleSubmit(submit)} className="space-y-3 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input {...register('full_name')} placeholder="Nome completo" className="w-full border rounded p-2" />
          <input {...register('birth_date')} type="date" className="w-full border rounded p-2" />
          <input {...register('mother_name')} placeholder="Nome da mãe" className="w-full border rounded p-2" />
          <input {...register('address_line')} placeholder="Endereço completo" className="w-full border rounded p-2" />
          <input {...register('cep')} placeholder="CEP" className="w-full border rounded p-2" />
          <input {...register('cpf')} placeholder="CPF" className="w-full border rounded p-2" />
          <input {...register('phone')} placeholder="Celular" className="w-full border rounded p-2" />
          <input {...register('email')} placeholder="E-mail" className="w-full border rounded p-2" />
          <input {...register('rg')} placeholder="RG" className="w-full border rounded p-2" />
          <input {...register('mei_cnpj')} placeholder="MEI / CNPJ (opcional)" className="w-full border rounded p-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          <select {...register('gender')} className="border rounded p-2">
            <option value="">Gênero</option>
            <option>Homem cisgênero</option>
            <option>Mulher cisgênero</option>
            <option>Homem transgênero</option>
            <option>Mulher transgênero</option>
            <option>Não-Binário</option>
            <option>Outro</option>
          </select>

          <select {...register('ethnicity')} className="border rounded p-2">
            <option value="">Etnia/Cor</option>
            <option>Branco</option>
            <option>Preto</option>
            <option>Pardo</option>
            <option>Amarelo</option>
            <option>Indígena</option>
          </select>

          <select {...register('education')} className="border rounded p-2">
            <option value="">Escolaridade</option>
            <option>Não alfabetizado</option>
            <option>Fundamental incompleto</option>
            <option>Fundamental completo</option>
            <option>Médio incompleto</option>
            <option>Médio completo</option>
            <option>Superior incompleto</option>
            <option>Superior completo</option>
            <option>Pós Graduação</option>
          </select>

          <input {...register('household_count')} type="number" placeholder="Quantas pessoas moram na sua casa?" className="border rounded p-2" />
        </div>

        <div className="space-y-2 mt-2">
          <input {...register('role_in_group')} placeholder="Qual sua função dentro do grupo?" className="w-full border rounded p-2" />
          <input {...register('products_services')} placeholder="Quais produtos ou serviços oferece?" className="w-full border rounded p-2" />
          <input {...register('raw_materials')} placeholder="Quais matérias primas utiliza?" className="w-full border rounded p-2" />

          <select {...register('monthly_income_range')} className="border rounded p-2 w-full">
            <option value="">Renda média mensal</option>
            <option>até 1 salário mínimo</option>
            <option>1 a 2 salários mínimos</option>
            <option>2 a 3 salários mínimos</option>
            <option>3 a 4 salários mínimos</option>
            <option>mais de 4 salários mínimos</option>
          </select>

          <input {...register('solidarity_involvement')} placeholder="Qual seu envolvimento com o movimento da economia solidária?" className="w-full border rounded p-2" />

          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('develops_other')} /> Desenvolve outra atividade econômica além do empreendimento?
          </label>

          {developsOther && <input {...register('other_occupation')} placeholder="Descreva a outra atividade" className="w-full border rounded p-2" />}
        </div>

        <div className="flex gap-2 mt-3">
          <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded">+Adicionar Membro</button>
        </div>
      </form>
    </div>
  );
}

/* --- Members preview --- */
function MembersPreview({ members, onRemove }: { members: any[], onRemove: (id: string) => void }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow">
      <h4 className="font-semibold">Membros adicionados ({members.length})</h4>
      <div className="mt-3 space-y-2">
        {members.map(m => (
          <div key={m._id} className="flex items-center justify-between border rounded p-3">
            <div>
              <div className="font-medium">{m.full_name}</div>
              <div className="text-sm text-gray-600">{m.role_in_group} • {m.monthly_income_range}</div>
            </div>
            <div className="flex gap-2">
              <button className="text-red-600" onClick={() => onRemove(m._id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- Helpers --- */
function cryptoRandomId() {
  return Math.random().toString(36).slice(2, 9);
}

async function getUserId() {
  const { data } = await supabase.auth.getSession();
  return (data as any).session.user.id;
}
